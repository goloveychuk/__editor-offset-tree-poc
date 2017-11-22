import registerServiceWorker from './registerServiceWorker';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TextAreaWrapper } from './textarea'
import './index.css';


import { tree } from './test'





ReactDOM.render(<div>
  <textarea cols={100} rows={20}></textarea>
  <div id="tree_container"></div>
</div>,
  document.getElementById('root') as HTMLElement
);



function registerTextArea(t: HTMLTextAreaElement) {
  textareas.push(new TextAreaWrapper(t))
}

let textareas: TextAreaWrapper[] = []



registerTextArea(document.getElementsByTagName('textarea').item(0))


registerServiceWorker();
