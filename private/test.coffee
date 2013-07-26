#require('source-map-support').install {retrieveSourceMap: (source) -> {url: source.slice(0,-2) + "coffee", map: fs.readFileSync(source.slice(0,-2) + "map", 'utf8'), handleUncaughtExceptions: true}}
tests = {}
sharedData = {}

tests['init graph data'] = (assert) ->
    g = require('./graph')
    await g.getGraph defer sharedData['graph']
    assert true

tests['add node'] = (assert) ->
    g = sharedData['graph']
    await g.addInversion 'friends', 'friends', defer()
    await g.addNode {id:"Jonathon", friends:["Rebecca", "Jeremy"], phone:"0415 837 221"}, defer(Jonathon)
    await g.getAllNodes true, defer nodeList
    assert nodeList.length is 3

tests['arbitrary fluid query example'] = (assert) ->
    g = sharedData['graph']
    await g.v().map((i)->{name: i.item.id, friends: i.item.friends}).as(defer result)
    assert result.length is 3

tests['wife'] = (assert) ->
    g = sharedData['graph']
    await g.addInversion "husband", "wife", defer()
    await g.addNode {id: "Rebecca", husband: ["Jonathon"]}, defer()
    await g.v("Jonathon").get("wife").as(defer Rebecca)
    assert Rebecca[0].husband[0] is "Jonathon"

console.log("-------------------------------------------------------------")
testPass = 0
testFail = 0
pad = (s) -> ("                                                          "+s).slice(-35)
for testName, test of tests
    process.stdout.write pad(testName) + ": "
    await test defer(result)
    if result
        resultString = "pass"
        testPass++
    else
        resultString = "fail"
        testFail++
    process.stdout.write resultString + "\r"
console.log("-------------------------------------------------------------")

#todo: find out why this isn't exiting when all callbacks (appear to ) have finished