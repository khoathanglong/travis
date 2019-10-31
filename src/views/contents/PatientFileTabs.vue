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

export default {
  data() {
    return {
      records: myData.records,
      minDay: myData.observationPeriods[0].x1,
      // maxDay: myData.observationPeriods[0].x2,
      svg: null,
      xScale: null,
      yScale: null,
      xAxis: null,
      margin: {
        top: 200, right: 60, bottom: 30, left: 200,
      },
      ySpace: 20, // each label 's distance
      r: 5,
      lineStroke: 'grey',
      lineStrokeWidth: 3,
      fontSize: 12,
      domainFontSize: 20,
      brush: null,
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
          domain,
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
      // return tData.sort(() => -1);
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
      return d3.max(this.convertedData
        .map(el => el.observationData).flat().map(el => el.endMoment));
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

      this.xAxis = this.svg.append('g')
        .attr('transform', `translate(0,${this.height})`)
        .call(d3.axisBottom(this.xScale));

      this.svg.append('g')
        .call(d3.axisLeft(this.yScale));

      this.svg.append('defs').append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('x', 0)
        .attr('y', 0 - this.r);

      // append tooltip

      d3.select('#timelineChart').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      // on brush event
      this.brush = d3.brushX()
        .extent([[0, 0 - this.r], [this.width, this.height]])
        .on('end', this.handleBrush);
      this.svg.append('g')
        .attr('class', 'brush')
        .call(this.brush);
    },
    idled() { this.idleTimeout = null; },
    handleBrush() {
      const extent = d3.event.selection;
      if (!extent) {
        if (!this.idleTimeout) {
          // This allows to wait a little bit
          this.idleTimeout = setTimeout(this.idled, 350);
          return;
        }
        this.xScale.domain([this.minDay, this.maxDay]);
      } else {
        const extent0 = this.xScale.invert(extent[0]);
        const extent1 = this.xScale.invert(extent[1]);
        this.xScale.domain([extent0, extent1]);
        this.svg.select('.brush').call(this.brush.move, null);
      }
      // update axis
      this.xAxis
        .transition()
        .duration(1000)
        .call(d3.axisBottom(this.xScale));
      // update circles
      this.svg.selectAll('circle')
        .transition().duration(1000)
        .attr('cx', d => this.xScale(d.startMoment));
      // update lines
      this.svg.selectAll('.observationLine')
        .transition().duration(1000)
        .attr('x1', d => this.xScale(d.startMoment))
        .attr('x2', d => this.xScale(d.endMoment));
    },
    tooltipContent(data, dataPoint) {
      const tooltipContentList = [];
      data
        .filter(point => point.startMoment == dataPoint.startMoment)
        .forEach((point) => {
          const pointIndex = tooltipContentList
            .findIndex(p => p.startMoment == point.startMoment
            && p.endMoment == point.endMoment && p.conceptId == point.conceptId);
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
              <strong>${content.conceptId}</strong> <br />
              <span>Start day: ${content.startMoment} ${startEndDifferent ? `- End day: ${content.endMoment}` : ''}</span>, 
              <span>Frequency: ${content.frequency} </span>
            </div>`;
      });
      return tooltipContent;
    },
    showTooltip(timeLine, d) {
      const tooltipContent = this.tooltipContent(timeLine.observationData, d);
      const tooltip = d3.select('.tooltip');
      tooltip
        .transition()
        .duration(100)
        .style('opacity', 1);

      tooltip.html(tooltipContent);

      const tooltipSize = tooltip.node().getBoundingClientRect();
      tooltip
        .style('left', `${d3.event.pageX - tooltipSize.width / 2}px`)
        .style('top', `${d3.event.pageY + 5}px`);
    },
    hideTooltip() {
      const tooltip = d3.select('.tooltip');
      tooltip.transition()
        .duration(0)
        .style('opacity', 0);
    },

    drawCircle() {
      const self = this;
      this.convertedData.forEach((timeLine, index) => {
        const circles = this.svg
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
            // display tooltip
            self.showTooltip(timeLine, d);
          })
          .on('mouseout', () => {
            self.hideTooltip();
          });
        circles.attr('clip-path', 'url(#clip)');
      });
    },
    drawLine() {
      const self = this;
      this.convertedData.forEach((timeLine, index) => {
        const obData = timeLine.observationData.filter(el => el.endMoment !== el.startMoment);
        const lines = this.svg
          .append('g')
          .selectAll('line')
          .data(obData)
          .enter()
          .append('line')
          .attr('class', 'observationLine')
          .attr('x1', d => self.xScale(d.startMoment))
          .attr('y1', self.height - (index + 1) * self.ySpace)
          .attr('x2', d => self.xScale(d.endMoment))
          .attr('y2', self.height - (index + 1) * self.ySpace)
          .attr('stroke', self.lineStroke)
          .attr('stroke-width', self.lineStrokeWidth)
          .style('fill', 'green');
        lines.attr('clip-path', 'url(#clip)');
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
        .attr('class', 'label')
        .text(d => d.label)
        .attr('x', -10)
        .attr('y', (d, index) => self.height - (index + 1) * self.ySpace)
        .attr('dy', this.fontSize / 3)
        .attr('font-size', d => (!d.belongTo ? self.domainFontSize : self.fontSize))
        .attr('font-weight', d => (!d.belongTo ? 'bold' : 'normal'))
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
