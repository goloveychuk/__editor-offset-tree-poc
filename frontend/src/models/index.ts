import { Atom } from '@grammarly/focal'

import { getDiff, validateDiff, Diff, InputKeyboardEvent } from '../utils'
import { ReadOnlyAtom } from '@grammarly/focal/dist/src/atom/base';
import { inspect } from 'util';
import { retry } from 'rxjs/operators/retry';
import {OrderedMap} from '../structs'
import { Observable, ObservableInput } from 'rxjs/Observable'

export enum InspectionType {
    UnknownWord = 'unknown_word'
}

export interface Inspection {
    id: number
    start: number
    end: number
    kind: InspectionType
    rev: number
}

export interface TextNode {
    id: string
    text: string
    highlighted?: boolean
    isInspection?: boolean
}


export class State {
    inspections = new Inspections()


    text: string
    cursorPosition: number
    constructor({ text }: { text: string }) {
        this.text = text
    }
    // nodes: TextNode[] = []
}


interface DiffWithRev extends Diff {
    rev: number
}
class RevisionsData {
    currentRevision = 0
    buffer: DiffWithRev[] = []
    addDiff(diff: Diff) {
        this.currentRevision += 1
        const newDiff: DiffWithRev = Object.assign({}, diff, { rev: this.currentRevision })
        this.buffer.push(newDiff)
        return newDiff
    }
    getDiffs(rev: number) {
        this.removeDiffs(rev)
        return this.buffer;
    }
   
    removeDiffs(rev: number) {
        const toRemoveInd = this.buffer.findIndex(i => i.rev > rev)
        if (toRemoveInd === -1) {
            this.buffer = []
            return
        }
        this.buffer = this.buffer.slice(toRemoveInd)
    }

}

export type NodesForView = OrderedMap<string, TextNode>



class Inspections {
    inspections: Inspection[]
    constructor(initialInspections?: Inspection[]) {
        if (initialInspections !== undefined) {
            this.inspections = initialInspections
        } else {
            this.inspections = []
        }
    }
    private static _offset(inspections: Inspection[], diffs: Diff[]) {
        for (const ins of inspections) {
            let newStart = ins.start
            let newEnd = ins.end

            for (const diff of diffs) {
                const offset = diff.text.length - (diff.end - diff.start);

                if (diff.start <= newStart && diff.end <= newEnd) {
                    newStart += offset
                    newEnd += offset
                } else if (diff.start > newStart && diff.end < newEnd) {
                    newEnd += offset
                } else {
                    continue
                }
            }
            if (newStart === ins.start && newEnd === ins.end) {
                continue
            }
            ins.start = newStart
            ins.end = newEnd
        }
    }
    offset(diffs: Diff[]) {
        Inspections._offset(this.inspections, diffs)
    }
    add(inspection: Inspection, revisionsData: RevisionsData) {  //todo O(logn)
        const diffs = revisionsData.getDiffs(inspection.rev)

        Inspections._offset([inspection], diffs)
        
        const newInspections = [inspection].concat(this.inspections)
        newInspections.sort((a, b) => a.start - b.start)
        this.inspections = newInspections
    }
    remove(id: number) { //todo o(1)
        this.inspections = this.inspections.filter(ins => ins.id !== id)
        const idStr = id.toString()
    }
    textNodes(text: string, cursorPosition: number, cb: (id: string, text: string, isInspection?: boolean, highlighted?: boolean)=>void) {
        let lastInsInd = 0
        for (const ins of this) {
            if (ins.start !== lastInsInd) {
                cb(`${ins.id}#`, text.substring(lastInsInd, ins.start))
            }
            const highlighted = cursorPosition >= ins.start && cursorPosition <= ins.end

            cb(ins.id.toString(), text.substring(ins.start, ins.end), true,   highlighted)
            lastInsInd = ins.end;
        }
        if (lastInsInd !== text.length) {
            cb('last',text.substring(lastInsInd))
        }
    }
    [Symbol.iterator]() {
        return this.inspections[Symbol.iterator]()
    }

}

class InspectionProxy {
    
    constructor(public inspections: Inspections, private revisionsData: RevisionsData) {

    }
    add(inspection: Inspection) {
        this.inspections.add(inspection, this.revisionsData)
        return this
    }
    remove(id: number) {
        this.inspections.remove(id)  
        return this        
    }
}



export class StateModel {
    state: Atom<State>
    revisionsData = new RevisionsData()


    constructor({ text }: { text: string }) {
        this.state = Atom.create(new State({ text }))
    }

    modifyInspections(cb: (ins: InspectionProxy) => InspectionProxy) {
        this.state.lens('inspections').modify(inspections => {
            const newInspections = new Inspections(inspections.inspections)
            cb(new InspectionProxy(newInspections, this.revisionsData))
            return newInspections
        })
    }
    reset() {
        this.revisionsData = new RevisionsData()
        this.state.lens('inspections').set(new Inspections())
    }

    setText(newText: string, cursorPosition: number, ctx: { event: InputKeyboardEvent, position: number }) {
        let diff = getDiff(this.state.lens('text').get(), newText, ctx)
        if (diff === null) {
            return { diff }
        }

        this.state.modify(state => {
            const { text, inspections } = state;
            let newInspections = new Inspections(inspections.inspections)
            newInspections.offset([diff!])
            // validateDiff(text, newText, diff)

            return Object.assign({}, state, { cursorPosition, text: newText, inspections: newInspections })
        })

        return { diff: this.revisionsData.addDiff(diff) }

    }
    setCurPos(newPos: number) {
        this.state.modify(state => {
            return Object.assign({}, state, {'cursorPosition': newPos})
        })
    }
    
}

