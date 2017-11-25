import * as React from 'react';
import { Atom, reactiveList, ReadOnlyAtom, F, Lens } from '@grammarly/focal';
import { State, TextNode } from './models';
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
    state: Atom<State>
}



export class TextareaView extends React.Component<Props> {
    render() {
        const state = this.props.state;
        const nodes = state.view(st => ({
            inspections: st.inspections,
            text: st.text,
            cursorPosition: st.cursorPosition,
        })).view(({ inspections, text, cursorPosition }) => {
            let res: TextNode[] = []
            let ins = inspections[0]
            const highlighted = cursorPosition >= ins.start && cursorPosition <= ins.end
            res.push(new TextNode(text.substring(0, ins.start)))
            res.push(new TextNode(text.substring(ins.start, ins.end), ins, highlighted))
            res.push(new TextNode(text.substring(ins.end)))
            return res
        })
        console.log('rerender root')
        return <F.span>
            {
                reactiveList(nodes.view(x => x.map((_, ind) => ind)),
                    ind => <NodeView key={ind} node={nodes.view(Lens.index(ind) as any)} />)
            }
        </F.span>
    }
}

// {