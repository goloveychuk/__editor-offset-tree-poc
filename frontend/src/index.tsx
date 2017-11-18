import registerServiceWorker from './registerServiceWorker';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {TextAreaWrapper} from './textarea'
import './index.css';

import {TreeRenderer} from './lib/displayTree'

import {tree} from './test'





ReactDOM.render(<div>
  <textarea cols={100} rows={20}></textarea>
  <TreeRenderer tree={tree}/>
</div>,
  document.getElementById('root') as HTMLElement
);



// function registerTextArea(t: HTMLTextAreaElement) {
//   textareas.push(new TextAreaWrapper(t))
// }

// let textareas: TextAreaWrapper[] = []



// registerTextArea(document.getElementsByTagName('textarea').item(0))


registerServiceWorker();
