import { replaceRange } from '../utils'



export class Nodee<T> {
    parent?: Nodee<T>
    
    left?: Nodee<T>
    right?: Nodee<T>

    leftLink?: Nodee<T>
    rightLink?: Nodee<T>

    data: T
    height = 0
    offset: number

    wasDeleted = false

    constructor(offset: number, data: T) {
        this.offset = offset
        this.data = data
        this.height = 1
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
            return 0
        }
        return this.left.height
    }
    rightHeight() {
        if (this.right === undefined) {
            return 0
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

        this.recalcHeight();
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

        this.recalcHeight();
        newRoot.height = Math.max(newRoot.leftHeight(), this.height) + 1;
        return newRoot;
    }
    recalcHeight() {
        this.height = Math.max(this.leftHeight(), this.rightHeight()) + 1;
    }
    heightDifference() {
        var heightDifference = this.leftHeight() - this.rightHeight();
        return heightDifference
    }
    balance(): Nodee<T> {
        const heightDifference = this.heightDifference();
        if (heightDifference >= 2) {
            if (this.left!.heightDifference() < 0) {
                console.log('right left rotate')
                this.left = this.left!.rotateLeft()
                return this.rotateRight()
            } else {
                console.log('right rotate')
                return this.rotateRight()
            }

        } else if (heightDifference <= -2) {
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
    _testGetHeight(): number {
        const leftH = (this.left !== undefined) ? this.left._testGetHeight() : 0
        const rightH = (this.right !== undefined) ? this.right._testGetHeight() : 0
        return Math.max(leftH, rightH) + 1
    }
    getLeft() {
        return this.leftLink
    }

    getRight() {
        return this.rightLink
    }
    getMinNode() {
        let node: Nodee<T> = this;
        while (node.left) {
            node = node.left
        }
        return node
    }
    isLeft() {
        return this.offset <= 0 && this.parent
    }
    isRight() {
        return this.offset > 0
    }

    offsetNode(offsetDiff: number) {
        if (this.right) {
            this.right.offset += offsetDiff
        }

        let p: Nodee<T> = this

        if (this.isLeft()) {
            p.offset -= offsetDiff
        }

        while (p.parent) {

            if (p.isLeft() && p.parent.isRight()) {
                p.parent.offset += offsetDiff
            } else if (p.isRight() && p.parent.isLeft()) {
                p.parent.offset -= offsetDiff
            }

            p = p.parent
        }
    }
}



export class Tree<T> {
    root: Nodee<T>
    id = 1
    shallowCopy(): this {
        let tr = new (this.constructor as any)(this.root)
        tr.id = this.id + 1
        return tr
    }
    constructor(root: Nodee<T>) {
        this.root = root
    }

    insertRightForNode(node: Nodee<T>, insert: Nodee<T>) { //insert should be empty
        if (node.right !== undefined) {
            // 
            node.right.parent = insert
            node.right.offset -= insert.offset
            if (node.isRight()) {
                insert.right = node.right
            } else if (node.isLeft()) {
                insert.left = node.right
            }
            //todo mb rebalance
        }
        if (node.rightLink) {
            node.rightLink.leftLink = insert
            insert.rightLink = node.rightLink
        }

        node.rightLink = insert
        insert.leftLink = node

        node.right = insert
        insert.parent = node

        let p: Nodee<T> | undefined = node
        this.root = this._balanceUp(insert)

    }

    _balanceUp(node: Nodee<T>): Nodee<T> {

        node.recalcHeight()

        const balancedNode = node.balance()


        if (balancedNode.parent === undefined) {
            return balancedNode
        }

        if (balancedNode !== node) {
            if (balancedNode.isLeft()) {
                balancedNode.parent.left = balancedNode
            } else if (balancedNode.isRight()) {
                balancedNode.parent.right = balancedNode
            }
        }

        return this._balanceUp(balancedNode.parent)
    }
    removeNode(node: Nodee<T>) {
        node.wasDeleted = true

        if (node.leftLink) {
            node.leftLink.rightLink = node.rightLink
        }
        if (node.rightLink) {
            node.rightLink.leftLink = node.leftLink
        }

        const { newNode, toBalance } = this._removeNode(node)

        if (newNode) {
            newNode.parent = node.parent
        }

        if (node.parent) {

            if (node.isLeft()) {
                node.parent.left = newNode
            } else if (node.isRight()) {
                node.parent.right = newNode
            }
        }
        const nodeToBalance = toBalance || newNode

        if (nodeToBalance) {
            this.root = this._balanceUp(nodeToBalance)
        }

    }

    _removeNode(node: Nodee<T>): { newNode?: Nodee<T>, toBalance?: Nodee<T> } {
        if (node.left && node.right) {
            const minNode = node.right.getMinNode()

            minNode.left = node.left
            node.left.parent = minNode
            // minNode.recalcHeight()

            node.right.offset += node.offset
            return { newNode: node.right, toBalance: minNode }

        } else if (node.left) {
            node.left.offset += node.offset
            return { newNode: node.left }
        } else if (node.right) {
            node.right.offset += node.offset
            return { newNode: node.right }
        } else {
            return { newNode: undefined, toBalance: node.parent }
        }
    }

    _testIsBalanced(node: Nodee<T> | undefined): boolean {
        if (node === undefined) {
            return true
        }
        if (node._testHeighForBalancing() === -1) {
            return false
        }
        return this._testIsBalanced(node.left) && this._testIsBalanced(node.right)
    }

   

    _testTraverse() {
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
    *[Symbol.iterator](): IterableIterator<Nodee<T>> {
        let p: Nodee<T> | undefined = this.root.getMinNode()

        while (p) {
            yield p
            p = p.rightLink
        }
    }
}


