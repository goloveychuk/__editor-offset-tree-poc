import { Api, Request, Response } from '../../api'
import { Textoverlay } from './overlay';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import { Atom } from '@grammarly/focal';
import { StateModel, Inspection } from '../../models';
import { TextareaView } from './view';
import { InputKeyboardEvent } from '../../utils'
import * as Lodash from 'lodash';

export class TextAreaWrapper {
    api: Api
    viewModel: StateModel
    processApiMessages: ()=>void

    apiQueue: Response.Response[] = []

    constructor(readonly node: HTMLTextAreaElement) {
        // this.node.onchange = this.onChange
        this.api = new Api(this.onApiConnect, this.onApiMsg)
        this.api.connect()
        const overlay = new Textoverlay(node, { onInput: this.onInput, onCursorPosChange: this.onCurPosChange })

        this.viewModel = new StateModel({ text: node.value })

        ReactDOM.render(
            <TextareaView state={this.viewModel} />,
            overlay.getContainer()
        )
        this.processApiMessages = Lodash.throttle(this._processApiMessages, 500)

    }
    _processApiMessages = () => {
        this.viewModel.modifyInspections((proxy) => {
            for (const resp of this.apiQueue) {
                switch (resp.type) {
                    case Response.Type.AddInspection:
                        proxy.add(resp)
                        break;
                    case Response.Type.RemoveInspection:
                        proxy.remove(resp.id)
                        break;
                    case Response.Type.Ok:
                        this.viewModel.revisionsData.removeDiffs(resp.rev)
                        break;
                }
            }
            this.apiQueue = []
            return proxy
        })
    }
    onApiMsg = (resp: Response.Response) => {
        console.log(resp)
        this.apiQueue.push(resp)
        this.processApiMessages()
    }

    onApiConnect = () => { //todo sync
        this.viewModel.reset()
        this.apiQueue = []
        const text = this.viewModel.state.lens('text').get();
        const req: Request.ModifydReq = { start: 0, end: 0, text: text, type: Request.Type.Modify, rev: 0 }
        this.api.send(req)
    }

    onInput = (event: InputKeyboardEvent, cursorPos: number) => {
        const newText = event.target.value;
        const position = event.target.selectionStart;
        const { diff } = this.viewModel.setText(newText, cursorPos, { event, position })
        if (diff === null) {
            return
        }
        const req: Request.ModifydReq = { start: diff.start, end: diff.end, text: diff.text, type: Request.Type.Modify, rev: diff.rev }
        this.api.send(req)

    }

    onCurPosChange = (newPos: number) => {
        this.viewModel.setCurPos(newPos)
    }
}

