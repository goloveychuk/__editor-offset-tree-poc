import { Tree, Nodee } from './lib/tree';



type Data = string


export const tree = new Tree<Data>()


const data: [number, number, Data][] = [
    [90, 101, 'd'],
    [10, 20, 'a'],
    [50, 80, 'c'],
    [30, 45, 'b'],
    [15, 16, 'e'],
]

// for (const [low, high, d] of data) {
//     tree.insert(low, high, d)
// }
function test() {

    const inds = new Map()
    const indsArr: number[] = []

    function fill() {
        for (let i = 0; i < 6; i++) {
            const ind = Math.ceil(Math.random() * 100)
            if (inds.has(ind)) {
                continue
            }
            tree._testInsert(ind, '')
            inds.set(ind, true)
            indsArr.push(ind)
        }
        indsArr.sort((a, b) => a - b)
    }

    function testIndexes() {
        let i = 0
        for (const n of tree) {
            const ind = n._testComputeIndex()
            const indCmp = indsArr[i]
            if (ind !== indCmp) {
                throw new Error('bad val')
            }
            i += 1
        }
    }

    function testBalancing() {
        if (tree._testIsBalanced(tree.root) === false) {
            throw new Error('not balanced')
        }
    }
    fill()
    testIndexes()
    testBalancing()
    console.log('success')
}

// test()