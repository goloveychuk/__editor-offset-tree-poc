class NodeeRepr<T> {
    left?: Nodee<T>
    right?: Nodee<T>
}

class Nodee<T> {
    left?: Nodee<T>
    right?: Nodee<T>
    parent?: Nodee<T>
    offset: number
    constructor(offset: number) {
        this.offset = offset
    }
}

class RootNodee<T> extends Nodee<T> {
    ind: number
    
    constructor(ind: number, offset: number) {
        super(offset)
        this.ind = ind
    }
}

class Tree<T> {
    root?: RootNodee<T>

    insert(start: number, end: number, data: T) {
        if (this.root === undefined) {
            this.root = new RootNodee(start, 0)
        }
        this._insert(start)
        this._insert(end)
    }
    _insert(ind: number) {
        let absVal = this.root!.ind
        let p: Nodee<T> = this.root!;
        
        while (true) {
            if (ind === absVal) {
                return
            }
            if (ind < absVal) {
                if (p.left === undefined) {
                    p.left = new Nodee(ind - absVal)
                    p.left.parent = p
                    break
                } else {
                    p = p.left
                    absVal = absVal + p.offset
                }
            } else {
                if (p.right === undefined) {              
                    p.right = new Nodee(ind - absVal)
                    p.right.parent = p
                    break
                } else {
                    p = p.right
                    absVal = absVal + p.offset                    
                }
            }
        }
    }
}


type NodesQueue = Array<Nodee<any>|undefined|null>


function printTree(root: Nodee<any>) {
    // Find the maximum height of the binary tree
    function maxHeight(p?: Nodee<any>): number {
        if (!p) return 0;
        var leftHeight = maxHeight(p.left);
        var rightHeight = maxHeight(p.right);
        return (leftHeight > rightHeight) ? leftHeight + 1 : rightHeight + 1;
    }

    var fillChar = " ";
    function setw(length: number) {
        var spaces = "";

        for (var i = 0; i < length; i++)
            spaces += fillChar;

        return spaces;
    }

    function setfill(aChar: string) {
        fillChar = aChar;
        return "";
    }

    // Print the arm branches (eg, /    \ ) on a line
    function printBranches(branchLen: number, nodeSpaceLen: number, startLen: number, nodesInThisLevel: number, nodesQueue: NodesQueue) {
        var cont = 0;

        for (var i = 0; i < Math.floor(nodesInThisLevel / 2); i++) {
            out += ((i == 0) ? setw(startLen - 1) : setw(nodeSpaceLen - 2)) + "" + ((nodesQueue[cont++]) ? "/" : " ");
            out += setw(2 * branchLen + 2) + "" + ((nodesQueue[cont++]) ? "\\" : " ");
        }

        out += (Math.floor(nodesInThisLevel / 2) == 0) ? "" : "";
        out += '\n'
        
    }

    // Print the branches and node (eg, ___10___ )
    function printNodes(branchLen: number, nodeSpaceLen: number, startLen: number, nodesInThisLevel: number, nodesQueue: NodesQueue) {
        var cont = 0;

        for (var i = 0; i < nodesInThisLevel; i++ , cont++) {
            var spaceAdjust = (nodesQueue[cont]) ? ("" + nodesQueue[cont]!.offset).length : 0;
            var odd = (spaceAdjust % 2 == 0) ? 1 : 0;
            spaceAdjust = Math.floor(spaceAdjust / 2);

            out += ((i == 0) ? setw(startLen) : setw(nodeSpaceLen + 1)) + "" + ((nodesQueue[cont] && nodesQueue[cont]!.left) ? setfill('_') : setfill(" "));
            out += setw(branchLen - spaceAdjust) + ((nodesQueue[cont]) ? nodesQueue[cont]!.offset : "");
            out += ((nodesQueue[cont] && nodesQueue[cont]!.right) ? setfill('_') : setfill(" ")) + setw(branchLen - spaceAdjust + odd) + "" + setfill(" ");
        }

        // out += "";
        out += '\n'
        
    }

    // Print the leaves only (just for the bottom row)
    function printLeaves(indentSpace: number, level: number, nodesInThisLevel: number, nodesQueue: NodesQueue) {
        var cont = 0;

        for (var i = 0; i < nodesInThisLevel; i++ , cont++) {
            var spaceAdjust = (nodesQueue[cont]) ? ("" + nodesQueue[cont]!.offset).length : 0;
            spaceAdjust = (spaceAdjust == 1) ? 0 : spaceAdjust - 1;
            out += ((i == 0) ? setw(indentSpace) : setw((2 * level + 1) - spaceAdjust)) + ((nodesQueue[cont]) ? nodesQueue[cont]!.offset : "");
        }

        // out += "";
        out += '\n'
        
    }

    // Pretty formatting of a binary tree to the output stream
    // @ param
    // level  Control how wide you want the tree to sparse (eg, level 1 has the minimum space between nodes, while level 2 has a larger space between nodes)
    // indentSpace  Change this to add some indent space to the left (eg, indentSpace of 0 means the lowest level of the left node will stick to the left margin)
    function printPretty(root: Nodee<any>, level: number, indentSpace: number) {
        var h = maxHeight(root);
        var nodesInThisLevel = 1;

        var branchLen = 2 * (Math.floor(Math.pow(2.0, h)) - 1) - (3 - level) * Math.floor(Math.pow(2.0, h - 1));  // eq of the length of branch for each node of each level
        var nodeSpaceLen = 2 + (level + 1) * Math.floor(Math.pow(2.0, h));  // distance between left neighbor node's right arm and right neighbor node's left arm
        var startLen = branchLen + (3 - level) + indentSpace;  // starting space to the first node to print of each level (for the left most node of each level only)

        const nodesQueue: NodesQueue = [];
        nodesQueue.push(root);
        for (var r = 1; r < h; r++) {
            
            printBranches(branchLen, nodeSpaceLen, startLen, nodesInThisLevel, nodesQueue);
            branchLen = branchLen / 2 - 1;
            nodeSpaceLen = nodeSpaceLen / 2 + 1;
            startLen = branchLen + (3 - level) + indentSpace;
            printNodes(branchLen, nodeSpaceLen, startLen, nodesInThisLevel, nodesQueue);

            for (var i = 0; i < nodesInThisLevel; i++) {
                var currNode = nodesQueue.shift();

                if (currNode) {
                    nodesQueue.push(currNode.left);
                    nodesQueue.push(currNode.right);
                } else {
                    nodesQueue.push(null);
                    nodesQueue.push(null);
                }
            }
            nodesInThisLevel *= 2;
        }

        printBranches(branchLen, nodeSpaceLen, startLen, nodesInThisLevel, nodesQueue);
        printLeaves(indentSpace, level, nodesInThisLevel, nodesQueue);
    }
    var out = "";
    printPretty(root, 0, 1)
    return out
}





type Data = string


const tree = new Tree<Data>()


const data: [number, number, Data][] = [
    [50, 80, 'a'],
    [10, 20, 'a'],
    [30, 45, 'a'],
    [90, 101, 'a'],
    [105, 110, 'a'],

]

for (const [low, high, d] of data) {
    tree.insert(low, high, d)
}



console.log(printTree(tree.root!))