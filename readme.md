##A javascript + redis based graph library.
Built with IcedCoffeeScript and destined for redis-v8. 

Fast, supports indexes, inversions, and pure javascript queries via traversal function or Gremlin/Linq inspired fluid synax.
Automatic traversal-optimised multi-server sharding coming soon. Very early days.

IcedCoffeeScript:

```coffeescript
graphdb = require("./graph")
await graphdb.getGraph "testGraph", defer(graph)
await graph.addInversion "husband", "wife", defer()
await graph.addNode {id: "Rebecca", husband: ["Jonathon"]}, defer()
await 
	graph.getAllNodes true, defer allNodes
	graph.find("Jonathon").get("wife").as(defer Rebecca)
	
console.dir allNodes
console.dir Rebecca
```

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

Keep in mind:

 1. If an edge between nodes A and B has properties it should be modelled an intermediary node between A and B. 
 
 2. Apply traversals against the graph by defining actions with the signature: (path, queue,sharedData, firstVisit). You'll find the current node at path[0]. 
 
 3. See [routes.coffee](https://github.com/m1sta/tinkerlinks/blob/master/private/routes.coffee) for an example.
