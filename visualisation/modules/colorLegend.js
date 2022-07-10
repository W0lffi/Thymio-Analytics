var active = true;
/**
 * Creates a the color legend for graphs.
 * @selection - The parent 'g' element.
 * @props - The properties as dictionary. Order: color scale, circle radius, spacing (between circles), text offset.
 */
const colorLegend = (selection, props) => {
  const {
    COLOR_SCALE,
    circleRadius,
    spacing,
    textOffset,
    graphId
  } = props;

  const groups = selection.selectAll('g')
    .data(COLOR_SCALE.domain());
  const groupsEnter = groups
    .enter().append('g')
      .attr('class', 'tick');
  groupsEnter
    .merge(groups)
      .attr('transform', (d, i) =>
        `translate(0, ${i * spacing})`);
  groups.exit().remove();

  groupsEnter.append('circle')
    .merge(groups.select('circle'))
      .attr('r', circleRadius)
      .attr('fill', '#FFFFFF')
      .style('stroke-width', 2)
      .style('stroke', COLOR_SCALE);

  groupsEnter.append('circle')
    .merge(groups.select('circle'))
      .attr('r', circleRadius)
      .attr('id', d => 'color_' + d + '_' + graphId)
      .attr('fill', COLOR_SCALE);

  groupsEnter.append('text')
    .merge(groups.select('text'))
      .text(d => d)
      .attr('id', d => d)
      .attr('dy', '0.32em')
      .attr('x', textOffset)
    .on('click', d => {
      let selections = d3.selectAll('#color_' + d + '_' + graphId);
      active = (active) ? false : true;
      if(active) {
        selections
          .style('opacity', 1);
      }
      else {
        selections
          .style('opacity', 0);
      }
    });
}