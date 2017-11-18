import * as React from 'react';
import { Atom, reactiveList, ReadOnlyAtom, F, Lens } from '@grammarly/focal';
import { State, Node } from './models';



const NodeView = ({ node }: { node: Atom<Node> }) => {

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
        return null
        //@ts-ignore        
        return <F.span>
            {           
                //@ts-ignore
                reactiveList(nodes.view(x=>x.map((_, ind) => ind)), 
                //@ts-ignore
                ind  => <NodeView key={ind} node={nodes.lens(Lens.index(ind) as any)} />)
            }
        </F.span>
    }
}

// {