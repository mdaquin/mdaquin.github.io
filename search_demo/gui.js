var origin = undefined
var target = undefined

var speed = 5

window.addEventListener('load', function () {
    document.getElementById("speed").addEventListener('change', function(){
         speed = document.getElementById("speed").value
    })
    document.getElementById("graphtype").addEventListener('change', function(){
        var type = document.getElementById("graphtype").value
        if (type=="dfs") 
            document.getElementById("dfs_params").style.display = "block"
        else 
            document.getElementById("dfs_params").style.display = "none"
        if (type=="a*" || type=="gbefs" || type=="befs") 
            document.getElementById("heuristic").style.display = "block"
        else 
            document.getElementById("heuristic").style.display = "none"
    })   
})

function generate(){
   clear()
   document.getElementById("graph").innerHTML=""
   const maxL = document.getElementById("maxlevel").value
   const maxB = document.getElementById("maxbranchs").value
   const rR = document.getElementById("reuserate").value   
   n = new DirectedGraphNode(maxL, maxB, rR)
   showGraph(n)
   document.getElementById("message").style.display="block"
   resetHighlights()
}

function nodeClicked(a){
    if (a==origin) {resetOrigin(); origin=undefined; return}
    if (a==target) {resetTarget(); target=undefined; return}
    if (origin==undefined) makeOrigin(a)
    else makeTarget(a)
}

function makeOrigin(a){
    origin = a
    resetOrigin()
    var elms = document.querySelectorAll("[id='"+a.id+"']");
    elms[elms.length-1].setAttribute("class", "origin")
    document.getElementById("message").style.display = "none"
    if (target!=undefined) showSearchControl()
}

function makeTarget(a){
    target = a
    resetTarget()
    var elms = document.querySelectorAll("[id='"+a.id+"']");
    elms[elms.length-1].setAttribute("class", "target")
    if (origin!=undefined) showSearchControl()   
}

function resetOrigin(){
    if (document.getElementsByClassName("origin").length > 0)
      document.getElementsByClassName("origin")[0].setAttribute("class", "node")
    hideSearchControl()
}

function resetTarget(){
    if (document.getElementsByClassName("target").length > 0)
       document.getElementsByClassName("target")[0].setAttribute("class", "node")
    hideSearchControl()
}

function highlight(a){
    var elms = document.querySelectorAll("[id='"+a.id+"']")
    elms[elms.length-1].setAttribute("class", "path")    
}

function resetHighlights(){
       var ps = document.getElementsByClassName("path")
       while (ps.length > 0){ 
           console.log(ps)
           for (var p in ps) 
               if (ps[p].setAttribute) ps[p].setAttribute("class", "node")
       }
}

function hideSearchControl(){
    document.getElementById("searchcontrol").style.display = "none"   
}

function showSearchControl(){
    document.getElementById("searchcontrol").style.display = "block"   
}

function go(){
       resetHighlights()
       var type = document.getElementById("graphtype").value
       if (type == "dfs") origin.dfs(target, document.getElementById("dlimit").value)
       if (type == "bfs") origin.bfs(target, document.getElementById("dlimit").value)
       if (type == "gbefs") origin.gbefs(target, document.getElementById("dlimit").value)
       if (type == "befs") origin.befs(target)

}

function clear(){
    origin = undefined; resetOrigin()
    target = undefined; resetTarget()
    resetHighlights()
}