

export class Nodee<T> {
    left?: Nodee<T>
    right?: Nodee<T>
    parent?: Nodee<T>
    data: T
    offset: number
    constructor(offset: number, data: T) {
        this.offset = offset
        this.data = data
    }
}


export class Tree<T> {
    root?: Nodee<T>

    insert(start: number, end: number, data: T) {
        if (this.root === undefined) {
            this.root = new Nodee(start, data)
        }
        this._insert(start, data)
        this._insert(end, data)
    }
    _insert(ind: number, data: T) {
        let absVal = this.root!.offset
        let p: Nodee<T> = this.root!;
        
        while (true) {
            if (ind === absVal) {
                return
            }
            if (ind < absVal) {
                if (p.left === undefined) {
                    p.left = new Nodee(ind - absVal, data)
                    p.left.parent = p
                    break
                } else {
                    p = p.left
                    absVal = absVal + p.offset
                }
            } else {
                if (p.right === undefined) {              
                    p.right = new Nodee(ind - absVal, data)
                    p.right.parent = p
                    break
                } else {
                    p = p.right
                    absVal = absVal + p.offset                    
                }
            }
        }
    }
    [Symbol.iterator](){
        function* helper(node?: Nodee<T>): IterableIterator<T> {
            if (node === undefined) {
                return
            }
            if (node.left!==undefined) {
                yield* helper(node.left)
            }
            yield node.data
            if (node.right!==undefined) {
                yield* helper(node.right)
            }
        }
        return helper(this.root) 
    }
}


