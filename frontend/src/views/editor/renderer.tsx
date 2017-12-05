// {
import { NodesForView, TextNode, State as ModelState } from '../../models'
import { Observable } from 'rxjs'

type NodeElement = HTMLSpanElement | Text

export namespace Updates {

    export enum UpdateType {
        removeNode,
        insertNode,
        replaceText,
        replaceAttribute
    }


    interface InsertUpdate {
        type: UpdateType.insertNode
        afterKey: string | undefined // undefined for first
        text: string
        key: string
        nodeType: 'span' | 'text'
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
    interface ReplaceAttribute {
        type: UpdateType.replaceAttribute,
        key: string
        attr: string
        value?: string
    }


    export type Update = InsertUpdate | RemoveUpdate | ReplaceTextUpdate | ReplaceAttribute

    export type UpdateQueue = Update[]

}

class State {
    elements = new Map<string, HTMLSpanElement | Text>()
}

function getClass(nod: TextNode) {
    if (nod.highlighted) {
        return 'highlighted'
    }
    return undefined
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

            inspections.textNodes(text, cursorPosition, (node) => {


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
                if (cache.delete(`${i}#`)) {
                    updates.push({
                        type: Updates.UpdateType.removeNode,
                        key: `${i}#`
                    })
                }
            }


            return [cache, updates]
        }, [new Map<string, TextNode>(), []]).subscribe(([_, updates]) => {
            this.updateQueue = updates
            this.commitToDOM()
        })
    }

    commitToDOM() {
        const elements = this.state.elements;
        const { container } = this;

        let prevKey = undefined
        let nod = undefined as any as HTMLSpanElement | Text

        console.log(this.updateQueue.length)
        for (const u of this.updateQueue) {
            if (prevKey !== u.key) {
                nod = elements.get(u.key)!
            }
            switch (u.type) {
                case Updates.UpdateType.insertNode:
                    if (u.nodeType === 'span') {
                        nod = document.createElement('span')
                        nod.innerText = u.text
                    } else {
                        nod = document.createTextNode(u.text)
                    }
                    elements.set(u.key, nod)
                    let insertBefore
                    if (u.afterKey !== undefined) {
                        insertBefore = elements.get(u.afterKey)!.nextSibling
                    } else {
                        insertBefore = container.firstChild;
                    }
                    container.insertBefore(nod, insertBefore)
                    break
                case Updates.UpdateType.removeNode:
                    nod.remove()
                    elements.delete(u.key)
                    break
                case Updates.UpdateType.replaceText:
                    const nod3 = elements.get(u.key)!
                    switch (nod3.nodeType) {
                        case 3:
                            (nod3 as Text).data = u.text;
                            break
                        case 1:
                            (nod3 as HTMLSpanElement).innerText = u.text;
                            break
                    }
                    break
                case Updates.UpdateType.replaceAttribute:
                    let n = nod as HTMLSpanElement;
                    if (u.value === undefined) {
                        n.removeAttribute(u.attr)
                    } else {
                        n.setAttribute(u.attr, u.value);
                    }
                    break
            }
        }
        this.updateQueue = []
    }

    static insertNew(next: TextNode, lastKey: string | undefined, updates: Updates.UpdateQueue) {
        updates.push({
            type: Updates.UpdateType.insertNode,
            nodeType: next.isInspection ? 'span' : 'text',
            text: next.text,
            afterKey: lastKey,
            key: next.id,
        })
        const className = getClass(next)
        if (next.isInspection && className !== undefined) {
            updates.push({
                type: Updates.UpdateType.replaceAttribute,
                attr: 'class',
                value: className,
                key: next.id
            })
        }
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
        if (prev.highlighted !== next.highlighted || prev.isInspection !== next.isInspection) { //todo changing status should change node type
            hasDiff = true
            updates.push({
                type: Updates.UpdateType.replaceAttribute,
                attr: 'class',
                value: getClass(next),
                key: next.id
            })

        }
        return hasDiff
    }

}