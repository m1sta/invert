// Generated by IcedCoffeeScript 1.6.2d
(function() {
  var iced, pad, result, resultString, sharedData, test, testFail, testName, testPass, tests, __iced_deferrals, __iced_k, __iced_k_noop,
    _this = this;

  iced = require('iced-coffee-script').iced;
  __iced_k = __iced_k_noop = function() {};

  tests = {};

  sharedData = {};

  tests['init graph data'] = function(assert) {
    var g, ___iced_passed_deferral, __iced_deferrals, __iced_k,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    g = require('./graph');
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "test.coffee"
      });
      g.getGraph(__iced_deferrals.defer({
        assign_fn: (function(__slot_1, __slot_2) {
          return function() {
            return __slot_1[__slot_2] = arguments[0];
          };
        })(sharedData, 'graph'),
        lineno: 6
      }));
      __iced_deferrals._fulfill();
    })(function() {
      return assert(true);
    });
  };

  tests['add node'] = function(assert) {
    var Jonathon, g, nodeList, ___iced_passed_deferral, __iced_deferrals, __iced_k,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    g = sharedData['graph'];
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "test.coffee"
      });
      g.addInversion('friends', 'friends', __iced_deferrals.defer({
        lineno: 11
      }));
      __iced_deferrals._fulfill();
    })(function() {
      (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "test.coffee"
        });
        g.addNode({
          id: "Jonathon",
          friends: ["Rebecca", "Jeremy"],
          phone: "0415 837 221"
        }, __iced_deferrals.defer({
          assign_fn: (function() {
            return function() {
              return Jonathon = arguments[0];
            };
          })(),
          lineno: 12
        }));
        __iced_deferrals._fulfill();
      })(function() {
        (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "test.coffee"
          });
          g.getAllNodes(true, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return nodeList = arguments[0];
              };
            })(),
            lineno: 13
          }));
          __iced_deferrals._fulfill();
        })(function() {
          return assert(nodeList.length === 3);
        });
      });
    });
  };

  tests['arbitrary fluid query example'] = function(assert) {
    var g, result, ___iced_passed_deferral, __iced_deferrals, __iced_k,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    g = sharedData['graph'];
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "test.coffee"
      });
      g.v().map(function(i) {
        return {
          name: i.item.id,
          friends: i.item.friends
        };
      }).as(__iced_deferrals.defer({
        assign_fn: (function() {
          return function() {
            return result = arguments[0];
          };
        })(),
        lineno: 18
      }));
      __iced_deferrals._fulfill();
    })(function() {
      return assert(result.length === 3);
    });
  };

  tests['wife'] = function(assert) {
    var Rebecca, g, ___iced_passed_deferral, __iced_deferrals, __iced_k,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    g = sharedData['graph'];
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "test.coffee"
      });
      g.addInversion("husband", "wife", __iced_deferrals.defer({
        lineno: 23
      }));
      __iced_deferrals._fulfill();
    })(function() {
      (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "test.coffee"
        });
        g.addNode({
          id: "Rebecca",
          husband: ["Jonathon"]
        }, __iced_deferrals.defer({
          lineno: 24
        }));
        __iced_deferrals._fulfill();
      })(function() {
        (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "test.coffee"
          });
          g.v("Jonathon").get("wife").as(__iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return Rebecca = arguments[0];
              };
            })(),
            lineno: 25
          }));
          __iced_deferrals._fulfill();
        })(function() {
          return assert(Rebecca[0].husband[0] === "Jonathon");
        });
      });
    });
  };

  console.log("-------------------------------------------------------------");

  testPass = 0;

  testFail = 0;

  pad = function(s) {
    return ("                                                          " + s).slice(-35);
  };

  (function(__iced_k) {
    var _i, _k, _keys, _ref, _results, _while;
    _ref = tests;
    _keys = (function() {
      var _results1;
      _results1 = [];
      for (_k in _ref) {
        _results1.push(_k);
      }
      return _results1;
    })();
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
      if (!(_i < _keys.length)) {
        return _break();
      } else {
        testName = _keys[_i];
        test = _ref[testName];
        process.stdout.write(pad(testName) + ": ");
        (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            filename: "test.coffee"
          });
          test(__iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return result = arguments[0];
              };
            })(),
            lineno: 34
          }));
          __iced_deferrals._fulfill();
        })(function() {
          if (result) {
            resultString = "pass";
            testPass++;
          } else {
            resultString = "fail";
            testFail++;
          }
          return _next(process.stdout.write(resultString + "\r"));
        });
      }
    };
    _while(__iced_k);
  })(function() {
    return console.log("-------------------------------------------------------------");
  });

}).call(this);

/*
//@ sourceMappingURL=test.map
*/
