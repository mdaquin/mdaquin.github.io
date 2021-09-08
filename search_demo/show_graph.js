
// TODO:
// link show directionality
// make the graph responsive
// get width and height, and adapt size of nodes and distance
// in relation to it

var svg;

function getLinks(g,nodes,kn=[]){
    if (kn.indexOf(g) != -1) return []
    var results = []
    const gi = nodes.indexOf(g)
    kn.push(g)
    for (var i in g.children) {
        const ci = nodes.indexOf(g.children[i])
        results.push({source: gi, target: ci})
        results = results.concat(getLinks(g.children[i], nodes, kn))
    }
    return results
}


function showGraph(g){
    width = document.getElementById("graph").offsetWidth
    height = document.getElementById("graph").offsetHeight
const nodes = g.listNodes()
console.log(nodes)
// define nodes and links
links = getLinks(g, nodes)


// add svg to div
svg = d3.select('#graph').append('svg')
    .attr('width', width)
    .attr('height', height);

// force layout object
        var force = d3.layout.force()
       .size([width, height])
        .nodes(nodes)
        .links(links);
    
// link distance
force.linkDistance(20);
// force.linkStrength(0.5)
force.charge(-100)
//force.gravity(0.05)
    
// add links
var link = svg.selectAll('.link')
    .data(links)
    .enter().append('line')
    .attr('class', 'link');

// add nodes
var node = svg.selectAll('.node')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('id', function(d){d.id})    
    .attr('class', 'node')
    .on("click", nodeClicked);
    
// update positions of nodes and links when done
force.on('tick', function() {
    node.attr('r', 5)
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('id', function(d) {return d.id;});
      link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

});

// start the force layout
force.start();
}
