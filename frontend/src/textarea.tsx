import { ServerSession } from './api'
import { Textoverlay } from './overlay';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import { Atom } from '@grammarly/focal';
import { StateModel, Inspection } from './models';
import { TextareaView } from './view';
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

        const overlay = new Textoverlay(node, { onKeyPress: this.onKeyPress, onKeyDown: this.onKeyDown })
        this.viewModel = new StateModel()
        ReactDOM.render(
            <TextareaView state={this.viewModel.state} />,
            overlay.getContainer()
        )
        ReactDOM.render(
            <TreeRenderer tree={this.viewModel.state.lens('tree')} />,
            document.getElementById('tree_container') as HTMLElement
        )

    }


    onKeyPress = (e: KeyboardEvent) => {
        const target = e.target as HTMLTextAreaElement;
        let text = e.key;
        if (e.code === 'Enter') {
            text = '\n'
        }
        this.viewModel.setText(target.selectionStart, target.selectionEnd, text)
    }
    onKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLTextAreaElement;
        let start = target.selectionStart
        let end = target.selectionEnd

        if (e.code === 'Backspace') {
            if (e.metaKey) {
                start = 0
            } else if (start === end) {
                start -= 1
            }
            if (start < 0) {
                return
            }
            this.viewModel.setText(start, end, "")
        } else if (e.code === 'Delete') {
            if (start === end) {
                end +=1 
            }
            this.viewModel.setText(start, end, "")
        } else if (e.code === 'Enter' && e.metaKey) {
            this.viewModel.addInspection(start, end, new Inspection())
        }
    }
}

