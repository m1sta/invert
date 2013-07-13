() -> await defer() #included to address bug in icedcoffeescript parser which prevents   iced = require('iced-coffee-script').iced; being inserted if this is not detected early

csv = require('csv')
fs = require('fs')
redisGraph = require('./graph')

exports.get = get = {}
exports.post = post = {}

get['/test1'] = (request, response) ->

    await
        redisGraph.getGraph 'testGraph', defer graph
    await
        graph.addIndex "name", defer()
        graph.addInversion "friends", "friends", defer()
    await
        graph.addNode {id:1, name:"Jonathon", friends:[2,3,4], test:'failed'}, defer()
        graph.addNode {id:2, name:"Jeremy", friends:[4]}, defer()
        graph.addNode {id:3, name:"Rebecca", friends:[4]}, defer()
        graph.addNode {id:4, name:"Kate"}, defer()
    await
        graph.deleteNode({id:1, test:null}, defer())

    traversal = (path, queue, data, firstVisit) ->
        if not data.recommended[path[0].name] then data.recommended[path[0].name] = 0
        data.recommended[path[0].name] += 1 / path.length
        if path.length < 4 and firstVisit then queue.add(-1 * path.length, path, path[0].friends)

    startNodeIds = [1]
    sharedData = {recommended:{}}

    await graph.traverse startNodeIds, sharedData, traversal, defer(result)

    sortKeys = (obj) ->
        keyList = []
        keyList.push key for key of obj
        keyList.sort (a,b) -> obj[a] - obj[b]

    console.log friendName + ": " + result.recommended[friendName] for friendName in sortKeys result.recommended
    await graph.getNode('name', 'Jonathon', defer jonathonNode)
    response.end(JSON.stringify jonathonNode)

post['/csv'] = (request, response) =>
    graph = new redisGraph() #todo: new graph per file name

    [headers, headerArrays] = [[], {}]
    csvFile = csv().from.stream(fs.createReadStream(request.files.csv.path))
    csvFile.on 'record', (row, index) =>
        #row is an array of values
        console.log('#' + index + ' ' + JSON.stringify(row))
        if index is 0
            headers = row
            headerArrays[row[i]] = true for i in [1..row.length] when row[i] is row[i-1]
        else
            newNode = {}
            for i in [1..row.length] when row[i]
                if headerArrays[headers[i]]
                    if newNode[headers[i]] then newNode[headers[i]].push(row[i]) else newNode[headers[i]] = [row[i]]
                else
                    newNode[headers[i]] = row[i]
            graph.addNode newNode
    csvFile.on 'end', () => response.end({success:true, filename:request.files.csv.path})