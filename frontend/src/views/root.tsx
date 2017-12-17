import {InspectionsBar} from './inspectionsBar'
import { Api, Request, Response } from '../api'
import { Textoverlay } from './editor/overlay';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import { Atom } from '@grammarly/focal';
import { StateModel, Inspection } from '../models';
import { TextareaView } from './editor/view';
import { InputKeyboardEvent } from '../utils'


interface TextareaEditorProps {
    viewModel: StateModel
    onInput(event: InputKeyboardEvent, cursorPos: number):void 
    onCurPosChange(newPos: number): void
}

class TextareaEditor extends React.Component<TextareaEditorProps> {
    textAreaRef: HTMLTextAreaElement | null
    componentDidMount() {
        const overlay = new Textoverlay(this.textAreaRef!, { onInput: this.props.onInput, onCursorPosChange: this.props.onCurPosChange })
        ReactDOM.render(
            <TextareaView state={this.props.viewModel} />,
            overlay.getContainer()
        )
        // this.props.onInput()
        // text: node.value  //todo
    }
    
    render() {
        return <textarea placeholder="type text" ref={(ref) => {this.textAreaRef=ref}}></textarea>
    }
}


interface State {
    viewModel: StateModel
}

export class RootView extends React.Component<{}, State> {
    api: Api

    constructor(props: {}) {
        // this.node.onchange = this.onChange
        super(props)
        this.api = new Api()

        this.api.messagesStream.bufferTime(500).subscribe(this.processApiMessages)
        this.api.connectionStream.subscribe(this.onApiConnectionChange)

        this.api.connect()

        this.state = {
            viewModel: new StateModel({text: ''})
        }

        

    }
    processApiMessages = (responses: Response.Response[]) => {
        if (responses.length === 0) {
            return
        }
        this.state.viewModel.modifyInspections((proxy) => {
            for (const resp of responses) {
                console.log(resp)
                switch (resp.type) {
                    case Response.Type.AddInspection:
                        proxy.add(resp)
                        break;
                    case Response.Type.RemoveInspection:
                        proxy.remove(resp.id)
                        break;
                    case Response.Type.Ok:
                        this.state.viewModel.revisionsData.removeDiffs(resp.rev)
                        break;
                }
            }
            return proxy
        })
    }

    onApiConnectionChange = (connected: boolean) => {
        if (connected === true) {
            this.state.viewModel.reset()
            const text = this.state.viewModel.state.lens('text').get();
            const req: Request.ModifydReq = { start: 0, end: 0, text: text, type: Request.Type.Modify, rev: 0 }
            this.api.send(req)
        }
    }

    onInput = (event: InputKeyboardEvent, cursorPos: number) => {
        const newText = event.target.value;
        const position = event.target.selectionStart;
        const { diff } = this.state.viewModel.setText(newText, cursorPos, { event, position })
        if (diff === null) {
            return
        }
        const req: Request.ModifydReq = { start: diff.start, end: diff.end, text: diff.text, type: Request.Type.Modify, rev: diff.rev }
        this.api.send(req)

    }

    onCurPosChange = (newPos: number) => {
        this.state.viewModel.setCurPos(newPos)
    }



    render() {
        const {viewModel} = this.state
        return <div className='appContainer'>
            <TextareaEditor viewModel={viewModel} onInput={this.onInput} onCurPosChange={this.onCurPosChange}/>
            <InspectionsBar viewModel={viewModel}/>
        </div>
    }
}