const MAX_ANGLE = 2 * Math.PI;
const TIME_STEP = 2.03;       // Estimated time between the function calls (2 seconds wait time delay + needed time for other code execution)
const arc = d3.arc()
  .innerRadius(80)
  .outerRadius(130)
  .startAngle(0);

var remainingTime = -1;
var clusterTime = 0;

function initClusterChart() {
  if(clusterList[0] >= 1) {
    clusterTime = clusterList[0];
    clusterList[0] = 0;
    remainingTime = roundAccurately(clusterTime - ((new Date().getTime() - clusterList[1]) / 1000), 2);            // from preparation.js
  }

  let svg = d3.select('#clustering')
  let width = +svg.attr('width');
  let height = +svg.attr('height');

  let g = svg.append('g')
    .attr('transform', 'translate(' + width / 2 + "," + (height / 2 + 10)  + ')');

  let background = g.append('path')
    .datum({'endAngle': MAX_ANGLE})
    .style('fill', '#ddd')
    .attr('d', arc);

  let foreground = g.append('path')
    .datum({'endAngle': MAX_ANGLE})
    .attr('id', 'foreground')
    .style('fill', 'orange')
    .attr('d', arc);

  svg.append('text')
    .attr('class', 'title')
    .attr('x', width / 2)
    .attr('y', 20)
    .text('Clustering');

  svg.append('text')
    .attr('x', width / 2 - 45)
    .attr('y', height / 2 + 10)
    .text('Clustering for ...');

  svg.append('text')
    .attr('id', 'clusterTime')
    .attr('x', width / 2 - 35)
    .attr('y', height / 2 + 30)
    .text(clusterTime + ' seconds');

  foreground.transition()
    .duration(1)
    .attrTween('d', arcTween(MAX_ANGLE));
}

function updateClusterChart() {
  let foreground = d3.select('#foreground');
  if(clusterList[0] >= 1) {
    clusterTime = clusterList[0];
    clusterList[0] = 0;
    remainingTime = roundAccurately(clusterTime - ((new Date().getTime() - clusterList[1]) / 1000), 2);            // from preparation.js
  } 
  else {
    if(remainingTime > 0) {
      remainingTime = roundAccurately(remainingTime - TIME_STEP, 2);                                              // from preparation.js
    }else {                     // reset case
      remainingTime = -1;
      clusterTime = 0;
      foreground.transition()
        .duration(1)
        .attrTween('d', arcTween(MAX_ANGLE));
      d3.select('#clusterTime')
        .text('0 seconds');
      return;
    }
  }
  console.log('normal transition\n  ' + new Date().getTime() + "\n- " + clusterList[1] + "\n= " + ((new Date().getTime() - clusterList[1]) / 1000));
  foreground.transition()
    .duration(1000)
    .attrTween('d', arcTween((remainingTime / clusterTime) * MAX_ANGLE));

  d3.select('#clusterTime')
    .text(remainingTime + ' seconds');
}

function arcTween(newAngle) {
    return function(d) {
      let interpolate = d3.interpolate(d.endAngle, newAngle);
      return function(t) {
        d.endAngle = interpolate(t);
        return arc(d);
      };
    };
  }