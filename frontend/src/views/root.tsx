import * as React from 'react';
import {TextAreaWrapper} from './editor/textarea'





export class RootView extends React.Component {
    textAreaRef: HTMLTextAreaElement | null
    componentDidMount() {
        new TextAreaWrapper(this.textAreaRef!)
    }

    render() {
        return <div >

            <textarea ref={(ref) => {this.textAreaRef=ref}} cols={100} rows={20}></textarea>

        </div>
    }
}