import * as React from 'react';
import { StateModel, Inspection } from '../models';
import {reactiveList, ReadOnlyAtom, F} from '@grammarly/focal'


interface CardProps {
    inspection: ReadOnlyAtom<Inspection>
}

class Card extends React.Component<CardProps> {
    render() { 
        const {inspection} = this.props;

        return <F.div>
            {inspection.view('id')}
        </F.div>
    }
}

interface Props {
    viewModel: StateModel
}


export class InspectionsBar extends React.Component<Props> {

    render() {
        const {viewModel} = this.props;
        const inspections = viewModel.state.view(st => st.inspections)
        return <F.div>
            {reactiveList(
                inspections.map(ins => ins.map(i => i.id)),
                (id) => {
                    return <Card inspection={inspections.view(ins => ins.getById(id)!)} />
                }
            )}
        </F.div>
    }   
}