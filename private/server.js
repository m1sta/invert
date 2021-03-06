// Generated by IcedCoffeeScript 1.6.2d
(function() {
  var app, express, fs, http, io, port, routes, server, socketServer, sockets;



  express = require("express");

  io = require("socket.io");

  http = require("http");

  sockets = require("./sockets");

  routes = require("./routes");

  fs = require("fs");

  app = express();

  app.configure(function() {
    var key, _results;
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express["static"]("../public"));
    app.get("/", function(req, res) {
      return res.redirect("index.htm");
    });
    for (key in routes.get) {
      app.get(key, routes.get[key]);
    }
    _results = [];
    for (key in routes.post) {
      _results.push(app.post(key, routes.post[key]));
    }
    return _results;
  });

  port = 80;

  server = http.createServer(app);

  server.listen(port, function() {
    return console.log("Express server listening on port %d in %s mode", port, app.settings.env);
  });

  socketServer = io.listen(server);

  socketServer.set("log level", 2);

  socketServer.sockets.on("connection", function(socket, data) {
    var key, _results;
    if (sockets.events["connection"]) {
      sockets.events["connection"](socket, data);
    }
    _results = [];
    for (key in sockets.events) {
      _results.push(socket.on(key, function(data) {
        console.log(socket.id);
        return sockets.events[key](socket, data);
      }));
    }
    return _results;
  });

}).call(this);

/*
//@ sourceMappingURL=server.map
*/
