// {
import { NodesForView, TextNode, State as ModelState } from '../../models'
import { Observable } from 'rxjs'

type NodeElement = HTMLSpanElement | Text

export namespace Updates {

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
    constructor(readonly container: HTMLElement, stream: Observable<ModelState>) {

        stream.scan(([cache, _]: [Map<string, TextNode>, any], { inspections, text, cursorPosition }: ModelState) => {
            const updates: Updates.UpdateQueue = []
            
            const { added, removed } = inspections;
            const res: TextNode[] = []
            let lastKey: string | undefined = undefined
            inspections.textNodes(text, cursorPosition, (node)=>{

             
                // if (removed.has(node.id)) {
                //     cache.delete(node.id)
                //     cache.delete(`${node.id}#`)
                // }
                const cachedNode = cache.get(node.id)
                if (cachedNode === undefined) {
                    cache.set(node.id, node)
                    Renderer.insertNew(node, lastKey, updates)
                } else {
                    if (Renderer.checkNodeDiff(cachedNode, node, updates)) {
                        cachedNode.text = node.text
                        cachedNode.isInspection = node.isInspection
                        cachedNode.highlighted = node.highlighted
                    }
                } 

                lastKey = node.id
            })

            for (const [i,] of removed) {
                updates.push({
                    type: Updates.UpdateType.removeNode,
                    key: i
                })
                cache.delete(i)
                cache.delete(`${i}#`)
            }

            return [cache, updates]
        }, [new Map<string, TextNode>(), []]).subscribe(([_, updates])=>{
            this.updateQueue = updates
            this.commitToDOM()
        })
    }

    commitToDOM() {
        const elements = this.state.elements;
        const { container } = this;
        console.log(this.updateQueue.length)
        for (const u of this.updateQueue) {
            switch (u.type) {
                case Updates.UpdateType.insertNode:
                    const nod1 = document.createElement('span')
                    nod1.innerText = u.text
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
                    nod3.innerText = u.text
                    break
                case Updates.UpdateType.replaceClass:
                    const nod4 = elements.get(u.key)!
                    nod4.setAttribute('class', u.class)
                    break
            }
        }
        this.updateQueue = []
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


    static checkNodeDiff(prev: TextNode, next: TextNode, updates: Updates.UpdateQueue): boolean {
        let hasDiff = false
        if (prev.text !== next.text) {
            hasDiff = true
            updates.push({
                type: Updates.UpdateType.replaceText,
                text: next.text,
                key: next.id
            })
        }
        if (prev.highlighted !== next.highlighted || prev.isInspection !== next.isInspection) {
            hasDiff = true            
            updates.push({
                type: Updates.UpdateType.replaceClass,
                class: getClass(next),
                key: next.id
            })

        }
        return hasDiff
    }

}