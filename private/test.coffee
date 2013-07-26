require('source-map-support').install {retrieveSourceMap: (source) -> {url: source.slice(0,-2) + "coffee", map: fs.readFileSync(source.slice(0,-2) + "map", 'utf8'), handleUncaughtExceptions: true}}
tests = {}
sharedData = {}

tests['init graph data'] = (cb) ->
    g = require('./graph')
    await g.getGraph defer sharedData['graph']
    cb true

tests['add node'] = (cb) ->
    g = sharedData['graph']
    await g.addInversion 'friends', 'friends', defer()
    await g.addNode {id:"Jonathon", friends:["Rebecca", "Jeremy"], phone:"0415 837 221"}, defer(Jonathon)
    await g.getAllNodes true, defer nodeList
    cb nodeList.length is 3

tests['arbitrary fluid query example'] = (cb) ->
    g = sharedData['graph']
    await g.v().map((i)->{name: i.item.id, friends: i.item.friends}).as(defer result)
    console.log(result)
    cb true

for testName, test of tests
    await test defer(result)
    console.log testName + ": " + (result ? "pass" : "fail")

#todo: find out why this isn't exiting when all callbacks have finished