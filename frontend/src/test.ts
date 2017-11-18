import {Tree, Nodee} from './lib/tree';



type Data = string


export const tree = new Tree<Data>()


const data: [number, number, Data][] = [
    [50, 80, 'c'],
    [10, 20, 'a'],
    [30, 45, 'b'],
    [90, 101, 'd'],
    [105, 110, 'e'],

]

for (const [low, high, d] of data) {
    tree.insert(low, high, d)
}


for (const i of tree) {
    console.log(i)
}

