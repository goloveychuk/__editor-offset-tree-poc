// {
import { NodesForView, TextNode } from '../../models'

type NodeElement = HTMLSpanElement | Text

namespace Updates {

    export enum UpdateType {
        removeNode,
        insertNode,
        replaceText,
        replaceNode,
        replaceClass
    }


    interface InsertUpdate {
        type: UpdateType.insertNode
        afterKey: string | undefined // undefined for first
        text: string
        key: string
        class: string
    }

    interface RemoveUpdate {
        type: UpdateType.removeNode
        key: string
    }

    interface ReplaceTextUpdate {
        type: UpdateType.replaceText
        key: string
        text: string
    }
    interface ReplaceClass {
        type: UpdateType.replaceClass,
        key: string
        class: string
    }
    interface ReplaceNodeUpdate {
        type: UpdateType.replaceNode
        prevKey: string
        nextKey: string
    }

    export type Update = InsertUpdate | RemoveUpdate | ReplaceTextUpdate | ReplaceNodeUpdate | ReplaceClass

    export type UpdateQueue = Update[]

}

class State {
    elements = new Map<string, HTMLSpanElement>()
}

function getClass(nod: TextNode) {
    let res = ''
    if (nod.isInspection) {
        res += ' inspection'
    }
    if (nod.highlighted) {
        res += ' highlighted'
    }
    return res
}

export class Renderer {
    state = new State()

    updateQueue: Updates.UpdateQueue = []
    constructor(readonly container: HTMLElement) {

    }

    commitToDOM() {
        const elements = this.state.elements;
        const { container } = this;
        console.log(this.updateQueue.length)
        for (const u of this.updateQueue) {
            switch (u.type) {
                case Updates.UpdateType.insertNode:
                    const nod1 = document.createElement('span')
                    nod1.textContent = u.text
                    nod1.setAttribute('class', u.class)
                    elements.set(u.key, nod1)
                    let insertBefore
                    if (u.afterKey !== undefined) {
                        insertBefore = elements.get(u.afterKey)!.nextSibling
                    } else {
                        insertBefore = container.firstChild;
                    }
                    container.insertBefore(nod1, insertBefore)
                    break
                case Updates.UpdateType.removeNode:
                    const nod2 = elements.get(u.key)!
                    nod2.remove()
                    elements.delete(u.key)
                    break
                case Updates.UpdateType.replaceNode:
                    elements.set(u.nextKey, elements.get(u.prevKey)!)
                    elements.delete(u.prevKey)
                    break
                case Updates.UpdateType.replaceText:
                    const nod3 = elements.get(u.key)!
                    nod3.textContent = u.text
                    break
                case Updates.UpdateType.replaceClass:
                    const nod4 = elements.get(u.key)!
                    nod4.setAttribute('class', u.class)
                    break
            }
        }
        this.updateQueue = []
    }

    compare(prevNodes: NodesForView, nextNodes: NodesForView) {
        let prevInd = 0;
        let nextInd = 0


        const updates: Updates.UpdateQueue = []
        let lastKey: string | undefined = undefined;

        while (true) {

            const prev = prevNodes.getByIndex(prevInd)
            const next = nextNodes.getByIndex(nextInd)
            if (prev === undefined && next === undefined) { //finish
                break
            } else if (prev === undefined) { //added new in the end
                Renderer.insertNew(next, lastKey, updates)
                nextInd += 1
                lastKey = next.id
            } else if (next === undefined) { //removed in the end
                Renderer.removeOld(prev, updates)
                prevInd += 1
            } else if (prev.id !== next.id) { //nodes are different
                if (prevNodes.has(next.id)) { // prev node is removed
                    Renderer.removeOld(prev, updates)
                    prevInd += 1
                } else if (nextNodes.has(prev.id)) { // next node is added
                    Renderer.insertNew(next, lastKey, updates)
                    nextInd += 1
                    lastKey = next.id
                } else { //node was replaced completely
                    updates.push({
                        type: Updates.UpdateType.replaceNode,
                        prevKey: prev.id,
                        nextKey: next.id
                    })
                    Renderer.checkNodeDiff(prev, next, updates)
                    nextInd += 1
                    prevInd += 1
                    lastKey = next.id
                }
            } else { //nodes are same, but maybe have changes 
                Renderer.checkNodeDiff(prev, next, updates)
                lastKey = next.id
                prevInd += 1
                nextInd += 1
            }
        }
        this.updateQueue.push(...updates)
        return updates
    }
    static insertNew(next: TextNode, lastKey: string | undefined, updates: Updates.UpdateQueue) {
        updates.push({
            type: Updates.UpdateType.insertNode,
            class: getClass(next),
            text: next.text,
            afterKey: lastKey,
            key: next.id,
        })
    }
    static removeOld(prev: TextNode, updates: Updates.UpdateQueue) {
        updates.push({
            type: Updates.UpdateType.removeNode,
            key: prev.id
        })
    }


    static checkNodeDiff(prev: TextNode, next: TextNode, updates: Updates.UpdateQueue) {
        if (prev.text !== next.text) {
            updates.push({
                type: Updates.UpdateType.replaceText,
                text: next.text,
                key: next.id
            })
        }
        if (prev.highlighted !== next.highlighted || prev.isInspection !== next.isInspection) {
            updates.push({
                type: Updates.UpdateType.replaceClass,
                class: getClass(next),
                key: next.id
            })

        }
    }

}