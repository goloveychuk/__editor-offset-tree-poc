import { Atom  } from '@grammarly/focal'
import {Tree} from './lib/tree'

export class Inspection {
    id: number
}

export class TextNode {
    id: number
    text: string

    inspections: Map<number, Inspection>
    constructor(text: string) {
        this.text =text;
        this.id = Math.random()*100
    }
}

function replaceRange(s: string, start: number, end: number, substitute: string) {
    return s.substring(0, start) + substitute + s.substring(end);
}


export class State {
    tree = new Tree<TextNode>()
    nodes: TextNode[] = []
}

let n = 0;

export class StateModel {
    state: Atom<State>
    constructor() {
        this.state = Atom.create(new State())
    }
    setText(start: number, end: number, text: string) {
        this.state.lens('nodes').modify(_ => {   //todo rm hack
            const textNode = new TextNode(text)
            const tree = this.state.lens('tree').get()
            tree.insert(start, end, textNode)
            return tree.toArray()
        })
        this.state.lens('tree').modify((t)=>{   //todo rm hack
            const newTree = new Tree<TextNode>()
            newTree.root = t.root;
            (newTree as any).s = n++
            return newTree
        })
    }
}

