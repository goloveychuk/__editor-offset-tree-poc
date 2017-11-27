import * as React from 'react';
import { Atom, reactiveList, ReadOnlyAtom, lift, F, Lens } from '@grammarly/focal';
import { State, TextNode, StateModel } from '../../models';
import * as ClassNames from 'classnames';


const NodeView = ({ node }: { node: ReadOnlyAtom<TextNode> }) => {

    console.log('rerenderred node')
    const clsname = node.view(n => {
        return ClassNames({
            'inspection': n.inspection !== undefined,
            'selected': n.highlighted
        })
    })
    return <F.span className={clsname}>
        {node.view('text')}
    </F.span>
}



interface Props {
    state: StateModel
}



export class TextareaView extends React.Component<Props> {
    render() {
        const nodes = this.props.state.getNodes()
        
        console.log('rerender root')
        return <F.span>
            {
                reactiveList(nodes.view(x => x.map((_, ind) => ind)),
                ind => {
                    return <NodeView key={ind} node={nodes.view((n)=>n[ind])} />
                })
            }
        </F.span>
    }
}

// {