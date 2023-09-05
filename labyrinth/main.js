var sizex = 15
var sizey = 20
var grid = []

window.addEventListener('DOMContentLoaded', (event) => {
    initGrid()
    select(); path()
    drawGrid()
    document.getElementById("file-input").addEventListener("change", load, false);
})

function initGrid(){
    grid = []
    for (var i = 0; i < sizex; i++){
	grid.push([])
	for (var j = 0; j < sizey; j++){
	    grid[i].push({"T": false, "R": false, "B": false, "L": false})
	}
    }
    grid[0][0].L = true
    grid[sizex-1][sizey-1].R = true
}

function drawGrid(){
    st=""
    for (var i = 0; i < sizex; i++){
	for (var j = 0; j < sizey; j++){
	    st+='<div class="cell" id="c'+i+'-'+j+'" style="float: left; width: '+(100/sizey)+'%; height: '+(100/sizex)+'%; '
	    if (!grid[i][j].T) st+="border-top: 3px solid black;"
	    else st+="border-top: none;"
	    if (!grid[i][j].R) st+="border-right: 3px solid black;"
	    else st+="border-right: none;"
	    if (!grid[i][j].B) st+="border-bottom: 3px solid black;"
	    else st+="border-bottom: none;"
	    if (!grid[i][j].L) st+="border-left: 3px solid black;"
	    else st+="border-left: none;"	    
	    st+='" onclick="clicked('+i+','+j+')"\>&nbsp;</div>'
	}
	// console.log(st)
	document.getElementById("grid").innerHTML=st
    }
    showselected()
}

function change(x,y){
    sizex = sizex+x
    sizey = sizey+y
    initGrid()
    drawGrid()
}

const SELECT = 1
const PATH = 2

var mode = SELECT

function select(){
    document.getElementById("select").style.background="#AA4444"
    document.getElementById("path").style.background="#44AAAA"    
    mode = SELECT
}

function path(){
    document.getElementById("path").style.background="#AA4444"
    document.getElementById("select").style.background="#44AAAA"    
    mode = PATH
}

var selected = [0,0]

function showselected(){
    for(var i = 0; i < sizex; i++){
	for(var j = 0; j < sizey; j++) {
	    document.getElementById("c"+i+"-"+j).style.background = "#fff"	    
	}
    }
    if (selected[0] < 0 || selected[1] < 0) return     
    document.getElementById("c"+selected[0]+"-"+selected[1]).style.background = "#FFCC99"
}

function clicked(i,j){
    if (mode==SELECT){
	selected=[i,j]
	showselected()
    } else if (mode==PATH) {
	const si = selected[0]; const sj = selected[1]
	if (i==si && j==sj-1) {
	    grid[i][j].R = !grid[i][j].R
	    grid[si][sj].L = !grid[si][sj].L
	    selected=[i,j]
	    drawGrid()
	}
	if (i==si && j==sj+1) {
	    grid[i][j].L = !grid[i][j].L
	    grid[si][sj].R = !grid[si][sj].R
	    selected=[i,j]
	    drawGrid()
	}
	if (i==si-1 && j==sj) {
	    grid[i][j].B = !grid[i][j].B
	    grid[si][sj].T = !grid[si][sj].T
	    selected=[i,j]
	    drawGrid()
	}
	if (i==si+1 && j==sj) {
	    grid[i][j].T = !grid[i][j].T
	    grid[si][sj].B = !grid[si][sj].B
	    selected=[i,j]
	    drawGrid()
	}		
    }
    path()
}

