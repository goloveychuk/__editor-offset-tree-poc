import { Atom } from '@grammarly/focal'

import { getDiff, validateDiff, Diff } from '../utils'


export enum InspectionType {
    UnknownWord = 'unknown_word'
}

export interface Inspection {
    id: number
    start: number
    end: number
    kind: InspectionType
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
        return Object.assign({}, ins, { start: newStart, end: newEnd })

    })
    return res
}

export class StateModel {
    state: Atom<State>
    constructor({ text }: { text: string }) {
        this.state = Atom.create(new State({ text }))
    }
    addInspection(inspection: Inspection) {
        this.state.lens('inspections').modify(inspections => {  //todo
            // let ind = 0
            // for (const ins of inspections) {
            //     if (inspection.start > ins.start) {
            //         break
            //     }
            //     ind += 1
            // }
            // return inspections.slice(0, ind).concat([inspection]).concat(inspections.slice(ind))
            const newInspections = [inspection].concat(inspections)
            newInspections.sort((a,b) => a.start - b.start)
            return newInspections
        })
    }
    removeInspection(id: number) {
        this.state.lens('inspections').modify(inspections => {
            return inspections.filter(ins => ins.id !== id) //todo
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
        return { diff }
    }
    setCurPos(newPos: number) {
        this.state.lens('cursorPosition').set(newPos)
    }

    getNodes() {
        return this.state.view(st => ({
            inspections: st.inspections,
            text: st.text,
            cursorPosition: st.cursorPosition,
        })).view(({ inspections, text, cursorPosition }) => {
            let res: TextNode[] = []
            let lastInsInd = 0
            for (const ins of inspections) {
                if (ins.start !== lastInsInd) {
                    res.push(new TextNode(text.substring(lastInsInd, ins.start)))
                }
                const highlighted = cursorPosition >= ins.start && cursorPosition <= ins.end
                res.push(new TextNode(text.substring(ins.start, ins.end), ins, highlighted))
                lastInsInd = ins.end;
            }
            if (lastInsInd !== text.length) {
                res.push(new TextNode(text.substring(lastInsInd)))
            }
            console.log(res)
            return res
        })
    }
}

