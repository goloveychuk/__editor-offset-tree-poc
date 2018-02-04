import { Atom } from '@grammarly/focal'

import { getDiff, validateDiff, Diff, InputKeyboardEvent, replaceRange } from './utils'
import { ReadOnlyAtom } from '@grammarly/focal/dist/src/atom/base';
import { inspect } from 'util';
import { retry } from 'rxjs/operators/retry';
import { OrderedMap } from './structs'
import { Observable, ObservableInput } from 'rxjs/Observable'
import { Tree, Nodee } from './lib/tree'

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

export interface TextNodeData {
    text: string
    isInspection?: boolean
}


export class State {

    tree = new Tree<TextNodeData>(new Nodee<TextNodeData>(0, { text: '' }))
    text: string
    cursorPosition: number
    constructor({ text }: { text: string }) {
        this.text = text
        this.tree.root.data.text = text;
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

export type NodesForView = OrderedMap<string, TextNodeData>



// class Inspections {
//     private inspections: Inspection[]
//     private idIndex: Map<number, Inspection>
//     constructor() {
//         this.inspections = []
//         this.idIndex = new Map()

//     }
//     shallowCopy() {
//         const newIns = new Inspections()
//         newIns.inspections = this.inspections
//         newIns.idIndex = this.idIndex
//         return newIns
//     }
//     private static _offset(inspections: Inspection[], diffs: Diff[]) {
//         for (const ins of inspections) {
//             let newStart = ins.start
//             let newEnd = ins.end

//             for (const diff of diffs) {
//                 const offset = diff.text.length - (diff.end - diff.start);

//                 if (diff.start <= newStart && diff.end <= newEnd) {
//                     newStart += offset
//                     newEnd += offset
//                 } else if (diff.start > newStart && diff.end < newEnd) {
//                     newEnd += offset
//                 } else {
//                     continue
//                 }
//             }
//             if (newStart === ins.start && newEnd === ins.end) {
//                 continue
//             }
//             ins.start = newStart
//             ins.end = newEnd
//         }
//     }
//     offset(diffs: Diff[]) {
//         Inspections._offset(this.inspections, diffs)
//     }
//     add(inspection: Inspection, revisionsData: RevisionsData) {  //todo O(logn)
//         const diffs = revisionsData.getDiffs(inspection.rev)

//         Inspections._offset([inspection], diffs)

//         const newInspections = [inspection].concat(this.inspections)
//         newInspections.sort((a, b) => a.start - b.start)
//         this.inspections = newInspections
//         this.idIndex.set(inspection.id, inspection)
//     }
//     remove(id: number) { //todo o(1)
//         this.inspections = this.inspections.filter(ins => ins.id !== id)
//         this.idIndex.delete(id)
//     }
//     textNodes(text: string, cursorPosition: number, cb: (id: string, text: string, isInspection?: boolean, highlighted?: boolean) => void) {
//         let lastInsInd = 0
//         for (const ins of this) {
//             if (ins.start !== lastInsInd) {
//                 cb(`${ins.id}#`, text.substring(lastInsInd, ins.start))
//             }
//             const highlighted = cursorPosition >= ins.start && cursorPosition <= ins.end

//             cb(ins.id.toString(), text.substring(ins.start, ins.end), true, highlighted)
//             lastInsInd = ins.end;
//         }
//         if (lastInsInd !== text.length) {
//             cb('last', text.substring(lastInsInd))
//         }
//     }
//     [Symbol.iterator]() {
//         return this.inspections[Symbol.iterator]()
//     }
//     map<T>(cb: (ins: Inspection, ind: number)=>T) {
//         return this.inspections.map(cb)
//     }
//     getById(id: number) {
//         return this.idIndex.get(id)
//     }
// }

// class InspectionProxy {

//     constructor(public inspections: Inspections, private revisionsData: RevisionsData) {

//     }
//     add(inspection: Inspection) {
//         this.inspections.add(inspection, this.revisionsData)
//         return this
//     }
//     remove(id: number) {
//         this.inspections.remove(id)
//         return this
//     }
// }



export class StateModel {
    state: Atom<State>
    revisionsData = new RevisionsData()

    inspectionsIndex = new Map<number, Nodee<TextNodeData>>()


    constructor({ text }: { text: string }) {
        this.state = Atom.create(new State({ text }))
    }

    // modifyInspections(cb: (ins: InspectionProxy) => InspectionProxy) {
    //     this.state.lens('inspections').modify(inspections => {
    //         const newInspections = inspections.shallowCopy()
    //         cb(new InspectionProxy(newInspections, this.revisionsData))
    //         return newInspections
    //     })
    // }
    reset() {
        // this.revisionsData = new RevisionsData()
        // this.state.lens('inspections').set(new Inspections())
    }

    addInspection(ins: Inspection) {
        this.state.modify(state => {
            const nodes = Array.from(state.tree.modify(ins.start, ins.end))
            if (nodes.length !== 1) {
                throw new Error('smth wrong')
            }
            const { node, start, end } = nodes[0]
            const { data } = node;

            if (data.isInspection) {
                throw new Error('smth wrong')
            }

            const initialText = data.text


            const inspectionNodeD: TextNodeData = {
                text: initialText.slice(start, end),
                isInspection: true
            }

            let inspectionNode: Nodee<TextNodeData>

            data.text = data.text.slice(0, start) //todo offsets

            if (data.text.length !== 0) {
                inspectionNode = new Nodee(start, inspectionNodeD)
                state.tree.insertRightForNode(node, inspectionNode)
            } else {
                inspectionNode = node
                node.data = inspectionNodeD
            }

            this.inspectionsIndex.set(ins.id, inspectionNode)


            const rightNodeD: TextNodeData = {
                text: initialText.slice(end)
            }

            if (rightNodeD.text.length !== 0) {
                const rightNode = new Nodee(end - start, rightNodeD)
                state.tree.insertRightForNode(inspectionNode, rightNode)
            }

            return Object.assign({}, state, { tree: state.tree.shallowCopy() })
        })
    }
    removeInspection(id: number) {
        const node = this.inspectionsIndex.get(id)
        if (node === undefined) {
            throw new Error('ins not found')
        }
        this.inspectionsIndex.delete(id)
        this.state.modify(state => {
            const { tree } = state;
            const left = node.getLeft()
            if (left !== undefined && !left.data.isInspection) {
                left.data.text = left.data.text.concat(node.data.text)
                const leftRight = left.getRight()
                if (leftRight !== undefined) {
                    leftRight.offset += node.data.text.length;
                }
                // tree.removeNode(node)

                // const leftLeft 
            }
            return Object.assign({}, state, { tree: state.tree.shallowCopy() })
        })
    }

    setText(newText: string, cursorPosition: number, ctx: { event: InputKeyboardEvent, position: number }) {
        let diff = getDiff(this.state.lens('text').get(), newText, ctx)
        if (diff === null) {
            return { diff }
        }

        this.state.modify(state => { //todo merge !inspection nodes  
            const { tree } = state;
            // let newInspections = inspections.shallowCopy()
            // newInspections.offset([diff!])
            // // validateDiff(text, newText, diff)
            for (const { node, start, end } of tree.modify(diff!.start, diff!.end)) {
                console.log(node, start, end)
                const data = node.data;
                // const rep = diff!.text.slice(proxy.start, proxy.end)
                const rep = diff!.text
                data.text = replaceRange(data.text, start, end, rep)             
                console.log(data)
                

                const offsetDiff = rep.length - (end - start)
                // tree.root.offset += offsetDiff

                if (node.right) {
                    node.right.offset += offsetDiff
                }

                let p = node

                if (node.offset < 0) {
                    p.offset -= offsetDiff
                }

                while (p.parent) {

                    if (p.isLeft() && p.parent.isRight()) {
                        p.parent.offset += offsetDiff
                    } else if (p.isRight() && p.parent.isLeft()) {
                        p.parent.offset -= offsetDiff
                    }

                    p = p.parent
                }
                if (node.data.text.length === 0) {
                    tree.removeNode(node)
                }

            }

            return Object.assign({}, state, { text: newText, tree: tree.shallowCopy() })
        })

        return { diff: this.revisionsData.addDiff(diff) }

    }
    setCurPos(newPos: number) {
        this.state.modify(state => {
            return Object.assign({}, state, { 'cursorPosition': newPos })
        })
    }

}