function save(){    
    const file = new Blob([JSON.stringify(grid)], {type: "application/json"});
    const filename = "labyrinth.json"
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else { 
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

function load(e){
    const file = e.target.files[0]
    var reader = new FileReader()
    reader.onload = function(e) {
	const contents = e.target.result
	grid = JSON.parse(contents)
	sizex = grid.length
	sizey = grid[0].length	
	selected=[0,0]
	drawGrid()
	path()
    }
    reader.readAsText(file);    
}

function newl(){
    selected=[0,0]
    initGrid()
    drawGrid()
    path()
}


var isPaused = false

function pause(){
    isPaused = true
    document.getElementById("solve").innerHTML="continue"
    document.getElementById("solve").href="javascript:cont()"        
}

function cont(){
    isPaused = false
    document.getElementById("solve").innerHTML="pause"
    document.getElementById("solve").href="javascript:pause()"        
}

function solve(){
    document.getElementById("solve").innerHTML="pause"
    document.getElementById("solve").href="javascript:pause()"    
    method = document.getElementById("algo").value    
    selected=[-1,-1]
    showselected()
    console.log("solve")
    if (method=="bfs") bfs()
    if (method=="dfs") dfs()
    if (method=="gr") {
	gr()
	console.log("gr")
    }
    if (method=="as") as()                
}

var delay = 100

function drawStep(x, y, c){
    document.getElementById("c"+x+"-"+y).style.background = c
}

function drawPath(p, c){
    if (p.length ==0) return 
    const el = p.shift()
    document.getElementById("c"+el[0]+"-"+el[1]).style.background = c
    drawPath(p,c)
}

var bfsqueue = [[0,0]]
var bfsseen = []

function bfs(){
    selected = [-1, -1]
    bfsseen = []
    showselected()
    bfsqueue = [[0,0,[]]]
    console.log("starting")
    setTimeout(bfsstep, delay)
}

function bfsstep(){
    if (isPaused) {setTimeout(bfsstep, delay); return}
    if (bfsqueue.length == 0) return
    const el = bfsqueue.shift()
    const x = el[0]; const y = el[1]; const path = el[2]
    console.log(x+","+y)
    if (x == sizex-1 && y == sizey-1){
	console.log("done")
	drawStep(x, y, "#ff0000")
	drawPath(path, "#00ff00")
	document.getElementById("solve").innerHTML="solve"
	document.getElementById("solve").href="javascript:solve()"    	
	return
    }
    bfsseen.push(x+"/"+y)
    drawStep(x, y, "#0000ff")
    var npath = [...path]
    npath.push([x,y])
    if (grid[x][y].R && !bfsseen.includes(x+"/"+(y+1)))
	bfsqueue.push([x, y+1, npath])
    if (grid[x][y].L && !bfsseen.includes(x+"/"+(y-1)) && y!=0)
	bfsqueue.push([x, y-1, npath])
    if (grid[x][y].T && !bfsseen.includes((x-1)+"/"+y) && x!=0)
	bfsqueue.push([x-1, y, npath])
    if (grid[x][y].B && !bfsseen.includes((x+1)+"/"+y))
	bfsqueue.push([x+1, y, npath])
    setTimeout(bfsstep, delay)    
}

var dfsqueue = [[0,0]]
var dfsseen = []

function dfs(){
    selected = [-1, -1]
    dfsseen = []
    dfsqueue = [[0,0,[]]]    
    showselected()
    console.log("starting")
    setTimeout(dfsstep, delay)
}

function dfsstep(){
    if (isPaused) {setTimeout(dfsstep, delay); return}
    if (dfsqueue.length == 0) return
    const el = dfsqueue.pop()
    const x = el[0]; const y = el[1]; const path = el[2]
    console.log(x+","+y)
    if (x == sizex-1 && y == sizey-1){
	console.log("done")
	drawStep(x, y, "#ff0000")
	drawPath(path, "#00ff00")	
	document.getElementById("solve").innerHTML="solve"
	document.getElementById("solve").href="javascript:solve()"    	
	return
    }
    dfsseen.push(x+"/"+y)
    drawStep(x, y, "#0000ff")
    var npath = [...path]
    npath.push([x,y])
    if (grid[x][y].R && !dfsseen.includes(x+"/"+(y+1)))
	dfsqueue.push([x, y+1, npath])
    if (grid[x][y].L && !dfsseen.includes(x+"/"+(y-1)) && y!=0)
	dfsqueue.push([x, y-1, npath])
    if (grid[x][y].T && !dfsseen.includes((x-1)+"/"+y) && x!=0)
	dfsqueue.push([x-1, y, npath])
    if (grid[x][y].B && !dfsseen.includes((x+1)+"/"+y))
	dfsqueue.push([x+1, y, npath])
    setTimeout(dfsstep, delay)    
}


function h(x,y){
    return Math.sqrt(Math.pow(sizex-x-1,2)+Math.pow(sizey-y-1,2))
}


var grqueue = [[0,0]]
var grseen = []

function gr(){
    selected = [-1, -1]
    grseen = []
    grqueue = [[0,0,[]]]    
    showselected()
    console.log("starting gr")
    setTimeout(grstep, delay)
}

function grstep(){
    if (isPaused) {setTimeout(grstep, delay); return}
    if (grqueue.length == 0) return
    const el = grqueue.pop()
    const x = el[0]; const y = el[1]; const path = el[2]
    console.log("gr"+x+","+y)
    h(x,y)
    if (x == sizex-1 && y == sizey-1){
	console.log("done")
	drawStep(x, y, "#ff0000")
	drawPath(path, "#00ff00")
	document.getElementById("solve").innerHTML="solve"
	document.getElementById("solve").href="javascript:solve()"    		
	return
    }
    grseen.push(x+"/"+y)
    drawStep(x, y, "#0000ff")
    var npath = [...path]
    npath.push([x,y])
    var toadd = []
    if (grid[x][y].R && !grseen.includes(x+"/"+(y+1)))
	toadd.push([x, y+1, npath])
    if (grid[x][y].L && !grseen.includes(x+"/"+(y-1)) && y!=0)
	toadd.push([x, y-1, npath])
    if (grid[x][y].T && !grseen.includes((x-1)+"/"+y) && x!=0)
	toadd.push([x-1, y, npath])
    if (grid[x][y].B && !grseen.includes((x+1)+"/"+y))
	toadd.push([x+1, y, npath])    
    toadd.sort( (a,b) => h(b[0], b[1]) - h(a[0], a[1]) )
    for (var i in toadd)
	grqueue.push(toadd[i])
    setTimeout(grstep, delay)    
}

function g(p){
    return p[2].length
}

function f(n){
    return g(n) + h(n[0], n[1])
}

var asqueue = [[0,0]]
var asseen = []

function as(){
    selected = [-1, -1]
    asseen = []
    asqueue = [[0,0,[]]]    
    showselected()
    console.log("starting as")
    setTimeout(asstep, delay)
}

function asstep(){
    if (isPaused) {setTimeout(asstep, delay); return}
    if (asqueue.length == 0) return
    const el = asqueue.pop()
    const x = el[0]; const y = el[1]; const path = el[2]
    console.log("as"+x+","+y)
    h(x,y)
    if (x == sizex-1 && y == sizey-1){
	console.log("done")
	drawStep(x, y, "#ff0000")
	drawPath(path, "#00ff00")
	document.getElementById("solve").innerHTML="solve"
	document.getElementById("solve").href="javascript:solve()"    		
	return
    }
    asseen.push(x+"/"+y)
    drawStep(x, y, "#0000ff")
    var npath = [...path]
    npath.push([x,y])
    var toadd = []
    if (grid[x][y].R && !asseen.includes(x+"/"+(y+1)))
	asqueue.push([x, y+1, npath])
    if (grid[x][y].L && !asseen.includes(x+"/"+(y-1)) && y!=0)
	asqueue.push([x, y-1, npath])
    if (grid[x][y].T && !asseen.includes((x-1)+"/"+y) && x!=0)
	asqueue.push([x-1, y, npath])
    if (grid[x][y].B && !asseen.includes((x+1)+"/"+y))
	asqueue.push([x+1, y, npath])    
    asqueue.sort( (a,b) => f(b) - f(a) )
    setTimeout(asstep, delay)    
}
