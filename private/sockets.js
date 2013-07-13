// Generated by IcedCoffeeScript 1.6.2d
(function() {
  var events,
    _this = this;



  exports.events = events = {};

  events['connection'] = function(socket, data) {
    console.log("New connection via socket.io");
    return socket.emit('connectionSuccessful', socket.id);
  };

  events['echo'] = function(socket, data) {
    return socket.emit('response', data);
  };

}).call(this);

/*
//@ sourceMappingURL=sockets.map
*/
