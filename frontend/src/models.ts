import { Atom } from '@grammarly/focal'
import { Tree } from './lib/tree'

export class Inspection {
    constructor(){

    }
}

export class TextNode {
    id: number
    text: string

    inspection?: Inspection
    constructor(text: string) {
        this.text = text;
        this.id = Math.random() * 100
    }
}

function replaceRange(s: string, start: number, end: number, substitute: string) {
    return s.substring(0, start) + substitute + s.substring(end);
}


export class State {
    tree = new Tree<TextNode>()
    nodes: TextNode[] = []
}



export class StateModel {
    state: Atom<State>
    constructor() {
        this.state = Atom.create(new State())
    }
    updateTree(updFn: (tree: Tree<TextNode>) => void) {
        this.state.lens('nodes').modify(_ => {   //todo rm hack
            const tree = this.state.lens('tree').get()
            updFn(tree)
            return tree.toArray()
        })
        this.state.lens('tree').modify((t) => {   //todo rm hack
            const newTree = new Tree<TextNode>()
            newTree.root = t.root;
            newTree.id = t.id + 1
            return newTree
        })
    }
    setText(start: number, end: number, text: string) {
        this.updateTree(tree => {
            const p = tree.find(start)
            // if (p === undefined) {
                const textNode = new TextNode(text)
                tree.insert(start, end, textNode)
                return
            // }
            // const newText = replaceRange(p.data!.text, start, end, text)
            // if (newText.length === 0) {
            //     p.data!.text = newText //todo                
            //     p.remove()
            // } else {
            //     p.data!.text = newText
            // }
        })
    }
    addInspection(start: number, end: number, inspection: Inspection) {
        
    }

    setupInitial() {
        this.updateTree(tree => {

        })
    }
}

