priorityQueue = require("priority_queue")
redis = require("redis")

module.exports.getGraph = (graphName, callback) -> new graph graphName, callback

graph = (graphName, graphCallback) =>

    #todo: add sharding support
    self = this
    redisClient = redis.createClient()

    #todo: there is a memory cost for using verbose keys in redis
    graphPrefix = if graphName then graphName + ":" else "graph:"
    nodePrefix = graphPrefix + "node:"
    indexPrefix = graphPrefix + "index:"
    indexListKey = graphPrefix + "indexes"
    inversionListKey = graphPrefix + "inversions"
    nextNodeIdKey = graphPrefix + "nextNodeId"
    edgeType = {normal:0, inversion:1}

    #rebuild index and inversion caches after restart
    await redisClient.hgetall inversionListKey, defer(err, inversionListCache)
    await redisClient.smembers indexListKey, defer(err, indexListCache)
    if not indexListCache then indexListCache = []
    if not inversionListCache then inversionListCache = {}

    redisObjectToNode = (redisObject) ->
        responseObject = {}
        for key, value of redisObject
            if key.indexOf(":") > -1
                [splitKey, splitValue] = key.split(":", 2)
                if responseObject[splitKey] then responseObject[splitKey].push(splitValue)
                else responseObject[splitKey] = [splitValue]
            else
                responseObject[key] = value
        responseObject

    step = (nodeQueue, data, action, callback) ->
        #todo: restructure to not use the callstack as it causes a graph depth traversal limit
        #todo: make multiple redis calls in parallel up to a prescribed maximum
        #todo: add sharding support
        selectedNode = nodeQueue.remove()
        if selectedNode
            #console.log("traversing node " + selectedNode.nodeId + " with score " + selectedNode.score + " after having followed " + JSON.stringify(selectedNode.path))
            redisClient.hgetall nodePrefix + selectedNode.nodeId, (err, resultNode) ->
                if resultNode
                    path = selectedNode.path.slice(0)
                    for item in path
                        if item.id == selectedNode.nodeId
                            revist = true
                            break
                    path.unshift redisObjectToNode resultNode
                    action path, nodeQueue, data, !revist
                    step nodeQueue, data, action, callback
        else
            if callback instanceof Function then callback data

    this.traverse = (startNodes, data, action, callback) ->
        #action = path, queue, data, firstVisit
        compareFunction = (a, b) -> a.score - b.score
        nodeQueue =
                    internal: priorityQueue.PriorityQueue(compareFunction, [])
                    add: (score, path, nodeId, noBacksies) ->
                        if nodeId instanceof Array
                            previousNodes = []
                            if noBacksies
                                previousNodes.push(nodeItem.id) for nodeItem in path
                            nodeId.forEach (item) => if previousNodes.indexOf(item) == -1 then @internal.push {score: score, path: path, nodeId: item}
                        else if nodeId then @internal.push {score: score, path: path, nodeId: nodeId}
                    remove: () -> @internal.shift()
                    length: () -> @internal.length
                    clear:  () -> @internal = new priorityQueue.PriorityQueue()
        startNodes.forEach (item) -> nodeQueue.add 0, [], item
        step nodeQueue, data, action, callback

    this.addNode = (node, callback) ->

        if not callback then callback = console.dir

        #generate a node id if one has not been passed
        if !node.id
            loop
                await redisClient.incr nextNodeIdKey, defer(err, nextNodeId)
                await redisClient.exists nodePrefix + nextNodeId, defer(err, proposedNodeIdInUse)
                if !proposedNodeIdInUse then break
            node.id = nextNodeId

        redisObject = {}
        for key, value of node
            if value instanceof Array
                for referencedNodeId in value
                    redisObject[key + ":" + referencedNodeId] = edgeType.normal
            else redisObject[key] = value

        await
            redisClient.hmset nodePrefix + node.id, redisObject, defer()
            for key, value of node when key in indexListCache
                redisClient.sadd indexPrefix + key + ":" + value, node.id, defer()
            for key, value of node when key of inversionListCache
                for referencedNodeId in value
                    referencedNodeObject = {id:referencedNodeId}
                    referencedNodeObject[inversionListCache[key] + ":" + node.id] = edgeType.inversion
                    redisClient.hmset nodePrefix + referencedNodeId, referencedNodeObject, defer()

        callback node

    this.deleteNode = (node, callback) ->

        #handle deleteNode(key, prop, callback)
        if arguments[2] instanceof Function
            node = {id:node}
            node[callback] = null
            callback = arguments[2]

        if not callback instanceof Function then callback = ()->

        #handle deleteNode(key, callback)
        if not node instanceof Object
            redisClient.del nodePrefix + node, callback

        #handle deleteNode(nodePropertyDictionary, callback
        else if node.id
            await
                for key, value of node
                    if value instanceof Array
                        for referencedNodeId in value
                            redisClient.hdel nodePrefix + node.id, key + ":" + referencedNodeId, defer()
                            if key of inversionListCache then redisClient.hdel nodePrefix + referencedNodeId, inversionListCache[key] + ":" + node.id, defer()

                    else
                        if key != 'id'
                            redisClient.hdel nodePrefix + node.id, key, defer()
                            redisClient.srem indexPrefix + key + ":" + value, node.id, defer()
            callback true


    this.getNode = () ->

        #handle getNode(nodeId)
        if not arguments[1]
            [nodeId, callback] = arguments
            if not callback then callback = console.dir
            await redisClient.hgetall nodePrefix + nodeId, defer(err, result)
            callback redisObjectToNode result

        #get geNode(indexKey, indexValue)
        else
            [key, value, callback] = arguments
            if not callback then callback = console.dir
            results = []
            redisClient.smembers indexPrefix + key + ":" + value, (err, memberList) ->
                for nodeId in memberList
                    await redisClient.hgetall nodePrefix + nodeId, defer(err, result)
                    results.push redisObjectToNode result
                callback results

    this.addIndex = (propertyName, callback) ->
        if not callback then callback = console.dir
        indexListCache.push propertyName
        redisClient.sadd indexListKey, propertyName, callback

    this.addInversion = (from, to, callback) ->
        if not callback then callback = console.dir
        await
            redisClient.hset inversionListKey, from, to, defer()
            redisClient.hset inversionListKey, to, from, defer()
            inversionListCache[from] = to
            inversionListCache[to] = from
        callback true

    this.removeIndex = (propertyName) ->
        throw "Not implemented"

    this.removeInversion = (from, to) ->
        throw "Not implemented"

    this.rebuild = (jsonNodes) ->
        #useful if indexes and inversions added after data
        #if jsonNodes then deletes everything in the database and replaces it with something from a json string
        throw "Not implemented"

    this.getAllNodes = (expand, callback) ->
        if expand instanceof Function
            callback = expand
            expand = false
        if not callback then callback = console.dir

        redisClient.keys nodePrefix + "*", (err, results) ->
            formattedResult = []
            if not expand
                formattedResult.push redisNodeId.split(":", 3)[2] for redisNodeId in results
                callback formattedResult
            else
                for redisNodeId, index in results
                    redisClient.hgetall redisNodeId, (err, result) ->
                        formattedResult.push redisObjectToNode result
                        if formattedResult.length == results.length then callback formattedResult

    this.createTraversal = () ->
        #helper to allow definition of a traversal function using Gremlin-like syntax ie. g.v('name', 'Jonathon').friends.friends
        throw "Not implemented"

    if graphCallback instanceof Function then graphCallback self