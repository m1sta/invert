// Generated by IcedCoffeeScript 1.6.2d
(function() {
  var graph, iced, priorityQueue, redis, __iced_k, __iced_k_noop,
    _this = this,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  iced = require('iced-coffee-script').iced;
  __iced_k = __iced_k_noop = function() {};

  priorityQueue = require("priority_queue");

  redis = require("redis");

  module.exports.getGraph = function(graphName, callback) {
    return new graph(graphName, callback);
  };

  graph = function(graphName, graphCallback) {
    var edgeType, err, graphPrefix, indexListCache, indexListKey, indexPrefix, inversionListCache, inversionListKey, nextNodeIdKey, nodePrefix, redisClient, redisObjectToNode, self, step, ___iced_passed_deferral, __iced_deferrals, __iced_k;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    self = _this;
    redisClient = redis.createClient();
    graphPrefix = graphName ? graphName + ":" : "graph:";
    nodePrefix = graphPrefix + "node:";
    indexPrefix = graphPrefix + "index:";
    indexListKey = graphPrefix + "indexes";
    inversionListKey = graphPrefix + "inversions";
    nextNodeIdKey = graphPrefix + "nextNodeId";
    edgeType = {
      normal: 0,
      inversion: 1
    };
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "graph.coffee",
        funcname: "graph"
      });
      redisClient.hgetall(inversionListKey, __iced_deferrals.defer({
        assign_fn: (function() {
          return function() {
            err = arguments[0];
            return inversionListCache = arguments[1];
          };
        })(),
        lineno: 22
      }));
      __iced_deferrals._fulfill();
    })(function() {
      (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "graph.coffee",
          funcname: "graph"
        });
        redisClient.smembers(indexListKey, __iced_deferrals.defer({
          assign_fn: (function() {
            return function() {
              err = arguments[0];
              return indexListCache = arguments[1];
            };
          })(),
          lineno: 23
        }));
        __iced_deferrals._fulfill();
      })(function() {
        if (!indexListCache) {
          indexListCache = [];
        }
        if (!inversionListCache) {
          inversionListCache = {};
        }
        redisObjectToNode = function(redisObject) {
          var key, responseObject, splitKey, splitValue, value, _ref;
          responseObject = {};
          for (key in redisObject) {
            value = redisObject[key];
            if (key.indexOf(":") > -1) {
              _ref = key.split(":", 2), splitKey = _ref[0], splitValue = _ref[1];
              if (responseObject[splitKey]) {
                responseObject[splitKey].push(splitValue);
              } else {
                responseObject[splitKey] = [splitValue];
                responseObject[splitKey].add = function(node) {
                  var _ref1, _ref2;
                  if (node instanceof Function && (_ref1 = !node.id, __indexOf.call(this, _ref1) >= 0)) {
                    return this.push(node.id);
                  } else if (_ref2 = !node, __indexOf.call(this, _ref2) >= 0) {
                    return this.push(node);
                  }
                };
                responseObject[splitKey].remove = function(node) {
                  var index, item, _i, _j, _len, _len1, _results, _results1;
                  if (node instanceof Function && node.id) {
                    _results = [];
                    for (index = _i = 0, _len = this.length; _i < _len; index = ++_i) {
                      item = this[index];
                      if (item === node.id) {
                        _results.push(x.pop(index));
                      }
                    }
                    return _results;
                  } else if (node) {
                    _results1 = [];
                    for (index = _j = 0, _len1 = this.length; _j < _len1; index = ++_j) {
                      item = this[index];
                      if (item === node) {
                        _results1.push(x.pop(index));
                      }
                    }
                    return _results1;
                  }
                };
              }
            } else {
              responseObject[key] = value;
            }
          }
          return responseObject;
        };
        step = function(nodeQueue, data, action, callback) {
          var selectedNode;
          selectedNode = nodeQueue.remove();
          if (selectedNode) {
            return redisClient.hgetall(nodePrefix + selectedNode.nodeId, function(err, resultNode) {
              var item, path, revist, _i, _len;
              if (resultNode) {
                path = selectedNode.path.slice(0);
                for (_i = 0, _len = path.length; _i < _len; _i++) {
                  item = path[_i];
                  if (item.id === selectedNode.nodeId) {
                    revist = true;
                    break;
                  }
                }
                path.unshift(redisObjectToNode(resultNode));
                action(path, nodeQueue, data, !revist);
                return step(nodeQueue, data, action, callback);
              }
            });
          } else {
            if (callback instanceof Function) {
              return callback(data);
            }
          }
        };
        _this.traverse = function(startNodes, data, action, callback) {
          var compareFunction, nodeQueue;
          compareFunction = function(a, b) {
            return a.score - b.score;
          };
          nodeQueue = {
            internal: priorityQueue.PriorityQueue(compareFunction, []),
            add: function(score, path, nodeId, noBacksies) {
              var nodeItem, previousNodes, _i, _len,
                _this = this;
              if (nodeId instanceof Array) {
                previousNodes = [];
                if (noBacksies) {
                  for (_i = 0, _len = path.length; _i < _len; _i++) {
                    nodeItem = path[_i];
                    previousNodes.push(nodeItem.id);
                  }
                }
                return nodeId.forEach(function(item) {
                  if (previousNodes.indexOf(item) === -1) {
                    return _this.internal.push({
                      score: score,
                      path: path,
                      nodeId: item
                    });
                  }
                });
              } else if (nodeId) {
                return this.internal.push({
                  score: score,
                  path: path,
                  nodeId: nodeId
                });
              }
            },
            remove: function() {
              return this.internal.shift();
            },
            length: function() {
              return this.internal.length;
            },
            clear: function() {
              return this.internal = new priorityQueue.PriorityQueue();
            }
          };
          startNodes.forEach(function(item) {
            return nodeQueue.add(0, [], item);
          });
          return step(nodeQueue, data, action, callback);
        };
        _this.addNode = function(node, callback) {
          var err, key, nextNodeId, proposedNodeIdInUse, redisObject, referencedNodeId, referencedNodeObject, value, ___iced_passed_deferral1, __iced_deferrals, __iced_k,
            _this = this;
          __iced_k = __iced_k_noop;
          ___iced_passed_deferral1 = iced.findDeferral(arguments);
          if (!callback) {
            callback = console.dir;
          }
          (function(__iced_k) {
            if (!node.id) {
              (function(__iced_k) {
                var _results, _while;
                _results = [];
                _while = function(__iced_k) {
                  var _break, _continue, _next;
                  _break = function() {
                    return __iced_k(_results);
                  };
                  _continue = function() {
                    return iced.trampoline(function() {
                      return _while(__iced_k);
                    });
                  };
                  _next = function(__iced_next_arg) {
                    _results.push(__iced_next_arg);
                    return _continue();
                  };
                  if (!true) {
                    return _break();
                  } else {
                    (function(__iced_k) {
                      __iced_deferrals = new iced.Deferrals(__iced_k, {
                        parent: ___iced_passed_deferral1,
                        filename: "graph.coffee",
                        funcname: "addNode"
                      });
                      redisClient.incr(nextNodeIdKey, __iced_deferrals.defer({
                        assign_fn: (function() {
                          return function() {
                            err = arguments[0];
                            return nextNodeId = arguments[1];
                          };
                        })(),
                        lineno: 92
                      }));
                      __iced_deferrals._fulfill();
                    })(function() {
                      (function(__iced_k) {
                        __iced_deferrals = new iced.Deferrals(__iced_k, {
                          parent: ___iced_passed_deferral1,
                          filename: "graph.coffee",
                          funcname: "addNode"
                        });
                        redisClient.exists(nodePrefix + nextNodeId, __iced_deferrals.defer({
                          assign_fn: (function() {
                            return function() {
                              err = arguments[0];
                              return proposedNodeIdInUse = arguments[1];
                            };
                          })(),
                          lineno: 93
                        }));
                        __iced_deferrals._fulfill();
                      })(function() {
                        (function(__iced_k) {
                          if (!proposedNodeIdInUse) {
                            (function(__iced_k) {
_break()
                            })(__iced_k);
                          } else {
                            return __iced_k();
                          }
                        })(_next);
                      });
                    });
                  }
                };
                _while(__iced_k);
              })(function() {
                return __iced_k(node.id = nextNodeId);
              });
            } else {
              return __iced_k();
            }
          })(function() {
            var _i, _len;
            redisObject = {};
            for (key in node) {
              value = node[key];
              if (value instanceof Array) {
                for (_i = 0, _len = value.length; _i < _len; _i++) {
                  referencedNodeId = value[_i];
                  redisObject[key + ":" + referencedNodeId] = edgeType.normal;
                }
                value.add = function(node) {
                  var _ref, _ref1;
                  if (node instanceof Function && (_ref = !node.id, __indexOf.call(this, _ref) >= 0)) {
                    return this.push(node.id);
                  } else if (_ref1 = !node, __indexOf.call(this, _ref1) >= 0) {
                    return this.push(node);
                  }
                };
                value.remove = function(node) {
                  var index, item, _j, _k, _len1, _len2, _results, _results1;
                  if (node instanceof Function && node.id) {
                    _results = [];
                    for (index = _j = 0, _len1 = this.length; _j < _len1; index = ++_j) {
                      item = this[index];
                      if (item === node.id) {
                        _results.push(x.pop(index));
                      }
                    }
                    return _results;
                  } else if (node) {
                    _results1 = [];
                    for (index = _k = 0, _len2 = this.length; _k < _len2; index = ++_k) {
                      item = this[index];
                      if (item === node) {
                        _results1.push(x.pop(index));
                      }
                    }
                    return _results1;
                  }
                };
              } else {
                redisObject[key] = value;
              }
            }
            (function(__iced_k) {
              var _j, _len1;
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral1,
                filename: "graph.coffee",
                funcname: "addNode"
              });
              redisClient.hmset(nodePrefix + node.id, redisObject, __iced_deferrals.defer({
                lineno: 111
              }));
              for (key in node) {
                value = node[key];
                if (__indexOf.call(indexListCache, key) >= 0) {
                  redisClient.sadd(indexPrefix + key + ":" + value, node.id, __iced_deferrals.defer({
                    lineno: 113
                  }));
                }
              }
              for (key in node) {
                value = node[key];
                if (key in inversionListCache) {
                  for (_j = 0, _len1 = value.length; _j < _len1; _j++) {
                    referencedNodeId = value[_j];
                    referencedNodeObject = {
                      id: referencedNodeId
                    };
                    referencedNodeObject[inversionListCache[key] + ":" + node.id] = edgeType.inversion;
                    redisClient.hmset(nodePrefix + referencedNodeId, referencedNodeObject, __iced_deferrals.defer({
                      lineno: 118
                    }));
                  }
                }
              }
              __iced_deferrals._fulfill();
            })(function() {
              return callback(node);
            });
          });
        };
        _this.deleteNode = function(node, callback) {
          var key, referencedNodeId, value, ___iced_passed_deferral1, __iced_deferrals, __iced_k,
            _this = this;
          __iced_k = __iced_k_noop;
          ___iced_passed_deferral1 = iced.findDeferral(arguments);
          if (arguments[2] instanceof Function) {
            node = {
              id: node
            };
            node[callback] = null;
            callback = arguments[2];
          }
          if (!callback instanceof Function) {
            callback = function() {};
          }
          if (!node instanceof Object) {
            return __iced_k(redisClient.del(nodePrefix + node, callback));
          } else {
            (function(__iced_k) {
              if (node.id) {
                (function(__iced_k) {
                  var _i, _len;
                  __iced_deferrals = new iced.Deferrals(__iced_k, {
                    parent: ___iced_passed_deferral1,
                    filename: "graph.coffee",
                    funcname: "deleteNode"
                  });
                  for (key in node) {
                    value = node[key];
                    if (value instanceof Array) {
                      for (_i = 0, _len = value.length; _i < _len; _i++) {
                        referencedNodeId = value[_i];
                        redisClient.hdel(nodePrefix + node.id, key + ":" + referencedNodeId, __iced_deferrals.defer({
                          lineno: 142
                        }));
                        if (key in inversionListCache) {
                          redisClient.hdel(nodePrefix + referencedNodeId, inversionListCache[key] + ":" + node.id, __iced_deferrals.defer({
                            lineno: 143
                          }));
                        }
                      }
                    } else {
                      if (key !== 'id') {
                        redisClient.hdel(nodePrefix + node.id, key, __iced_deferrals.defer({
                          lineno: 147
                        }));
                        redisClient.srem(indexPrefix + key + ":" + value, node.id, __iced_deferrals.defer({
                          lineno: 148
                        }));
                      }
                    }
                  }
                  __iced_deferrals._fulfill();
                })(function() {
                  return __iced_k(callback(true));
                });
              } else {
                return __iced_k();
              }
            })(__iced_k);
          }
        };
        _this.getNode = function() {
          var callback, err, key, nodeId, result, results, value, ___iced_passed_deferral1, __iced_deferrals, __iced_k,
            _arguments = arguments,
            _this = this;
          __iced_k = __iced_k_noop;
          ___iced_passed_deferral1 = iced.findDeferral(arguments);
          if (!arguments[1]) {
            nodeId = arguments[0], callback = arguments[1];
            if (!callback) {
              callback = console.dir;
            }
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral1,
                filename: "graph.coffee",
                funcname: "getNode"
              });
              redisClient.hgetall(nodePrefix + nodeId, __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    err = arguments[0];
                    return result = arguments[1];
                  };
                })(),
                lineno: 158
              }));
              __iced_deferrals._fulfill();
            })(function() {
              return __iced_k(callback(redisObjectToNode(result)));
            });
          } else {
            key = _arguments[0], value = _arguments[1], callback = _arguments[2];
            if (!callback) {
              callback = console.dir;
            }
            results = [];
            return __iced_k(redisClient.smembers(indexPrefix + key + ":" + value, function(err, memberList) {
              var err, result, ___iced_passed_deferral2, __iced_deferrals, __iced_k,
                _this = this;
              __iced_k = __iced_k_noop;
              ___iced_passed_deferral2 = iced.findDeferral(arguments);
              (function(__iced_k) {
                var _i, _len, _ref, _results, _while;
                _ref = memberList;
                _len = _ref.length;
                _i = 0;
                _results = [];
                _while = function(__iced_k) {
                  var _break, _continue, _next;
                  _break = function() {
                    return __iced_k(_results);
                  };
                  _continue = function() {
                    return iced.trampoline(function() {
                      ++_i;
                      return _while(__iced_k);
                    });
                  };
                  _next = function(__iced_next_arg) {
                    _results.push(__iced_next_arg);
                    return _continue();
                  };
                  if (!(_i < _len)) {
                    return _break();
                  } else {
                    nodeId = _ref[_i];
                    (function(__iced_k) {
                      __iced_deferrals = new iced.Deferrals(__iced_k, {
                        parent: ___iced_passed_deferral2,
                        filename: "graph.coffee"
                      });
                      redisClient.hgetall(nodePrefix + nodeId, __iced_deferrals.defer({
                        assign_fn: (function() {
                          return function() {
                            err = arguments[0];
                            return result = arguments[1];
                          };
                        })(),
                        lineno: 168
                      }));
                      __iced_deferrals._fulfill();
                    })(function() {
                      return _next(results.push(redisObjectToNode(result)));
                    });
                  }
                };
                _while(__iced_k);
              })(function() {
                return callback(results);
              });
            }));
          }
        };
        _this.addIndex = function(propertyName, callback) {
          if (!callback) {
            callback = console.dir;
          }
          indexListCache.push(propertyName);
          return redisClient.sadd(indexListKey, propertyName, callback);
        };
        _this.addInversion = function(from, to, callback) {
          var ___iced_passed_deferral1, __iced_deferrals, __iced_k,
            _this = this;
          __iced_k = __iced_k_noop;
          ___iced_passed_deferral1 = iced.findDeferral(arguments);
          if (!callback) {
            callback = console.dir;
          }
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral1,
              filename: "graph.coffee",
              funcname: "addInversion"
            });
            redisClient.hset(inversionListKey, from, to, __iced_deferrals.defer({
              lineno: 180
            }));
            redisClient.hset(inversionListKey, to, from, __iced_deferrals.defer({
              lineno: 181
            }));
            inversionListCache[from] = to;
            inversionListCache[to] = from;
            __iced_deferrals._fulfill();
          })(function() {
            return callback(true);
          });
        };
        _this.removeIndex = function(propertyName) {
          throw "Not implemented";
        };
        _this.removeInversion = function(from, to) {
          throw "Not implemented";
        };
        _this.rebuild = function(jsonNodes) {
          throw "Not implemented";
        };
        _this.getAllNodes = function(expand, callback) {
          if (expand instanceof Function) {
            callback = expand;
            expand = false;
          }
          if (!callback) {
            callback = console.dir;
          }
          return redisClient.keys(nodePrefix + "*", function(err, results) {
            var formattedResult, index, redisNodeId, _i, _j, _len, _len1, _results;
            formattedResult = [];
            if (!expand) {
              for (_i = 0, _len = results.length; _i < _len; _i++) {
                redisNodeId = results[_i];
                formattedResult.push(redisNodeId.split(":", 3)[2]);
              }
              return callback(formattedResult);
            } else {
              _results = [];
              for (index = _j = 0, _len1 = results.length; _j < _len1; index = ++_j) {
                redisNodeId = results[index];
                _results.push(redisClient.hgetall(redisNodeId, function(err, result) {
                  formattedResult.push(redisObjectToNode(result));
                  if (formattedResult.length === results.length) {
                    return callback(formattedResult);
                  }
                }));
              }
              return _results;
            }
          });
        };
        _this.createTraversal = function() {
          /*
          todo: implement fluid query execution engine
          Helper to allow definition of traversal functions using fluid syntax inspired by Gremlin and Linq ie. g.v('name', 'Jonathon').friends.friends.as('result').
          Due to the async nature of database calls and the lack of object proxies until es.next need to make sure everything is a function
          ie. g.v('name','Jonathon').get('friends').get('friends').filter((i)->i.country == 'Australia').as(defer result)
          */

          var addTraversalFunctions, result;
          addTraversalFunctions = function(obj) {
            obj._steps = obj._steps || [];
            obj.v = function() {
              obj._steps.push('v', arguments);
              return obj;
            };
            obj.e = function() {
              obj._steps.push('e', arguments);
              return obj;
            };
            obj.get = function() {
              obj._steps.push('get', arguments);
              return obj;
            };
            obj.loop = function() {
              obj._steps.push('loop', arguments);
              return obj;
            };
            obj.group = function() {
              obj._steps.push('group', arguments);
              return obj;
            };
            obj.filter = function() {
              obj._steps.push('filter', arguments);
              return obj;
            };
            obj.as = function() {
              if (!arguments[0] instanceof Function) {
                obj._steps.push('as', arguments);
                return obj;
              } else {
                throw "Not implemented";
              }
            };
            return obj;
          };
          return result = addTraversalFunctions({
            _graph: this
          });
        };
        if (graphCallback instanceof Function) {
          return graphCallback(self);
        }
      });
    });
  };

}).call(this);

/*
//@ sourceMappingURL=graph.map
*/
