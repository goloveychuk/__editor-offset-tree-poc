import { Api, Request, Response } from './api'
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
    api: Api
    viewModel: StateModel

    constructor(readonly node: HTMLTextAreaElement) {
        // this.node.onchange = this.onChange
        this.api = new Api(this.onApiConnect, this.onApiMsg)
        this.api.connect()
        const overlay = new Textoverlay(node, { onInput: this.onInput, onCursorPosChange: this.onCurPosChange})

        // node.value = 'inasias asl;dk askld djsa ldsf dlskf adsl;fajs dfl;k '        
        this.viewModel = new StateModel({text: node.value})
        // this.viewModel.addInspection(new Inspection(4, 10))

        
        ReactDOM.render(
            <TextareaView state={this.viewModel} />,
            overlay.getContainer()
        )
        
    }
    onApiMsg = (resp: Response.Response) => {
        console.log(resp)            
        switch (resp.type) {
            case Response.Type.AddInspection:
                this.viewModel.addInspection(resp)     
                break;
            case Response.Type.RemoveInspection:
                this.viewModel.removeInspection(resp.id)     
            

        }
    }

    onApiConnect = () => { //todo sync
        const text = this.viewModel.state.lens('text').get();
        const req: Request.ModifydReq = {start: 0, end: 0, text: text, type: Request.Type.Modify}
        this.api.send(req)        
    }

    onInput = (e: KeyboardEvent & {target: HTMLTextAreaElement}) => {
        const newText = e.target.value;
        // console.log(e, e.target.selectionStart, e.target.selectionEnd)
        const {diff} = this.viewModel.setText(newText)
        if (diff === null) {
            return
        }
        const req: Request.ModifydReq = {start: diff.start, end: diff.end, text: diff.text, type: Request.Type.Modify}
        this.api.send(req)
    
    }

    onCurPosChange = (newPos: number) => {
        this.viewModel.setCurPos(newPos)
    }
}

