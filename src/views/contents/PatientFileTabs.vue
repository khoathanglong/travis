/* eslint-disable func-names */
<template>
  <div
    id="timelineChart"
  />
</template>

<script>
import _ from 'lodash';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
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
      maxDay: myData.observationPeriods[0].x2,
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
      return [tData[4], tData[24]];
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
    drawCircle() {
      const self = this;
      // call tooltip instance
      this.svg.call(this.d3Tip);
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
          .on('mouseover', this.d3Tip.show)
          .on('mouseout', this.d3Tip.hide);
      });
      // draw tooptip
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
    createTootipInstance() {
      this.d3Tip = d3Tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html((d) => {
          console.log(d);
          return '<strong>Frequency:</strong> <span style=\'color:red\'>asdasd</span>';
        });
    },
  },
  mounted() {
    this.createTootipInstance();
    this.drawAxis();
    this.drawCircle();
    this.drawLine();
    this.drawLabel();
  },
};
</script>

<style>
.d3-tip {
  line-height: 1;
  font-weight: bold;
  padding: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: green;
  border-radius: 2px;
}

</style>
