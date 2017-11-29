import * as React from 'react';
import { Atom, ReadOnlyAtom, lift, F, Lens } from '@grammarly/focal';
import { State, TextNode, StateModel, NodesForView } from '../../models';
import * as ClassNames from 'classnames';
import { Observable, ObservableInput } from 'rxjs/Observable'
import { Subscription as RxSubscription } from 'rxjs/Subscription'

import { Renderer } from './renderer'



interface Props {
    state: StateModel
}


export class TextareaView extends React.Component<Props> {
    container: HTMLSpanElement | null
    _sub: RxSubscription | undefined
    componentWillUnmount() {
        if (this._sub !== undefined) {
            this._sub.unsubscribe()
        }
    }
    componentDidMount() {
        const container = this.container!;

        const renderer = new Renderer(container)

        const nodes = this.props.state.getNodes()

        this._sub = nodes.scan((prevNodes: NodesForView, newNodes: NodesForView) => {
            renderer.compare(prevNodes, newNodes)
            renderer.commitToDOM()
            return newNodes
        }).subscribe(() => {

        })
    }

    render() {
        return <span ref={(ref) => { this.container = ref }} />
    }
}

