

export class Nodee<T> {
    left?: Nodee<T>
    right?: Nodee<T>
    parent?: Nodee<T>
    data: T
    height = 0
    offset: number
    constructor(offset: number, data: T) {
        this.offset = offset
        this.data = data
    }
    _testComputeIndex() { //for debug purposes
        var ind = this.offset
        let nod = this.parent
        while (nod) {
            ind += nod.offset
            nod = nod.parent
        }
        return ind
    }
    leftHeight() {
        if (this.left === undefined) {
            return -1
        }
        return this.left.height
    }
    rightHeight() {
        if (this.right === undefined) {
            return -1
        }
        return this.right.height
    }
    rotateLeft() {
        var newRoot = this.right!

        this.right = newRoot.left;
        newRoot.left = this;

        const newRootOffset = newRoot.offset;
        newRoot.offset += this.offset;
        this.offset = -newRootOffset

        if (this.right !== undefined) {
            this.right.offset -= this.offset
            this.right.parent = this;
        }

        newRoot.parent = this.parent
        this.parent = newRoot

        this.height = Math.max(this.leftHeight(), this.rightHeight()) + 1
        newRoot.height = Math.max(newRoot.rightHeight(), this.height) + 1
        return newRoot
    }
    rotateRight() {
        var newRoot = this.left!;
        this.left = newRoot.right;
        newRoot.right = this;

        const newRootOffset = newRoot.offset;
        newRoot.offset += this.offset
        this.offset = -newRootOffset

        if (this.left !== undefined) {
            this.left.offset -= this.offset
            this.left.parent = this;
        }

        newRoot.parent = this.parent
        this.parent = newRoot

        this.height = Math.max(this.leftHeight(), this.rightHeight()) + 1;
        newRoot.height = Math.max(newRoot.leftHeight(), this.height) + 1;
        return newRoot;
    }
    heightDifference() {
        var heightDifference = this.leftHeight() - this.rightHeight();
        return heightDifference
    }
    balance(): Nodee<T> {
        const heightDifference = this.heightDifference();
        if (heightDifference === 2) {
            if (this.left!.heightDifference() < 0) {
                console.log('right left rotate')
                this.left = this.left!.rotateLeft()
                return this.rotateRight()
            } else {
                console.log('right rotate')
                return this.rotateRight()
            }

        } else if (heightDifference === -2) {
            if (this.right!.heightDifference() > 0) {
                console.log('left right rotate')
                this.right = this.right!.rotateRight()
                return this.rotateLeft()
            } else {
                console.log('left rotate')
                return this.rotateLeft()
            }
        }
        return this
    }
    _testHeighForBalancing(): number {
        const leftH = (this.left !== undefined) ? this.left._testHeighForBalancing() : 0
        const rightH = (this.right !== undefined) ? this.right._testHeighForBalancing() : 0
        if (Math.abs(leftH - rightH) > 1) {
            return -1
        }
        return Math.max(leftH, rightH) + 1
    }

    // remove() {
    //     // todo impl
    // }

    // getRoot() {
    //     let root: Nodee<T> = this
    //     while (root.parent !== undefined) {
    //         root = root.parent
    //     }
    //     return root
    // }
    getLeft() {
        if (this.left !== undefined) {
            return this.left
        }
        let p: Nodee<T> = this;
        while (p.parent !== undefined) {
            if (p.parent.right === p) {
                return p.parent
            }
            p = p.parent
        }
        return undefined
    }

    getRight() {
        if (this.right !== undefined) {
            return this.right
        }
        let p: Nodee<T> = this;
        while (p.parent !== undefined) {
            if (p.parent.left === p) {
                return p.parent
            }
            p = p.parent
        }
        return undefined
    }


}


class ModifyNodeProxy<T> {
    
    node: Nodee<T>
     start: number
     end: number

}


