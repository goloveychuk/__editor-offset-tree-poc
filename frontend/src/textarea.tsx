import { ServerSession } from './api'
import { Textoverlay } from './overlay';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import { Atom } from '@grammarly/focal';
import { StateModel, Inspection } from './models';
import { TextareaView } from './view';

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

        const overlay = new Textoverlay(node, { onInput: this.onInput, onCursorPosChange: this.onCurPosChange})

        node.value = 'inasias asl;dk askld djsa ldsf dlskf adsl;fajs dfl;k '        
        this.viewModel = new StateModel({text: node.value})
        this.viewModel.addInspection(new Inspection(4, 10))

        
        ReactDOM.render(
            <TextareaView state={this.viewModel.state} />,
            overlay.getContainer()
        )
        
    }


    onInput = (e: KeyboardEvent) => {
        const newText = (e.target as HTMLTextAreaElement).value;
        this.viewModel.setText(newText)
    }

    onCurPosChange = (newPos: number) => {
        this.viewModel.setCurPos(newPos)
    }
}

