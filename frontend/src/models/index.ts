import { Atom } from '@grammarly/focal'

import { getDiff, validateDiff, Diff, InputKeyboardEvent } from '../utils'
import { ReadOnlyAtom } from '@grammarly/focal/dist/src/atom/base';
import { inspect } from 'util';
import { retry } from 'rxjs/operators/retry';


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

class OrderedMap<K, V> {
    private _list: V[]
    private _map: Map<K, V>
    constructor() {
        this._list = []
        this._map = new Map<K, V>()
    }
    add(key: K, val: V) {
        this._list.push(val)
        this._map.set(key, val)
    }
    push(val: V) {
        this._list.push(val)
    }
    get(key: K): V | undefined {
        return this._map.get(key)
    }
    [Symbol.iterator]() {
        return this._list[Symbol.iterator]()
    }
    get length() {
        return this._list.length
    }
    map<T>(cb: (v: V, ind: number) => T) {
        return this._list.map(cb)
    }

}


class Inspections {
    private inspections: Inspection[]
    constructor(initialInspections?: Inspection[]) {
        if (initialInspections !== undefined) {
            this.inspections = initialInspections
        } else {
            this.inspections = []
        }
    }
    private static _offset(inspections: Inspection[], diffs: Diff[]) {
        const res = inspections.map(ins => {
            let newStart = ins.start
            let newEnd = ins.end

            for (const diff of diffs) {
                const offset = diff.text.length - (diff.end - diff.start);

                if (diff.start <= ins.start && diff.end <= ins.end) {
                    newStart += offset
                    newEnd += offset
                } else if (diff.start > ins.start && diff.end < ins.end) {
                    newEnd += offset
                } else {
                    continue
                }
            }
            if (newStart === ins.start && newEnd === ins.end) {
                return ins
            }
            return Object.assign({}, ins, { start: newStart, end: newEnd })
        })
        return res
    }
    offset(diffs: Diff[]) {
        return new Inspections(Inspections._offset(this.inspections, diffs))
    }
    add(inspection: Inspection, revisionsData: RevisionsData) {  //todo O(logn)
        const diffs = revisionsData.getDiffs(inspection.rev)

        let correctedInspection = Inspections._offset([inspection], diffs)[0]
        
        const newInspections = [correctedInspection].concat(this.inspections)
        newInspections.sort((a, b) => a.start - b.start)

        return new Inspections(newInspections)
    }
    remove(id: number) { //todo o(1)
        return new Inspections(this.inspections.filter(ins => ins.id !== id))
    }
    [Symbol.iterator]() {
        return this.inspections[Symbol.iterator]()
    }

}

class InspectionProxy {
    constructor(public inspections: Inspections, private revisionsData: RevisionsData) {

    }
    add(inspection: Inspection) {
        this.inspections = this.inspections.add(inspection, this.revisionsData)
        return this
    }
    remove(id: number) {
        this.inspections = this.inspections.remove(id)
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
            const res = cb(new InspectionProxy(inspections, this.revisionsData))
            return res.inspections
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
            let newInspections = inspections.offset([diff!])
            // validateDiff(text, newText, diff)

            return Object.assign({}, state, { cursorPosition, text: newText, inspections: newInspections })
        })

        return { diff: this.revisionsData.addDiff(diff) }

    }
    setCurPos(newPos: number) {
        this.state.lens('cursorPosition').set(newPos)
    }

    getNodes(): ReadOnlyAtom<NodesForView> { //todo
        return this.state.view(st => ({
            inspections: st.inspections,
            text: st.text,
            cursorPosition: st.cursorPosition,
        })).view(({ inspections, text, cursorPosition }) => {
            let res = new OrderedMap<string, TextNode>()
            let nodesIndex: { [key: number]: TextNode } = {}
            let lastInsInd = 0
            for (const ins of inspections) {
                if (ins.start !== lastInsInd) {
                    res.add(`${ins.id}before`, {
                        id: `${ins.id}before`,
                        text: text.substring(lastInsInd, ins.start)
                    })
                }
                const highlighted = cursorPosition >= ins.start && cursorPosition <= ins.end

                const node = {
                    text: text.substring(ins.start, ins.end),
                    id: ins.id.toString(),
                    isInspection: true,
                    highlighted
                }

                res.add(node.id, node)
                lastInsInd = ins.end;
            }
            if (lastInsInd !== text.length) {
                res.add(`last`, {
                    id: 'last',
                    text: text.substring(lastInsInd)
                })
            }
            return res
        })
    }
}

