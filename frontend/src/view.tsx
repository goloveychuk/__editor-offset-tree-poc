import * as React from 'react';
import { Atom, reactiveList, ReadOnlyAtom, F, Lens } from '@grammarly/focal';
import { State, TextNode } from './models';



const NodeView = ({ node }: { node: Atom<TextNode> }) => {

    console.log('rerenderred node')

    return <F.span>
        {node.lens('text')}
    </F.span>
}



interface Props {
    state: Atom<State>
}



export class TextareaView extends React.Component<Props> {
    render() {
        const state = this.props.state;
        const nodes = state.lens('nodes')
        console.log('rerender root')    
        return <F.span>
            {           
                reactiveList(nodes.view(x=>x.map((_, ind) => ind)), 
                ind  => <NodeView key={ind} node={nodes.lens(Lens.index(ind) as any)} />)
            }
        </F.span>
    }
}

// {