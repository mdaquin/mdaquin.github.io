// Data Structure and search algorithms
// in graphs. Used as part of search demo
// @mdaquin

// BUG: multiple nodes with the same id... 
// global variable solution is inelegant and 
// might still create clashes, but it might be 
// better
var noden = 0

class DirectedGraphNode {
    // build random graph with up to 
    // maxLevel levels, up to maxBranch 
    // branches for each node, and that will 
    // reuse existing nodes at the rate of reuseRate
    // a reuse rate of 0 means that it will be a tree
    // optional parameter kn is used to list known nodes
    // for recursion. The first one is the root.
    constructor(maxLevel, maxBranch, reuseRate, kn=[]){
	    this.getId()
        kn.push(this)
        this.links = []
        if (maxLevel > 0) {
            this.children = []
            const nbc = 1+Math.floor(Math.random()*(maxBranch))
            for(var i =0; i < nbc; i++){
                // reuse from kn
                if (Math.random()<reuseRate){
                    const kni = Math.floor(Math.random()*kn.length)
                    this.children.push(kn[kni])
                    this.links.push(kn[kni])
                    kn[kni].links.push(this)
                } else {
                    var newN = new DirectedGraphNode(maxLevel-1, maxBranch, reuseRate, kn)
                    this.children.push(newN)
                    this.links.push(newN)
                    newN.links.push(this)
                    kn.push(newN)
                }
            }
        }
    }
    
    async getId(){
        if (this.id) return this.id
        else {
           // await new Promise(r => setTimeout(r, 10));
           this.id = "node_"+Math.random()*Math.random()
        }
        return this.id
    }
    
    // recursivly lists all nodes 
    // assuming this is the root of the graph
    listNodes(vn = []) {
        if (vn.indexOf(this) != -1) return []
        var result = [this]
        for(var c in this.children) result = result.concat(this.children[c].listNodes(vn.concat([this])))
        return result
    }
    
    // depth first search 
    async dfs(target, limit=0, kn=[]){
        if (this == target || kn.indexOf(this)!=-1){
            return this == target // should return path...
        }
        console.log(this.id)
        if (kn.length!=0) highlight(this)
        kn.push(this)
        if (limit!=1)
        for(var i in this.links) { 
            await new Promise(r => setTimeout(r, (10-speed)*75));
            var res = await this.links[i].dfs(target, limit-1, kn)
            if (res) return true
        }
    }
    
    // breadth first search
    async bfs(target){
        var akn = []
        var queue = [this]
        while (queue.length > 0){
            var n = queue.shift()
            console.log(n.id)
            if (akn.indexOf(n)!= -1) continue
            if (n == target) return
            if (akn.length!=0) highlight(n)
            akn.push(n)
            await new Promise(r => setTimeout(r, (10-speed)*75));
            for (var i in n.links){
                var nn = n.links[i]
                queue.push(nn)
            }
        }
    }
    
}
