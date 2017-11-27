import * as React from 'react';
import { Atom, ReadOnlyAtom, lift, F, Lens } from '@grammarly/focal';
import { Observable, ObservableInput } from 'rxjs/Observable'
import { Subscription as RxSubscription } from 'rxjs/Subscription'

interface El {
    text: string
}

class Node extends React.Component<{ el: ReadOnlyAtom<El> }> {
    render() {

        return <F.span>
            {this.props.el.view(el => (el !== undefined) && el.text)}
        </F.span>

    }
}

export class TestView extends React.Component {
    model: Atom<El[]>
    constructor(props: {}) {
        super(props)
        this.model = Atom.create<El[]>([
            { 'text': '1' },
            { 'text': '2' },
            { 'text': '3' },
        ])
        setTimeout(() => {
            this.model.modify(m => {
                return m.concat([{
                    text: '4'
                }])
            })
        }, 2000)
        setTimeout(() => {
            this.model.modify(m => {
                return m.filter(e => e.text !== '2')
            })
        }, 4000)
    }
    render() {
        return <F.span>
            {
                reactiveList(
                    this.model.view(x => x.map((_, ind) => ind)),
                    (ind) => {
                        const el = this.model.view((m) => m[ind])
                        return <Node el={el} />
                    }
                )
            }
        </F.span>
    }
}



export function reactiveList<TValue>(
    ids: Observable<string[]>, createListItem: (x: string) => TValue
): Observable<TValue[]>

export function reactiveList<TValue>(
    ids: Observable<number[]>, createListItem: (x: number) => TValue
): Observable<TValue[]>

export function reactiveList<TValue>(
    ids: Observable<string[]> | Observable<number[]>,
    createListItem: ((x: string) => TValue) | ((x: number) => TValue)
): Observable<TValue[]> {
    return ids.scan(
        ([oldIds, _]: [any, TValue[]], ids: string[] | number[]) => {
            // @NOTE actual type of oldIds and newIds is either { [k: string]: TValue }
            // or { [k: number]: TValue }, but the type system doesn't allow us to
            // express this.
            const newIds: any = {}
            const newValues: TValue[] = Array(ids.length)
            const n = ids.length

            for (let i = 0; i < n; ++i) {
                const id = ids[i]
                const k = id.toString()
                if (k in newIds) {
                    newValues[i] = newIds[k]
                } else {
                    newIds[k] = newValues[i] =
                        k in oldIds
                            ? oldIds[k]
                            : (createListItem as (_: string | number) => TValue)(id)
                }
            }
            return [newIds, newValues] as [any, TValue[]]
        },
        [{}, []])
        .map(([_, values]) => values)
}