import { ServerSession } from './api'
import { Textoverlay } from './overlay';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import { Atom } from '@grammarly/focal';
import {StateModel} from './models';
import {TextareaView} from './view';
import { TreeRenderer } from './lib/displayTree'

interface MyEvent extends Event {
    key: string
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
        ReactDOM.render(
            <TreeRenderer tree={this.viewModel.state.lens('tree')}/>,
            document.getElementById('tree_container') as HTMLElement
        )
        
    }


    onChange = (e_: Event) => {
        const e = e_ as MyEvent;
        const target = e.target as HTMLTextAreaElement;
        const range = [target.selectionStart, target.selectionEnd]
        this.viewModel.setText(target.selectionStart, target.selectionEnd, e.key)
        console.log(e)
    }
}

