exports.events = events = {};

events['connection'] =  (socket, data) => 
    console.log("New connection via socket.io");
    socket.emit('connectionSuccessful', socket.id)

events['echo'] = (socket, data) =>
    socket.emit('response', data) #closure not forming around socket