express = require("express")
io = require("socket.io")
http = require("http")
sockets = require("./sockets")
routes = require("./routes")
fs = require("fs")

#configure express
app = express()
app.configure ->
    app.use express.bodyParser()
    app.use express.methodOverride()
    app.use app.router
    app.use express.static("../public")
    app.get "/", (req, res) ->
        res.redirect "index.htm"

    for key of routes.get
        app.get key, routes.get[key]
    for key of routes.post
        app.post key, routes.post[key]

#start http server
port = 80
server = http.createServer(app)
server.listen port, ->
    console.log "Express server listening on port %d in %s mode", port, app.settings.env

#start socket.io server
socketServer = io.listen(server)
socketServer.set "log level", 2
socketServer.sockets.on "connection", (socket, data) ->
    sockets.events["connection"] socket, data    if sockets.events["connection"]
    for key of sockets.events
        socket.on key, (data) ->
            console.log socket.id
            sockets.events[key] socket, data

#end
