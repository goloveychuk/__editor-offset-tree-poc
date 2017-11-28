import * as React from 'react';
import { Atom, ReadOnlyAtom, lift, F, Lens } from '@grammarly/focal';
import { State, TextNode, StateModel, NodesForView } from '../../models';
import * as ClassNames from 'classnames';
import { Observable, ObservableInput } from 'rxjs/Observable'
import { Subscription as RxSubscription } from 'rxjs/Subscription'


const NodeView = ({ node }: { node: ReadOnlyAtom<TextNode> }) => {

    console.log('rerenderred node')
    const clsname = node.view(n => {
        if (n === undefined) {  //todo maybe modify renderList to unmount components
            return ''
        }
        return ClassNames('inspection', {
            'selected': n.highlighted
        })
    })
    return <F.span className={clsname}>
        {node.view(n => (n !== undefined) && n.text)}
    </F.span>
}



interface Props {
    state: StateModel
}



export function reactiveList(nodesObs: ReadOnlyAtom<NodesForView>): Observable<React.ReactNode[]> {
    return nodesObs.scan(
        ([oldCache, _], nodes: NodesForView) => {

            const newCache: any = {}
            const newValues: React.ReactNode[] = nodes.map((n, ind) => {
                if (typeof n === 'string') {
                    return n
                }
                let comp;
                if (n.id in oldCache) {
                    comp = oldCache[n.id]
                } else {
                    const node = nodesObs.view(nod => nod.get(n.id))
                    comp = <NodeView key={n.id} node={node as ReadOnlyAtom<TextNode>} />
                }
                newCache[n.id] = comp
                return comp
            })
            
            return [newCache, newValues]
        },
        [{}, []])
        .map(([_, values]) => values)
}


export class TextareaView extends React.Component<Props> {
    render() {
        const nodes = this.props.state.getNodes()

        console.log('rerender root')
        return <F.span>
            {
                reactiveList(nodes)
            }
        </F.span>
    }
}

// {