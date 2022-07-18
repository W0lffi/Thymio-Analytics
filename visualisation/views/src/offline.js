const WIDTH = 700;
const HEIGHT = 300;
const MARGIN = {left: 48, right: 100, top: 20, bottom: 45};
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const COLOR_RANGE = ['#5D8AA8', '#E32636' , '#FFBF00', '#9966CC', '#8DB600', '#CD9575', '#000000', '#008000', '#00FFFF', '#FF9966']; //, '#FDEE00', '#007FFF', '#79443B', '#FF007F', '#007AA5', '#C41E3A', '#FFA700', '#E4D00A', '#A9A9A9', '#8B008B']
const COLOR_DOMAIN = ['bee01', 'bee02', 'bee03', 'bee04', 'bee05', 'bee06', 'bee07', 'bee08', 'bee09', 'bee10']; //, 'bee11', 'bee12', 'bee13', 'bee14', 'bee15', 'bee16', 'bee17', 'bee18', 'bee19', 'bee20']
const COLOR_SCALE = d3.scaleOrdinal().domain(COLOR_DOMAIN).range(COLOR_RANGE);
const targets = ['iMin', 'iMax', 'robNbr', 'arnSize'];

const titleDict = {
    "#iMin" : "Minimum measured light intensity",
    "#iMax" : "Maximum measured light intensity",
    "#robNbr" : "Estimated number of robots in arena",
    "#arnSize" : "Estimated arena Size"
}

var iMin = [], iMax = [], robNbr = [], arnSize = []; 
var reply;

function drawPlots(data, dataId) {
	let maxTime = data[data.length - 1].time;
	let maxValue = data[0].value;

	// Get the max value
	for(let i=0; i<data.length;i++) {
		if(maxValue < data[i].value) {
			maxValue = data[i].value;
		}
	}

	let xMinMax = [0, maxTime];
  let yMinMax = [0, maxValue];

  const X_SCALE = d3.scaleLinear().domain([0, 0]).range([0, INNER_WIDTH]);
  const Y_SCALE = d3.scaleLinear().domain([0, 0]).range([INNER_HEIGHT, 0]);

  // Creates the lines for the graph
  const lineGenerator = d3.line()
    .x(d => X_SCALE(d.time))
    .y(d => Y_SCALE(d.value))
    .curve(d3.curveStep);

  X_SCALE.domain(xMinMax);
  Y_SCALE.domain(yMinMax);

  let nestedData = d3.nest()
    .key(d => d.robot)
    .entries(data)
    .sort((a, b) => {
      return d3.descending((a.value, b.value));
  });

  let zoom = d3.zoom()
    .scaleExtent([0.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
    .extent([[0, 0], [INNER_WIDTH, INNER_HEIGHT]])
    .on('zoom', zoomPlot);

  let g = d3.select(dataId)
    .append('g')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)
    .attr('id', 'line-paths');

  let clip = g.append('defs').append('SVG:clipPath')
    .attr('id', 'clip')
    .append('SVG:rect')
    .attr('width', INNER_WIDTH)
    .attr('height', INNER_HEIGHT)
    .attr('d', 0);

  let lines = g.append('g')
    .attr('clip-path', 'url(#clip)')

  let xAxis = d3.axisBottom().scale(X_SCALE)
    .tickPadding(15);

  let xAxisG = g.append('g')
    .attr('class', 'x axis')
    .call(xAxis)
    .attr('transform', `translate(0,${INNER_HEIGHT})`);
      
  xAxisG.append('text')
    .attr('class', 'axis-label')
    .attr('y', 40)
    .attr('x', INNER_WIDTH / 2)
    .attr('fill', 'black')
    .text('time [sec]');

  let yAxis = d3.axisLeft().scale(Y_SCALE)
    .ticks(5)
    .tickPadding(10);

  let yAxisG = g.append('g')
    .attr('class', 'y axis')
    .call(yAxis);

  yAxisG.append('text')
    .attr('class', 'axis-label')
    .attr('y', -40)
    .attr('x', -INNER_HEIGHT / 2)
    .attr('fill', 'black')
    .attr('transform', `rotate(-90)`)
    .text('value');

  lines.selectAll('.line-path').data(nestedData)
    .enter().append('path')
      .attr('class', 'line-path')
      .attr('id', d => 'color_' + d.key + '_' + dataId.substring(1))
      .attr('d', d => lineGenerator(d.values))
      .attr('stroke', d => COLOR_SCALE(d.key));

  g.append('rect')
    .attr('width', INNER_WIDTH)
    .attr('height', INNER_HEIGHT)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .call(zoom);

  g.append('text')
    .attr('class', 'title')
    .attr('x', INNER_WIDTH / 2)
    .attr('y', -5)
    .text(titleDict[dataId]);
  
  d3.select(dataId).append('g')
    .attr('transform', `translate(635, 45)`)
    .attr('id', 'legend')
    .call(colorLegend, {                    		// from colorLegend.js
      COLOR_SCALE,
      circleRadius: 5,
      spacing: 20,
      textOffset: 15,
      graphId: dataId.substring(1)
    });

  /**
   * Handles the zoom of the plot
   */
  function zoomPlot() {

    xAxisG.call(xAxis.scale(d3.event.transform.rescaleX(X_SCALE)));
    yAxisG.call(yAxis.scale(d3.event.transform.rescaleY(Y_SCALE)));

    let xt = d3.event.transform.rescaleX(X_SCALE);
    let yt = d3.event.transform.rescaleY(Y_SCALE);

    const newLines = d3.line()
      .x(d => xt(d.time))
      .y(d => yt(d.value));

    g.selectAll('.line-path')
      .attr('d', d => newLines(d.values));
	}
}


/**
 * The main function which is called when the script is loaded.
 */
async function main(local=false) {
  if(!local) {
    reply = await fetchDataAsync('/api/offline-analysis');
  }
	if(reply == null) {
		console.log('You didn\'t upload any data.');
    return;	
	}
	reply = await JSON.parse(reply);
	await sortDataIntoArrays(reply, targets);			// from preparation.js
	await drawPlots(iMin, '#iMin');
	await drawPlots(iMax, '#iMax');
	await drawPlots(robNbr, '#robNbr');
	await drawPlots(arnSize, '#arnSize');
}

main()


// Button functions

function loadNewData() {
	let file = document.querySelector('[type=file]');
  let reader = new FileReader();
  reader.readAsBinaryString(file.files[0]);
  reader.onload = () => {
    reply = reader.result;
  }
}

function removeExistingGraphs() {
  document.querySelectorAll('svg').forEach(e => e.innerHTML = '');
  main(true);
}
