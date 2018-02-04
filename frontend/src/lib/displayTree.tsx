import * as d3 from 'd3';
import * as React from 'react';
import { Tree, Nodee } from './tree'
import { TextNodeData } from '../models';
import {Atom, F, lift} from '@grammarly/focal'

interface Data {
    data?: TextNodeData
    offset: number
    _testComputeIndex(): number
}

function formatOffset(offset: number) {
    if (offset <= 0) {
        return offset.toString()
    }
    return `+${offset}`
}

// set the dimensions and margins of the diagram
var margin = { top: 50, right: 10, bottom: 50, left: 90 },
    width = 1560 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


function renderTree(containerSelector: string, treeData: Nodee<any>) {

    var hierarchy = d3.hierarchy<Data>(treeData, ((node: Nodee<any>) => {
        return [node.left, node.right].filter(n => n !== undefined) as any
    }));

    const nodes = d3.tree<Data>()
        .size([width, height])(hierarchy);

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select(containerSelector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom),
        g = svg.append("g")
            .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // adds the links between the nodes
    var link = g.selectAll(".link")
        .data(nodes.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", function (d) {
            //@ts-ignore
            return "M" + d.x + "," + d.y
                //@ts-ignore        
                + "C" + d.x + "," + (d.y + d.parent.y) / 2
                //@ts-ignore
                + " " + d.parent.x + "," + (d.y + d.parent.y) / 2
                //@ts-ignore
                + " " + d.parent.x + "," + d.parent.y;
        });

    // adds each node as a group
    var node = g.selectAll(".node")
        .data(nodes.descendants())
        .enter().append("g")
        .attr("class", function (d) {
            return "node" +
                (d.children ? " node--internal" : " node--leaf");
        })
        .attr("transform", function (d) {
            //@ts-ignore        
            return "translate(" + d.x + "," + d.y + ")";
        });

    // adds the circle to the node
    node.append("circle")
        .attr("r", 50)
        .style("fill", d=>{
            return d.data.data!.isInspection ? 'rgb(251, 222, 222)': null
        })
        

    // adds the text to the node
    node.append("text")
        .attr("dy", ".35em")
        // .attr("y", function (d) { return d.children ? -20 : 20; })
        .attr("y", function (d) { return -10 })
        .style("text-anchor", "middle")
        .text(function (d) {
            const data = d.data;
            return `"${data.data && data.data.text}"  ${formatOffset(data.offset)}`
        })
    node.append('text')
        .style("text-anchor", "middle")
        .attr("y", function (d) { return 10 })
        .text((d) => {
            const data = d.data;
            return `(${data._testComputeIndex()})`
        })


}



interface Props {
    tree: Atom<Tree<TextNodeData>>
}

function makeIndexesText(tree: Tree<TextNodeData>) {
    let res: React.ReactChild[] = []
    let indShould = 0

    for (const node of tree) {
        const ind = node._testComputeIndex()
        let wrong = (ind !== indShould) ? '- Wrong!' : ''
        
        res.push(`(${ind}, ${ind+node.data.text.length}) - "${node.data.text}" ${wrong}`)

        indShould = ind+node.data.text.length
        res.push(<br/>)
    }
    return res
}

function isLeftRightCorrect(tree: Tree<TextNodeData>) {
    const leftRight = Array.from(tree)
    const traverse = Array.from(tree._testTraverse())

    if (leftRight.length !== traverse.length) {
        return false
    }
    for (const i in leftRight) {
        if (leftRight[i] !== traverse[i]){
            return false
        }
    }
    return true
}

export class TreeRenderer extends React.Component<Props> {
    componentDidMount() {
        const {tree} = this.props
        tree.subscribe((tree)=> {    //TODO (move to lift)
            const {root} = tree;
            if (root !== undefined) {
                document.getElementById("tree")!.innerHTML = ""  //TODO
                renderTree("#tree", root)
            }
        })       
    }
    render() {
        const { tree } = this.props;

        return <div className='tree-container'>
            <div className='tree-debug'>
            is balanced: <F.span>{tree.view(tree => String(tree._testIsBalanced(tree.root)))}</F.span>
            is left-right correct: <F.span>{tree.view(tree=>String(isLeftRightCorrect(tree)))}</F.span>
            <br/>
            <F.span>{tree.view(tree=> makeIndexesText(tree))}</F.span>
            </div>
            <div id='tree' />
        </div>
    }
}
