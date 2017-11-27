import * as React from 'react';
import {TextAreaWrapper} from './editor/textarea'





export class RootView extends React.Component {
    textAreaRef: HTMLTextAreaElement | null
    componentDidMount() {
        new TextAreaWrapper(this.textAreaRef!)
    }

    render() {
        return <div >

            <textarea placeholder="type text" ref={(ref) => {this.textAreaRef=ref}}></textarea>

        </div>
    }
}