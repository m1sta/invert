priorityQueue = require("priority_queue")
redis = require("redis")

module.exports.getGraph = (graphName, callback) -> new graph graphName, callback

#use of fat arrow to allow easy use of library within the iced repl (g = require('graph'); g.getGraph('test')). Can't currently get defer(varName) working in repl so this is necessary.
graph = (graphName, graphCallback, redisClient) =>

    #support optional graphname
    if graphName instanceof Function
        redisClient = graphCallback
        graphCallback = graphName
        graphName = ""

    #todo: add sharding support
    self = this
    redisClient = redisClient or redis.createClient()

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
                else
                    responseObject[splitKey] = [splitValue]
                    Object.defineProperty responseObject[splitKey], "add", {enumerable: false, configurable: true, writable: true}
                    Object.defineProperty responseObject[splitKey], "remove", {enumerable: false, configurable: true, writable: true}
                    responseObject[splitKey].add = (node) ->
                        if node instanceof Object and not node.id in this then this.push(node.id)
                        else if not node in this then this.push(node)
                    responseObject[splitKey].remove = (node) ->
                        if node instanceof Object and node.id then this.pop(index) for item,index in this when item == node.id
                        else if node then this.pop(index) for item,index in this when item == node
            else
                responseObject[key] = value
        responseObject

    step = (nodeQueue, data, action, callback) ->
        #todo: restructure to not use the callstack as it causes a graph depth traversal limit
        #todo: make multiple redis calls in parallel up to a prescribed maximum
        #todo: add sharding support
        #todo: add node caching either here so that each traversal always sees the same node (preferred), alternatively add it to getNode()
        #todo: make path tracking optional
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

    this.getConfig = () ->
        return {indexes: indexListCache, inversions: inversionListCache, graphName: graphPrefix.slice(0,-1)}

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
                Object.defineProperty value, "add", {enumerable: false, configurable: true, writable: true}
                Object.defineProperty value, "remove", {enumerable: false, configurable: true, writable: true}
                value.add = (referenceNode) ->
                    if referenceNode instanceof Object and not referenceNode.id in value then value.push(referenceNode.id)
                    else if not referenceNode in value then value.push(referenceNode)
                value.remove = (referenceNode) ->
                    if referenceNode instanceof Object and referenceNode.id then value.pop(index) for item,index in value when item == referenceNode.id
                    else if referenceNode then value.pop(index) for item,index in value when item == referenceNode
            else if not (value instanceof Function) then redisObject[key] = value

        await
            redisClient.hmset nodePrefix + node.id, redisObject, defer()
            for key, value of node when key in indexListCache
                redisClient.sadd indexPrefix + key + ":" + value, node.id, defer()
            for key, value of node when key of inversionListCache
                for referencedNodeId in value
                    referencedNodeObject = {id:referencedNodeId}
                    referencedNodeObject[inversionListCache[key] + ":" + node.id] = edgeType.inversion
                    redisClient.hmset nodePrefix + referencedNodeId, referencedNodeObject, defer()

        (callback or console.dir) node

    this.removeNode = (node, callback) ->

        #todo: clean this up, difficult to understand what it does given a particular set of parameters

        #handle deleteNode(key, prop, callback)
        if arguments[2] instanceof Function
            node = {id:node}
            node[callback] = null
            callback = arguments[2]

        if not (callback instanceof Function) then callback = ()->

        #handle deleteNode(key, callback)
        if not (node instanceof Object)
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
        if not arguments[2]
            [nodeId, callback] = arguments
            if not callback then callback = console.dir
            await redisClient.hgetall nodePrefix + nodeId, defer(err, result)
            callback redisObjectToNode result

        #get geNode(indexKey, indexValue)
        else
            [key, value, callback] = arguments
            results = []
            redisClient.smembers indexPrefix + key + ":" + value, (err, memberList) ->
                for nodeId in memberList
                    await redisClient.hgetall nodePrefix + nodeId, defer(err, result)
                    results.push redisObjectToNode result
                (callback or console.dir) results

    this.addIndex = (propertyName, callback) ->
        indexListCache.push propertyName
        redisClient.sadd indexListKey, propertyName, (callback or console.dir)

    this.addInversion = (from, to, callback) ->
        if not callback then callback = console.dir
        await
            redisClient.hset inversionListKey, from, to, defer()
            redisClient.hset inversionListKey, to, from, defer()
            inversionListCache[from] = to
            inversionListCache[to] = from
        callback true

    this.removeIndex = (propertyName) ->
        #todo:implement removeIndex. It's just a simple set of redis delete statements
        throw "Not implemented"

    this.removeInversion = (from, to) ->
        #todo: implement removeInversion. Need to make that inverted references are removed by comparing the value of the edge to the edgeType enum
        throw "Not implemented"

    this.rebuild = (jsonNodes) ->
        #todo: implement rebuild. Low priority.
        #useful if indexes and inversions added after data
        #if jsonNodes then deletes everything in the database and replaces it with something from a json string
        throw "Not implemented"

    this.getAllNodes = (expand, callback) ->
        if expand instanceof Function
            callback = expand
            expand = false

        redisClient.keys nodePrefix + "*", (err, results) ->
            formattedResult = []
            if not expand
                formattedResult.push redisNodeId.split(":", 3)[2] for redisNodeId in results
                (callback or console.dir) formattedResult
            else
                for redisNodeId, index in results
                    redisClient.hgetall redisNodeId, (err, result) ->
                        formattedResult.push redisObjectToNode result
                        if formattedResult.length == results.length then (callback or console.dir) formattedResult

    this.v = this.find = () ->
        ###
        todo: implement fluid query execution engine
        todo: add caching for getNode
        Helper to allow definition of traversal functions using fluid syntax inspired by Gremlin and Linq ie. g.v('name', 'Jonathon').friends.friends.as('result').
        Due to the async nature of database calls and the lack of object proxies until es.next need to make sure everything is a function
        ie. g.v('name','Jonathon').get('friends').get('friends').filter((i)->i.country == 'Australia').as(defer result)
        ###

        executeNextStep = (obj) ->
            obj._namedSteps = obj._namedSteps or {}
            obj._stepIndex = obj._stepIndex + 1 or 0
            obj._lastResult = obj._lastResult || null
            obj._loops = obj._loops || {}

            isActive = (traversalItem) ->
                for loopId of obj._loops
                    if !traversalItem.loops[loopId]
                        return false
                return true


            if obj._stepIndex < obj._steps.length
                currentStep = obj._steps[obj._stepIndex]

                if currentStep.c is 'as'
                    #save results of a step as named key/value pair in the results dictionary and/or output the results of the query to the provided callback function
                    stepName = if currentStep.a[0].constructor is String then currentStep.a[0] else "result"
                    if currentStep.a[0] instanceof Function then cb = currentStep.a[0]
                    else if currentStep.a[1] instanceof Function then cb = currentStep.a[1]
                    outputData = []

                    for traversalItem, index in obj._lastResult
                        if !isActive traversalItem then stepResults.push traversalItem
                        else
                            traversalItem.data[stepName] = traversalItem.currentItem
                            if cb then outputData.push traversalItem.data
                            else traversalItem.path.unshift traversalItem.currentItem

                    if cb
                        testKey = null
                        shrink = true
                        for item in outputData
                            for key, value of item
                                if !testKey then testKey = key
                                else if testKey != key
                                    shrink = false
                                    break
                            if !shrink then break
                        if shrink
                            shrunkOutputData = (item[testKey] for item in outputData)
                            cb shrunkOutputData
                        else cb outputData
                    else
                        obj._namedSteps[stepName] = obj._stepIndex
                        executeNextStep obj

                else if currentStep.c is 'v'
                    #node retrieval via id or index lookup, usually used to start a query. if no parameters it returns all nodes. node list can be an array of node id's or index values
                    if currentStep.a.length > 1
                        nodeIdList = currentStep.a[1]
                        indexName = currentStep.a[0]
                    else
                        nodeIdList = currentStep.a[0]
                        indexName = null

                    if not (nodeIdList instanceof Array) then nodeIdList = [nodeIdList]

                    if !nodeIdList[0]
                        await obj._graph.getAllNodes(true, defer stepResults)
                    else
                        stepResults = []
                        await
                            for nodeId, index in nodeIdList
                                if indexName then obj._graph.getNode indexName, nodeId, defer stepResults[index]
                                else obj._graph.getNode nodeId, defer stepResults[index]

                    obj._lastResult = ({currentItem:item, path:[], loops:{}, data:{}} for item in stepResults) #todo: allow the 'v' command part way through
                    executeNextStep obj

                else if currentStep.c is 'e'
                    #similar to 'get' but for all edges, not likely to be implemented any time soon
                    throw 'Not implemented'

                else if currentStep.c is 'get'
                    #get the value of a particular property
                    stepResults = []

                    for traversalItem, traversalItemIndex in obj._lastResult
                        if !isActive traversalItem then stepResults.push traversalItem
                        else
                            currentNode = traversalItem.currentItem
                            if currentNode.constructor is Number then await obj._graph.getNode(currentNode, defer currentNode)
                            if currentNode[currentStep.a[0]] instanceof Array
                                for nodeId, nodeIdIndex in currentNode[currentStep.a[0]]
                                    await obj._graph.getNode(nodeId, defer expandedItem) #todo: move the await so that this is done in parallel
                                    outputPath = traversalItem.path.slice()
                                    outputPath.unshift currentNode
                                    stepResults.push {currentItem: expandedItem, path:outputPath, loops:traversalItem.loops, data:traversalItem.data}
                            else
                                outputPath = traversalItem.path.slice()
                                outputPath.unshift traversalItem.currentItem
                                stepResults.push {currentItem: currentNode[currentStep.a[0]], path:outputPath, loops: traversalItem.loops, data:traversalItem.data}

                    obj._lastResult = stepResults # should it be returning something {node:result, path:x, loops:x}
                    executeNextStep obj

                else if currentStep.c is 'filter'
                    #only outputs paths which match the provided predicate
                    stepResults = []
                    for traversalItem, index in obj._lastResult
                        if !isActive traversalItem then stepResults.push traversalItem
                        else
                            if currentStep.a[0]({item: traversalItem.currentItem, path: traversalItem.path, data: traversalItem.data, loops:obj._loops[obj._stepIndex]})
                                traversalItem.path.unshift traversalItem.currentItem
                                stepResults.push traversalItem #todo: allow predicate with callback parameter in case want to do something asyncronous during predicate
                    obj._lastResult = stepResults
                    executeNextStep obj

                else if currentStep.c is 'map'
                    #outputs the previous node after a given transformation
                    stepResults = []
                    for traversalItem, index in obj._lastResult
                        if !isActive traversalItem then stepResults.push traversalItem
                        else
                            traversalItem.path.unshift traversalItem.currentItem
                            if currentStep.a[0].length is 1 then traversalItem.currentItem = currentStep.a[0]({item: traversalItem.currentItem, path: traversalItem.path, data: traversalItem.data, loops:obj._loops[obj._stepIndex]})
                            else
                                await currentStep.a[0] {item: traversalItem.currentItem, path: traversalItem.path, data: traversalItem.data, loops:obj._loops[obj._stepIndex]}, defer cbResult
                                traversalItem.currentItem = cbResult
                            stepResults.push traversalItem
                    obj._lastResult = stepResults
                    executeNextStep obj

                else if currentStep.c is 'group'
                    #groups the previous nodes based on given (string, function) or (function, function)
                    stepResults = []
                    groups = {}

                    groupFunction = if currentStep.a[0].constructor is String then (item) -> return item.data[currentStep.a[0]] else currentStep.a[0]
                    mapFunction = if currentStep.a[1] then currentStep.a[1] else null

                    for traversalItem, index in obj._lastResult
                        if !isActive traversalItem then stepResults.push traversalItem
                        else
                            #calculate group
                            if groupFunction.length is 1 then group = groupFunction({item: traversalItem.currentItem, path: traversalItem.path, data: traversalItem.data, loops:obj._loops[obj._stepIndex]})
                            else
                                await groupFunction {item: traversalItem.currentItem, path: traversalItem.path, data: traversalItem.data, loops:obj._loops[obj._stepIndex]}, defer groupFunctionResult
                                group = groupFunctionResult
                            if not groups[group] then groups[group] = []
                            if group then groups[group].push traversalItem

                    for groupList, groupListIndex of groups
                        if mapFunction
                            if mapFunction.length is 1 then stepResults.push mapFunction(groupList)
                            else
                                await mapFunction groupList, defer mapFunctionResult
                                stepResults.push mapFunctionResult
                        else
                            stepResults.push groupList

                    obj._lastResult = stepResults
                    executeNextStep obj

                else if currentStep.c is 'back'
                    #set _lastResult to a previous result by count or name
                    stepResults = []
                    for traversalItem, index in obj._lastResult
                        if isActive traversalItem
                            traversalItem.path.unshift traversalItem.currentItem
                            traversalItem.currentItem = if currentStep.a[0].constructor is String then traversalItem.data[currentStep.a[0]] else traversalItem.path[currentStep.a[0]]
                        stepResults.push traversalItem
                    obj._lastResult = stepResults
                    executeNextStep obj

                else if currentStep.c is 'loop'
                    stepIndex = if currentStep.a[0].constructor is String then obj._namedSteps[currentStep.a[0]] else obj._stepIndex - currentStep.a[0]
                    predicate = if currentStep.a[1] instanceof Function then currentStep.a[1] else (i) -> obj._loops[stepIndex] <= currentStep.a[1]
                    obj._loops[stepIndex] = if obj._loops[stepIndex] then obj._loops[stepIndex] + 1 else 1
                    loopAgain = false

                    stepResults = []
                    for traversalItem, index in obj._lastResult
                        if isActive traversalItem
                            traversalItem.path.unshift traversalItem.currentItem
                            if predicate({item: traversalItem.currentItem, path: traversalItem.path, data: traversalItem.data, loops:obj._loops[obj._stepIndex]}) #todo: allow async predicates like in filter/map
                                traversalItem.loops[stepIndex] = true
                                loopAgain = true
                            else
                                traversalItem.loops[stepIndex] = false
                        stepResults.push traversalItem

                    if loopAgain then obj._stepIndex = stepIndex - 1 #it is incremented immediatley on the next step
                    else delete obj._loops[stepIndex]
                    obj._lastResult = stepResults
                    executeNextStep obj

                else
                    #do nothing, move to the next step
                    console.log('query command skipped: ' + JSON.stringify(currentStep))
                    executeNextStep obj

        addTraversalFunctions = (obj) ->
            obj._steps = obj._steps || []
            #todo: reconsider whether to keep the alias names
            obj.v = obj.find = ()->
                obj._steps.push {c:'v', a:arguments} #todo: explain why this is necessary
                return obj
            obj.e = ()->
                obj._steps.push {c:'e', a:arguments}
                return obj
            obj.get = () ->
                obj._steps.push {c:'get', a:arguments}
                return obj
            obj.loop = ()->
                obj._steps.push {c:'loop', a:arguments}
                return obj
            obj.group = obj.reduce = () ->
                obj._steps.push {c:'group', a:arguments}
                return obj
            obj.filter = () ->
                obj._steps.push {c:'filter', a:arguments}
                return obj
            obj.map = obj.transform = () ->
                obj._steps.push {c:'map', a:arguments} #todo: add transform (runs an arbitrary function) and until (shortcut exit clears the queue content)
                return obj
            obj.back = obj.with = () ->
                obj._steps.push {c:'back', a:arguments}
                return obj
            obj.as = obj.out = obj.show = () ->
                #execute the query
                if arguments.length == 0
                    obj._steps.push {c:'as', a:[console.dir]}
                    executeNextStep obj
                else if arguments[0] instanceof Function or arguments[1] instanceof Function
                    obj._steps.push {c:'as', a:arguments}
                    executeNextStep obj
                else
                    return obj
            return obj

        result = addTraversalFunctions {_graph:this}
        result.find.apply this, arguments

    if graphCallback instanceof Function then graphCallback self