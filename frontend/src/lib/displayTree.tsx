import * as d3 from 'd3';
import * as React from 'react';
import { Tree, Nodee } from './tree'


interface Data {
    data: any
    offset: number
}

// set the dimensions and margins of the diagram
var margin = { top: 40, right: 90, bottom: 50, left: 90 },
    width = 660 - margin.left - margin.right,
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
        .attr("r", 10);

    // adds the text to the node
    node.append("text")
        .attr("dy", ".35em")
        .attr("y", function (d) { return d.children ? -20 : 20; })
        .style("text-anchor", "middle")
        .text(function (d) { 
            const data = d.data;
            return `${data.data} (${data.offset})`
        });


}



interface Props {
    tree: Tree<any>
}

export class TreeRenderer extends React.Component<Props> {
    componentDidMount() {

        const root = this.props.tree.root;
        if (root !== undefined) {
            renderTree("#tree-container", root)
        }
    }
    render() {
        return <div id='tree-container' />
    }
}