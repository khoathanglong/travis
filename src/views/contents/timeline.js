const observations = [];
// visual parameters
const x1 = 0;
const x2 = 0;
const y = 0;
const lineStroke = 'lightgray';
const textStroke = 'none';
const textFill = '#303030'; // darker gray
const fontFamily = 'Helvetica';
const fontSize = 12;


// circle variables
const r = 7;
const circleFill = 'grey';
const circleStroke = 'none';
const circleStrokeWidth = 1;
// const lineStroke = 'grey';
const lineStrokeWidth = 3;
// selection: d3 selection

// graph params
const margin = {
  top: 10, right: 30, bottom: 30, left: 60,
};
const width = window.innerWidth - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

export function drawAxis(container) {
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform',
      `translate(${margin.left},${margin.top})`);
}

export function drawLabel(selection, label) {
  return selection
    .transition()
    .duration(500)
    .text(label)
    .attr('x', x1 - 10)
    .attr('y', y)
    .attr('dy', fontSize / 2)
    .attr('stroke', textStroke)
    .attr('fill', textFill)
    .attr('font-size', fontSize)
    .attr('font-family', fontFamily)
    .style('text-anchor', 'end');
}

export function drawCircle(selection) {
  return selection
    .transition()
    .duration(500)
    .attr('cx', x1)
    .attr('cy', y)
    .attr('r', r)
    .attr('fill', circleFill)
    .attr('stroke', circleStroke);
}

export function drawLine(selection) {
  return selection
    .transition()
    .duration(500)
    .attr('x1', x1)
    .attr('y1', y)
    .attr('x2', x2)
    .attr('y2', y)
    .attr('stroke', lineStroke)
    .attr('stroke-width', lineStrokeWidth);
}
export default {
  drawLabel,
  drawLine,
  drawCircle,
};
