
function getBalanceState(node: Nodee<any>) {
    var heightDifference = node.leftHeight() - node.rightHeight();
    return heightDifference
}

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
    balance() {
        const balanceState = getBalanceState(this);
        if (balanceState === 2) {
            if (getBalanceState(this.left!) < 0) {
                console.log('right left rotate')
                this.left = this.left!.rotateLeft()
                return this.rotateRight()
            } else {
                console.log('right rotate')
                return this.rotateRight()
            }

        } else if (balanceState === -2) {
            if (getBalanceState(this.right!) > 0) {
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
    
}


export class Tree<T> {
    root?: Nodee<T>

    insert(start: number, end: number, data: T) {

        this.root = this._insert(this.root, start, data)
        this.root = this._insert(this.root, end, data)

    }

    _testInsert(ind: number, data: T) {
        this.root = this._insert(this.root, ind, data)
    }
    _testIsBalanced(node: Nodee<T> | undefined): boolean {
        if (node === undefined) {
            return true
        }
        if(node._testHeighForBalancing() === -1) {
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
}


