import { Atom } from '@grammarly/focal'
import { Tree } from './lib/tree'

export class Inspection {
    
    constructor(public start: number, public end: number) {
        
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


export class State {
    inspections: Inspection[]
    nodes: TextNode[] = []
}



export class StateModel {
    state: Atom<State>
    constructor() {
        this.state = Atom.create(new State())
    }
    
}

