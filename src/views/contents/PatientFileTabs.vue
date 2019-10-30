/* eslint-disable func-names */
<template>
  <div
    id="timelineChart"
  />
</template>

<script>
import _ from 'lodash';
import * as d3 from 'd3';
import myData from './data.json';

// const height = 400 - margin.top - margin.bottom;
/* eslint-disable func-names */

const lineStroke = 'grey';
const lineStrokeWidth = 3;
const textStroke = 'none';
const textFill = '#303030'; // darker gray
const fontFamily = 'Helvetica';
const fontSize = 12;
export default {
  data() {
    return {
      records: myData.records,
      minDay: myData.observationPeriods[0].x1,
      // maxDay: myData.observationPeriods[0].x2,
      svg: null,
      xScale: null,
      yScale: null,
      margin: {
        top: 200, right: 60, bottom: 30, left: 200,
      },
      ySpace: 20, // each label 's distance
      r: 5,
      lineStroke,
      lineStrokeWidth,
      fontSize,
      fontFamily,
      d3Tip: null,
    };
  },
  computed: {
    convertedData() {
      const tData = _.transform(this.records, (accumulator, item, index, originalArr) => {
        const { domain } = item;
        const { conceptId } = item;
        const { conceptName } = item;
        const { startDay } = item;
        const { endDay } = item;

        const observationData = {
          startMoment: startDay,
          endMoment: endDay,
          conceptId,
          conceptName,
        };

        const timeLineDomain = {
          label: domain,
          id: domain,
          observationData: [observationData],
          belongTo: null,
        };

        const timeLine = {
          label: conceptName,
          id: conceptId,
          observationData: [observationData],
          belongTo: domain,
        };


        // push timeline for domain
        const timeLineDomainIndex = accumulator.findIndex(el => el.id === domain);
        if (timeLineDomainIndex > -1) {
          accumulator[timeLineDomainIndex].observationData.push(observationData);
        } else {
          accumulator.push(timeLineDomain);
        }

        // push timeline for concept
        const timeLineIndex = accumulator
          .findIndex(el => el.id === conceptId && el.belongTo === domain);

        if (timeLineIndex > -1) {
          accumulator[timeLineIndex].observationData.push(observationData);
        } else {
          accumulator.push(timeLine);
        }
      }, []);
      // return [{ observationData: [{ startMoment: 10, endMoment: 40, id: 100 }] }];
      // return tData;
      return [tData[4], tData[24], tData[0]];
    },
    drugLike() {
      return this.convertedData.filter(el => el.belongTo === 'drug')
        .map(el => el.observationData).flat();
    },
    drugs() {
      return this.records.filter(el => el.domain === 'drug');
    },
    height() {
      return this.convertedData.length * this.ySpace;
    },
    width() {
      return window.innerWidth - this.margin.left - this.margin.right;
    },
    maxDay() {
      return d3.max(this.convertedData.map(el => el.observationData).flat().map(el => el.endMoment));
    },
  },
  methods: {
    drawAxis() {
      this.svg = d3.select('#timelineChart')
        .append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .append('g')
        .attr('transform',
          `translate(${this.margin.left},${this.margin.top})`);

      this.xScale = d3.scaleLinear()
        .domain([this.minDay, this.maxDay])
        .range([0, this.width]);

      this.yScale = d3.scaleLinear()
        .domain(0, this.convertedData.length)
        .range([0, this.height]);

      this.svg.append('g')
        .attr('transform', `translate(0,${this.height})`)
        .call(d3.axisBottom(this.xScale));

      this.svg.append('g')
        .call(d3.axisLeft(this.yScale));
    },
    tooltipContent(data, dataPoint) {
      const tooltipContentList = [];
      data
        .filter(point => point.startMoment == dataPoint.startMoment)
        .forEach((point) => {
          const pointIndex = tooltipContentList
            .findIndex(p => p.startMoment == point.startMoment
            && p.endMoment == point.endMoment);
          if (pointIndex > -1) {
            tooltipContentList[pointIndex].frequency += 1;
          } else {
            tooltipContentList.push({ ...point, frequency: 1 });
          }
        });
      let tooltipContent = '';
      tooltipContentList.forEach((content) => {
        const startEndDifferent = content.startMoment != content.endMoment;
        tooltipContent
           += `<div style="margin-bottom:5px">
              <strong>${content.conceptName} </strong> <br />
              <span>Start day: ${content.startMoment} ${startEndDifferent ? `- End day: ${content.endMoment}` : ''}</span>, 
              <span>Frequency: ${content.frequency} </span>
            </div>`;
      });
      return tooltipContent;
    },
    drawCircle() {
      const self = this;
      // call tooltip instance
      // const tooltip = this.d3Tip//;
      // this.svg.call(tooltip);
      const tooltipDiv = d3.select('#timelineChart').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      this.convertedData.forEach((timeLine, index) => {
        this.svg
          .append('g')
          .selectAll('circle')
          .data(timeLine.observationData)
          .enter()
          .append('circle')
          .attr('cx', d => self.xScale(d.startMoment))
          .attr('cy', self.height - (index + 1) * self.ySpace)
          .attr('r', self.r)
          .attr('width', 100)
          .attr('height', 100)
          .on('mouseover', (d) => {
            const tooltipContent = self.tooltipContent(timeLine.observationData, d);
            tooltipDiv
              .transition()
              .duration(100)
              .style('opacity', 1);

            tooltipDiv.html(tooltipContent);

            const tooltipSize = tooltipDiv.node().getBoundingClientRect();
            tooltipDiv
              .style('left', `${d3.event.pageX - tooltipSize.width / 2}px`)
              .style('top', `${d3.event.pageY - tooltipSize.height}px`);
          })
          .on('mouseout', () => {
            tooltipDiv.transition()
              .duration(0)
              .style('opacity', 0);
          });
      });
    },
    drawLine() {
      const self = this;
      this.convertedData.forEach((timeLine, index) => {
        const obData = timeLine.observationData.filter(el => el.endMoment !== el.startMoment);
        this.svg
          .append('g')
          .selectAll('line')
          .data(obData)
          .enter()
          .append('line')
          .attr('x1', d => self.xScale(d.startMoment))
          .attr('y1', self.height - (index + 1) * self.ySpace)
          .attr('x2', d => self.xScale(d.endMoment))
          .attr('y2', self.height - (index + 1) * self.ySpace)
          .attr('stroke', lineStroke)
          .attr('stroke-width', lineStrokeWidth)
          .style('fill', 'green');
      });
    },
    drawLabel() {
      const self = this;
      this.svg
        .append('g')
        .selectAll('text')
        .data(this.convertedData)
        .enter()
        .append('text')
        .text(d => d.label)
        .attr('x', -10)
        .attr('y', (d, index) => self.height - (index + 1) * self.ySpace)
        .attr('dy', this.fontSize / 3)
        .attr('font-size', this.fontSize)
        .attr('font-family', this.fontFamily)
        .style('text-anchor', 'end');
    },
  },
  mounted() {
    this.drawAxis();
    this.drawLine();
    this.drawCircle();
    this.drawLabel();
  },
};
</script>

<style>
div.tooltip {
    position: absolute;
    text-align: left;
    width: auto;
    height: auto;
    padding: 4px;
    font-size: 12px;
    background: black;
    border: 0px;
    border-radius: 8px;
    pointer-events: none;
    color: white
}

</style>
