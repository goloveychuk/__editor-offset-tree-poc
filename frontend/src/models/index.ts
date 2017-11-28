import { Atom } from '@grammarly/focal'

import { getDiff, validateDiff, Diff, InputKeyboardEvent } from '../utils'
import { ReadOnlyAtom } from '@grammarly/focal/dist/src/atom/base';


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
    id: number
    text: string
    highlighted?: boolean
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
        return Object.assign({}, ins, { start: newStart, end: newEnd })

    })
    return res
}
interface DiffWithRev extends Diff {
    rev: number
}
class RevisionsData {
    currentRevision = 0
    buffer: DiffWithRev[] = []
    addDiff(diff: Diff) {
        this.currentRevision += 1
        const newDiff: DiffWithRev = Object.assign({}, diff, {rev: this.currentRevision})
        this.buffer.push(newDiff)
        return newDiff
    }
    correctInspection(inspection: Inspection) {
        this.cleanOldRevisions(inspection.rev)
        let newInspection = inspection
        
        for (const i of this.buffer) {
            newInspection = offsetInspections(i, [newInspection])[0]
        }
        return newInspection
    }
    cleanOldRevisions(rev: number){
        const toRemoveInd = this.buffer.findIndex(i => i.rev > rev)
        if (toRemoveInd === -1) {
            this.buffer = []
            return
        }
        this.buffer = this.buffer.slice(toRemoveInd)
    }
    okResponse({rev}: {rev: number}) {
        this.cleanOldRevisions(rev)
    }
    
}

export interface NodesForView {
    nodes: (TextNode|string)[]
    nodesIndex: {[key: number]: TextNode}
}

export class StateModel {
    state: Atom<State>

    revisionsData = new RevisionsData()

    constructor({ text }: { text: string }) {
        this.state = Atom.create(new State({ text }))
    }
    addInspection(inspection: Inspection) {
        this.state.lens('inspections').modify(inspections => {  //todo
            inspection = this.revisionsData.correctInspection(inspection)
            // let ind = 0
            // for (const ins of inspections) {
            //     if (inspection.start > ins.start) {
            //         break
            //     }
            //     ind += 1
            // }
            // return inspections.slice(0, ind).concat([inspection]).concat(inspections.slice(ind))
            const newInspections = [inspection].concat(inspections)
            newInspections.sort((a, b) => a.start - b.start)
            return newInspections
        })
    }
    removeInspection(id: number) {
        this.state.lens('inspections').modify(inspections => {
            return inspections.filter(ins => ins.id !== id) //todo
        })
    }
    reset() {
        this.revisionsData = new RevisionsData()
        this.state.lens('inspections').set([])
    }
    
    setText(newText: string, ctx: { event: InputKeyboardEvent, position: number }) {
        let diff = getDiff(this.state.lens('text').get(), newText, ctx)
        if (diff === null) {
            return {diff}
        }

        this.state.modify(state => {
            const { text, inspections } = state;
            let newInspections = offsetInspections(diff!, state.inspections)
            // validateDiff(text, newText, diff)

                
            return Object.assign({}, state, {text: newText, inspections: newInspections})            
        })

        return { diff: this.revisionsData.addDiff(diff) }
        
    }
    setCurPos(newPos: number) {
        this.state.lens('cursorPosition').set(newPos)
    }

    getNodes(): ReadOnlyAtom<NodesForView> { 
        return this.state.view(st => ({
            inspections: st.inspections,
            text: st.text,
            cursorPosition: st.cursorPosition,
        })).view(({ inspections, text, cursorPosition }) => {
            let res: (TextNode|string)[] = []
            let nodesIndex: {[key: number]: TextNode} = {}
            let lastInsInd = 0
            for (const ins of inspections) {
                if (ins.start !== lastInsInd) {
                    res.push(text.substring(lastInsInd, ins.start))
                }
                const highlighted = cursorPosition >= ins.start && cursorPosition <= ins.end

                const node = {
                    text: text.substring(ins.start, ins.end), 
                    id: ins.id,
                    highlighted
                }

                nodesIndex[node.id] = node

                res.push(node)
                lastInsInd = ins.end;
            }
            if (lastInsInd !== text.length) {
                res.push(text.substring(lastInsInd))
            }
            console.log(res)
            return {nodes: res, nodesIndex}
        })
    }
}

