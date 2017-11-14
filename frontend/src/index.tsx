import registerServiceWorker from './registerServiceWorker';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {TextAreaWrapper} from './textarea'










ReactDOM.render(<div>
  <textarea cols={300} rows={100}></textarea>
</div>,
  document.getElementById('root') as HTMLElement
);



function registerTextArea(t: HTMLTextAreaElement) {
  textareas.push(new TextAreaWrapper(t))
}

let textareas: TextAreaWrapper[] = []



registerTextArea(document.getElementsByTagName('textarea').item(0))


registerServiceWorker();