export class Tree<T> {
    root: Nodee<T>
    id = 1
    shallowCopy() {
        let tr = new Tree<T>(this.root)
        tr.id = this.id + 1
        return tr
    }
    constructor(root: Nodee<T>) {
        this.root = root
    }
    insert(start: number, end: number, data: T) {
        this.root = this._insert(this.root, start, data)
        // this.root = this._insert(this.root, end)
    }
    insertRightForNode(node: Nodee<T>, insert: Nodee<T>) { //insert shoudn't not have children
        if (node.right !== undefined) {
            // 
            node.right.parent = insert
            const offset = node.right.offset - insert.offset
            if (offset > 0) {
                insert.right = node.right
            } else {
                insert.left = node.right
            }
            node.right.offset = offset
            //todo mb rebalance
        }
        node.right = insert
        insert.parent = node

        let p: Nodee<T> | undefined = node
        this.root = this._insertForNode(node)

    }

    _insertForNode(node: Nodee<T>): Nodee<T> {

        node.height = Math.max(node.leftHeight(), node.rightHeight()) + 1;

        const balancedNode = node.balance()


        if (balancedNode.parent === undefined) {
            return balancedNode
        }

        if (balancedNode !== node) {
            if (balancedNode.parent.left === node) {
                balancedNode.parent.left = balancedNode
            } else if (balancedNode.parent.right === node) {
                balancedNode.parent.right = balancedNode
            } else {
                throw new Error('wtf')                
            }
        }

        return this._insertForNode(balancedNode.parent)
    }
    removeNode(node: Nodee<T>) {

    }

    // _testInsert(ind: number, data: T) {
    //     this.root = this._insert(this.root, ind, data)
    // }
    _testIsBalanced(node: Nodee<T> | undefined): boolean {
        if (node === undefined) {
            return true
        }
        if (node._testHeighForBalancing() === -1) {
            return false
        }
        return this._testIsBalanced(node.left) && this._testIsBalanced(node.right)
    }
    // _testComputeHeight() {
    //     if (this.root === undefined) {
    //         return 0
    //     }
    //     return this.root._testComputeHeight()
    // }
    _insert(root: Nodee<T> | undefined, offset: number, data: T): Nodee<T> {


        if (root === undefined) {
            return new Nodee(offset, data)
        }

        if (offset === root.offset) {
            return root
        }
        if (offset < root.offset) {
            root.left = this._insert(root.left, offset - root.offset, data)
            root.left.parent = root
        } else {
            root.right = this._insert(root.right, offset - root.offset, data)
            root.right.parent = root
        }


        root.height = Math.max(root.leftHeight(), root.rightHeight()) + 1;
        return root.balance()
        // return root
    }
    _find(index: number) {
        let ind = index;
        let lastRight = this.root;
        let p = this.root;
        // let lastP = p;
        while (p !== undefined) {
            if (p.offset === ind) {
                break
            }
            if (ind > p.offset) {
                if (p.right === undefined) {
                    break
                }
                p = p.right
                ind -= p.offset;
            } else if (ind < p.offset) {
                // if 
                if (p.left === undefined) {
                    break
                }
                ind -= p.offset;                
                p = p.left
            }

        }
        return { node: p, ind, lastRight } //todo
    }
    *modify(start: number, end: number): IterableIterator<ModifyNodeProxy<T>> {
        let { node, ind, lastRight } = this._find(start)
        if (node === undefined) {
            return
        }
        ind = start - node._testComputeIndex()  //todo!!!
        yield {
            node, start: ind, end: end - start + ind,
            // lastRight
        }

    }
    [Symbol.iterator]() {
        function* helper(node?: Nodee<T>): IterableIterator<Nodee<T>> {
            if (node === undefined) {
                return
            }
            if (node.left !== undefined) {
                yield* helper(node.left)
            }
            yield node
            if (node.right !== undefined) {
                yield* helper(node.right)
            }
        }
        return helper(this.root)
    }
    toArray(): T[] {
        const res = []
        for (const i of this) {
            if (i.data !== undefined) {
                res.push(i.data)
            }
        }
        return res
    }
}


