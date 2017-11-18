enum BalanceState {
    UNBALANCED_RIGHT,
    SLIGHTLY_UNBALANCED_RIGHT,
    SLIGHTLY_UNBALANCED_LEFT,
    UNBALANCED_LEFT,
    BALANCED
}


function getBalanceState(node: Nodee<any>) {
    var heightDifference = node.leftHeight() - node.rightHeight();
    switch (heightDifference) {
        case -2: return BalanceState.UNBALANCED_RIGHT;
        case -1: return BalanceState.SLIGHTLY_UNBALANCED_RIGHT;
        case 1: return BalanceState.SLIGHTLY_UNBALANCED_LEFT;
        case 2: return BalanceState.UNBALANCED_LEFT;
        default: return BalanceState.BALANCED;
    }
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
    computeIndex() { //for debug purposes
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
        if (balanceState === BalanceState.UNBALANCED_LEFT) {
            if (getBalanceState(this.left!) === BalanceState.UNBALANCED_RIGHT) {
                console.log('right left rotate')        
                this.left = this.left!.rotateLeft()
                return this.rotateRight()
            } else {
                console.log('right rotate')                        
                return this.rotateRight()
            }

        } else if (balanceState === BalanceState.UNBALANCED_RIGHT) {
            if (getBalanceState(this.right!) === BalanceState.UNBALANCED_LEFT) {
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

    
}


export class Tree<T> {
    root?: Nodee<T>

    insert(start: number, end: number, data: T) {
        
        this.root = this._insert(this.root, start, data)
        this.root = this._insert(this.root, end, data)
        
    }

    _insert(root: Nodee<T> | undefined, offset: number, data: T): Nodee<T> {


        if (root === undefined) {
            return new Nodee(offset, data)
        }

        if (offset === root.offset) {
            return root
        }
        if (offset < root.offset) {
            root.left = this._insert(root.left, offset-root.offset, data)
            root.left.parent = root
        } else {
            root.right = this._insert(root.right, offset-root.offset, data)
            root.right.parent = root            
        }


        root.height = Math.max(root.leftHeight(), root.rightHeight()) + 1;
        return root.balance()
    }

    [Symbol.iterator]() {
        function* helper(node?: Nodee<T>): IterableIterator<T> {
            if (node === undefined) {
                return
            }
            if (node.left !== undefined) {
                yield* helper(node.left)
            }
            yield node.data
            if (node.right !== undefined) {
                yield* helper(node.right)
            }
        }
        return helper(this.root)
    }
}


