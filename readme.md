A javascript + redis based graph library.
Built with IcedCoffeeScript and destined for redis-v8. 
Very early days.

Javascript:

```javascript
graphdb = require('./graph')
graphdb.getGraph('testGraph', function(graph){
	graph.addInversion('husband', 'wife', function(){
    	graph.addNode({id:'Rebecca', husband:['Jonathon']}, function(){
        	graph.getAllNodes(true, console.dir)
            /*[ 
            { id: 'Jonathon', wife: [ 'Rebecca' ] }, 
            { id: 'Rebecca', husband: [ 'Jonathon' ] } 
            ]*/
        })
    })
})
```

Coffeescript:

```coffeescript
graphdb = require("./graph")
graphdb.getGraph "testGraph", (graph) ->
  graph.addInversion "husband", "wife", ->
    graph.addNode {id: "Rebecca", husband: ["Jonathon"]}, ->
      graph.getAllNodes true, console.dir
```

Keep in mind:
1. If an edge between nodes A and B has properties it should be modelled an intermediary node between A and B. 
2. Apply traversals against the graph by defining actions with the signature: (path, queue,sharedData, firstVisit)
