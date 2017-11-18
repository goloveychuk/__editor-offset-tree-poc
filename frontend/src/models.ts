import { Atom } from '@grammarly/focal'


export class Inspection {
    id: number
}

export class Node {
    id: number
    text: string
    len: number

    inspections: Map<number, Inspection>
    constructor(text: string, len: number) {
        this.text =text;
        this.id = Math.random()*100
        this.len = len
    }
}

function replaceRange(s: string, start: number, end: number, substitute: string) {
    return s.substring(0, start) + substitute + s.substring(end);
}

export class Nodes {
    index: Node[]
    constructor() {
        this.index = []
    }
    insert(start: number, end: number, val: string) {
        let v = 0
        for (const i of this.index) {
            if (start <= v + i.len) {
                i.text = replaceRange(i.text, start-v, end-v, val)
                break
            }
            v += i.len
        }
    }
}

export class State {
    nodes: Array<Node>
}

export class StateModel {
    state: Atom<State>
    constructor() {
        this.state = Atom.create(new State())
    }
}

