import { ServerSession } from './api'
import { Textoverlay } from './overlay';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import { Atom } from '@grammarly/focal';
import {StateModel, Node} from './models';
import {TextareaView} from './view';

interface MyEvent extends Event {
    data: string
    target: HTMLTextAreaElement
}

export class TextAreaWrapper {
    server: ServerSession
    viewModel: StateModel

    constructor(readonly node: HTMLTextAreaElement) {
        // this.node.onchange = this.onChange
        this.server = new ServerSession()

        const overlay = new Textoverlay(node, this.onChange)
        this.viewModel = new StateModel()
        ReactDOM.render(
            <TextareaView state={this.viewModel.state}/>,
            overlay.getContainer()
        )
    }


    onChange = (e_: Event) => {
        const e = e_ as MyEvent;
        const target = e.target as HTMLTextAreaElement;
        const range = [target.selectionStart, target.selectionEnd]
        this.viewModel.state.lens('nodes').modify(nodes => {
            const newNode = new Node(e.data, 2)
            return nodes.concat([newNode])
        })
        console.log(e)
    }
}

