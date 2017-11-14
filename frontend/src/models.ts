import { Atom } from '@grammarly/focal'


export class Inspection {
    id: number
}

export class Node {
    id: number
    text: string
    inspections: Map<number, Inspection>
    constructor(text: string) {
        this.text =text;
        this.id = Math.random()*100
    }
}

export class State {
    nodes: Array<Node> = []
}

export class StateModel {
    state: Atom<State>
    constructor() {
        this.state = Atom.create(new State())
    }
}

