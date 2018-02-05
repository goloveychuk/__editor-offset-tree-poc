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

export class TextNodeData {
    constructor(public text: string, public isInspection: boolean) {

    }
    canBeMerged() {
        return this.isInspection === false
    }
}


export class State {

    tree = new InspectionsTree(new Nodee<TextNodeData>(0, new TextNodeData('', false)))
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


class ModifyNodeProxy {

    constructor(public node: Nodee<TextNodeData>) { }

    setText(text: string) {
        const { node } = this;

        const offset = text.length - node.data.text.length

        node.data.text = text

        node.offsetNode(offset)
    }
}


class InspectionsTree extends Tree<TextNodeData> {
    *modify(findStart: number, findEnd: number, text: string) {
        let { node: startNode, ind } = this._find(findStart)


        let node: Nodee<TextNodeData> | undefined = startNode
        let start = ind
        let left = findEnd - findStart

        let sub = text
        while (node) {
            let end = Math.min(left + start, node.data.text.length)

            yield {node, start, end, sub}
            left -= (end - start)
            if (left <= 0) {
                return
            }
            sub = ''
            start = 0
            node = node.rightLink
        }
    }
    removeNode(node: Nodee<TextNodeData>) {
        if (node.data.text.length !== 0) {
            new ModifyNodeProxy(node).setText("")
        }
        super.removeNode(node)
    }
    _find(index: number) {
        let ind = index
        let p = this.root;

        while (p !== undefined) {
            ind -= p.offset
            if (ind === 0) {
                break
            }
            if (ind > 0) {
                if (p.right === undefined) {
                    break
                }
                if (ind < p.data.text.length) {
                    break
                }
                p = p.right
            } else if (ind < 0) {
                if (p.left === undefined) {
                    break
                }
                p = p.left
            }

        }
        return { node: p, ind } //todo
    }
    findNodeByRange(start: number, end: number) {
        let { node, ind } = this._find(start)
        if (node === undefined) {
            return
        }
        return {
            node, start: ind, end: end - start + ind,
        }
    }
}

function offsetInspection(ins: Inspection, diffs: Diff[]) {

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
        return ins
    }
    return Object.assign({}, ins, { start: newStart, end: newEnd })


}


export class StateModel {
    state: Atom<State>
    revisionsData = new RevisionsData()

    inspectionsIndex = new Map<number, Nodee<TextNodeData>>()


    constructor({ text }: { text: string }) {
        this.state = Atom.create(new State({ text }))
    }

    reset() {
        // this.revisionsData = new RevisionsData()
        // this.state.lens('inspections').set(new Inspections())
    }

    addInspection(_ins: Inspection) {
        this.state.modify(state => {
            const ins = offsetInspection(_ins, this.revisionsData.getDiffs(_ins.rev))
            const res = state.tree.findNodeByRange(ins.start, ins.end)
            if (res === undefined) {
                throw new Error('cant find')
            }
            const { node, start, end } = res
            const { data } = node;

            if (data.isInspection) {
                // debugger;
                console.warn('node is inspection')
                // throw new Error('smth wrong')
            }

            const initialText = data.text


            const inspectionNodeD = new TextNodeData(initialText.slice(start, end), true)

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


            const rightNodeD = new TextNodeData(initialText.slice(end), false)

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
        if (node.wasDeleted) {
            return
        }
        this.state.modify(state => {
            const { tree } = state;
            const left = node.getLeft()
            let nodesToMerge = []

            node.data.isInspection = false

            if (left !== undefined && left.data.canBeMerged()) {
                nodesToMerge.push(left)
            }
            nodesToMerge.push(node)

            const right = node.getRight()
            if (right !== undefined && right.data.canBeMerged()) {
                nodesToMerge.push(right)
            }

            for (let i=0; i< nodesToMerge.length; i++) {
                let next = nodesToMerge[i+1]
                if (next === undefined) {
                    break
                }
                const cur = nodesToMerge[i]
                new ModifyNodeProxy(cur).setText(cur.data.text.concat(next.data.text))
                tree.removeNode(next)
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

            diff = diff!

            for (const {node, start, end, sub} of tree.modify(diff.start, diff.end, diff.text)) {


                const newText = replaceRange(node.data.text, start, end, sub)


                new ModifyNodeProxy(node).setText(newText)

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

