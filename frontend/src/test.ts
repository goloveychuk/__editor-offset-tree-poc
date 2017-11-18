import {Tree, Nodee} from './lib/tree';



type Data = string


export const tree = new Tree<Data>()


const data: [number, number, Data][] = [
    [90, 101, 'd'],
    [10, 20, 'a'],
    // [11, 21, 'a'],
    // [12, 23, 'a'],
    // [13, 25, 'a'],
    [50, 80, 'c'],
    [30, 45, 'b'], //todo bug
    // [105, 110, 'e'],
 
    // [15, 30, 'e'],
    // [35, 42, 'e'],
    // [21, 56, 'e'],
    // [75, 100, 'e'],

]

for (const [low, high, d] of data) {
    tree.insert(low, high, d)
}



for (const i of tree) {
    console.log(i)
}

