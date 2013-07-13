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

In this world if an edge between nodes A and B has properties it is actually an intermediary node between A and B. 
