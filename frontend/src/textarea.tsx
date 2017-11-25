import { ServerSession } from './api'
import { Textoverlay } from './overlay';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import { Atom } from '@grammarly/focal';
import { StateModel, Inspection } from './models';
import { TextareaView } from './view';
import {getDiff, validateDiff} from './utils'

interface MyEvent extends Event {
    key: string
    target: HTMLTextAreaElement
}

export class TextAreaWrapper {
    server: ServerSession
    viewModel: StateModel
    oldTextareaText: string
    constructor(readonly node: HTMLTextAreaElement) {
        // this.node.onchange = this.onChange
        this.server = new ServerSession()

        const overlay = new Textoverlay(node, { onInput: this.onInput})
        this.viewModel = new StateModel()
        ReactDOM.render(
            <TextareaView state={this.viewModel.state} />,
            overlay.getContainer()
        )
        this.oldTextareaText = node.value        
    }


    onInput = (e: KeyboardEvent) => {
        const newText = (e.target as HTMLTextAreaElement).value;
        const diff = getDiff(this.oldTextareaText, newText)
        validateDiff(this.oldTextareaText, newText, diff)
        this.oldTextareaText = newText
    }
}

