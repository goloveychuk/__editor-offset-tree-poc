import { Atom } from '@grammarly/focal'
import { Tree } from './lib/tree'
import { getDiff, validateDiff, Diff } from './utils'


export class Inspection {

    constructor(public start: number, public end: number) {

    }
}

export class TextNode {
    id: number
    text: string

    inspection?: Inspection
    constructor(text: string, inspection?: Inspection, readonly highlighted?: boolean) {
        this.text = text;
        this.id = Math.random() * 100
        this.inspection = inspection
    }
}


export class State {
    inspections: Inspection[] = []
    text: string
    cursorPosition: number
    constructor({ text }: { text: string }) {
        this.text = text
    }
    // nodes: TextNode[] = []
}

function offsetInspections(diff: Diff, inspections: Inspection[]): Inspection[] {
    const offset = diff.text.length - (diff.end - diff.start);

    const res = inspections.map(ins => {
        let newStart = ins.start
        let newEnd = ins.end
        if (diff.start <= ins.start && diff.end <= ins.end) {
            newStart += offset
            newEnd += offset            
        } else if (diff.start > ins.start && diff.end < ins.end) {
            newEnd += offset                        
        } else {
            return ins
        }
        return new Inspection(newStart, newEnd)
        
    })
    return res
}

export class StateModel {
    state: Atom<State>
    constructor({ text }: { text: string }) {
        this.state = Atom.create(new State({ text }))
    }
    addInspection(inspection: Inspection) {
        this.state.lens('inspections').modify(inspections => {
            return [inspection].concat(inspections)
        })
    }
    setText(newText: string) {
        const text = this.state.lens('text').get()

        const diff = getDiff(text, newText)
        validateDiff(text, newText, diff)
        if (diff !== null) {
            this.state.lens('inspections').modify(inspections => {
                return offsetInspections(diff, inspections)
            })
        }

        this.state.lens('text').set(newText)
    }
    setCurPos(newPos: number) {
        this.state.lens('cursorPosition').set(newPos)
    }
}

