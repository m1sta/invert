// Generated by IcedCoffeeScript 1.6.2d
(function() {
  var csv, fs, get, iced, post, redisGraph, __iced_k, __iced_k_noop,
    _this = this;

  iced = require('iced-coffee-script').iced;
  __iced_k = __iced_k_noop = function() {};

  (function() {
    var ___iced_passed_deferral, __iced_deferrals, __iced_k;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    __iced_deferrals = new iced.Deferrals(__iced_k, {
      parent: ___iced_passed_deferral,
      filename: "routes.coffee"
    });
    __iced_deferrals.defer({
      lineno: 0
    });
    __iced_deferrals._fulfill();
  });

  csv = require('csv');

  fs = require('fs');

  redisGraph = require('./graph');

  exports.get = get = {};

  exports.post = post = {};

  get['/test1'] = function(request, response) {
    var friendName, graph, jonathonNode, result, sharedData, sortKeys, startNodeIds, traversal, ___iced_passed_deferral, __iced_deferrals, __iced_k,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "routes.coffee"
      });
      redisGraph.getGraph('testGraph', __iced_deferrals.defer({
        assign_fn: (function() {
          return function() {
            return graph = arguments[0];
          };
        })(),
        lineno: 12
      }));
      __iced_deferrals._fulfill();
    })(function() {
      (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "routes.coffee"
        });
        graph.addIndex("name", __iced_deferrals.defer({
          lineno: 14
        }));
        graph.addInversion("friends", "friends", __iced_deferrals.defer({
          lineno: 15
        }));
        __iced_deferrals._fulfill();
      })(function() {
        (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "routes.coffee"
          });
          graph.addNode({
            id: 1,
            name: "Jonathon",
            friends: [2, 3, 4],
            test: 'failed'
          }, __iced_deferrals.defer({
            lineno: 17
          }));
          graph.addNode({
            id: 2,
            name: "Jeremy",
            friends: [4]
          }, __iced_deferrals.defer({
            lineno: 18
          }));
          graph.addNode({
            id: 3,
            name: "Rebecca",
            friends: [4]
          }, __iced_deferrals.defer({
            lineno: 19
          }));
          graph.addNode({
            id: 4,
            name: "Kate"
          }, __iced_deferrals.defer({
            lineno: 20
          }));
          __iced_deferrals._fulfill();
        })(function() {
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "routes.coffee"
            });
            graph.deleteNode({
              id: 1,
              test: null
            }, __iced_deferrals.defer({
              lineno: 22
            }));
            __iced_deferrals._fulfill();
          })(function() {
            traversal = function(path, queue, data, firstVisit) {
              if (!data.recommended[path[0].name]) {
                data.recommended[path[0].name] = 0;
              }
              data.recommended[path[0].name] += 1 / path.length;
              if (path.length < 4 && firstVisit) {
                return queue.add(-1 * path.length, path, path[0].friends);
              }
            };
            startNodeIds = [1];
            sharedData = {
              recommended: {}
            };
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "routes.coffee"
              });
              graph.traverse(startNodeIds, sharedData, traversal, __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return result = arguments[0];
                  };
                })(),
                lineno: 32
              }));
              __iced_deferrals._fulfill();
            })(function() {
              var _i, _len, _ref;
              sortKeys = function(obj) {
                var key, keyList;
                keyList = [];
                for (key in obj) {
                  keyList.push(key);
                }
                return keyList.sort(function(a, b) {
                  return obj[a] - obj[b];
                });
              };
              _ref = sortKeys(result.recommended);
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                friendName = _ref[_i];
                console.log(friendName + ": " + result.recommended[friendName]);
              }
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "routes.coffee"
                });
                graph.getNode('name', 'Jonathon', __iced_deferrals.defer({
                  assign_fn: (function() {
                    return function() {
                      return jonathonNode = arguments[0];
                    };
                  })(),
                  lineno: 40
                }));
                __iced_deferrals._fulfill();
              })(function() {
                return response.end(JSON.stringify(jonathonNode));
              });
            });
          });
        });
      });
    });
  };

  post['/csv'] = function(request, response) {
    var csvFile, graph, headerArrays, headers, ___iced_passed_deferral, __iced_deferrals, __iced_k;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "routes.coffee"
      });
      redisGraph.getGraph("csv:" + request.files.csv.name, __iced_deferrals.defer({
        assign_fn: (function() {
          return function() {
            return graph = arguments[0];
          };
        })(),
        lineno: 44
      }));
      __iced_deferrals._fulfill();
    })(function() {
      var _ref;
      _ref = [[], {}], headers = _ref[0], headerArrays = _ref[1];
      csvFile = csv().from.stream(fs.createReadStream(request.files.csv.path));
      csvFile.on('record', function(row, index) {
        var i, newNode, _i, _j, _ref1, _ref2, _results;
        console.log('#' + index + ' ' + JSON.stringify(row));
        if (index === 0) {
          headers = row;
          _results = [];
          for (i = _i = 1, _ref1 = row.length; 1 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
            if (row[i] === row[i - 1]) {
              _results.push(headerArrays[row[i]] = true);
            }
          }
          return _results;
        } else {
          newNode = {};
          for (i = _j = 0, _ref2 = row.length; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
            if (row[i]) {
              if (headerArrays[headers[i]]) {
                if (newNode[headers[i]]) {
                  newNode[headers[i]].push(row[i]);
                } else {
                  newNode[headers[i]] = [row[i]];
                }
              } else {
                newNode[headers[i]] = row[i];
              }
            }
          }
          return graph.addNode(newNode);
        }
      });
      return csvFile.on('end', function() {
        return response.end(JSON.stringify({
          success: true,
          filename: request.files.csv.path
        }));
      });
    });
  };

}).call(this);

/*
//@ sourceMappingURL=routes.map
*/
