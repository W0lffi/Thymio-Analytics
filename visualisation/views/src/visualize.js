const WAIT_TIME = 2000;
const QUERY_PARAMS = new URLSearchParams(window.location.search);
const WIDTH = 700;
const HEIGHT = 300;
const MARGIN = {left: 48, right: 100, top: 20, bottom: 45};
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const X_SCALE = d3.scaleLinear().domain([0, 0]).range([0, INNER_WIDTH]);
const Y_SCALE = d3.scaleLinear().domain([0, 0]).range([INNER_HEIGHT, 0]);
const COLOR_RANGE = ['#5D8AA8', '#E32636' , '#FFBF00', '#9966CC', '#8DB600', '#CD9575', '#000000', '#008000', '#00FFFF', '#FF9966']; //, '#FDEE00', '#007FFF', '#79443B', '#FF007F', '#007AA5', '#C41E3A', '#FFA700', '#E4D00A', '#A9A9A9', '#8B008B']
const COLOR_DOMAIN = ['bee01', 'bee02', 'bee03', 'bee04', 'bee05', 'bee06', 'bee07', 'bee08', 'bee09', 'bee10']; //, 'bee11', 'bee12', 'bee13', 'bee14', 'bee15', 'bee16', 'bee17', 'bee18', 'bee19', 'bee20']
const OFFLINE_URL = '/upload/offline-analysis';

var COLOR_SCALE = d3.scaleOrdinal().domain(COLOR_DOMAIN).range(COLOR_RANGE);
var url = buildUrl('true');
var maxIMin = 0, maxIMax = 0, maxRobNbr = 0, maxArnSize = 0;
var maxIMinTime = 0, maxIMaxTime = 0, maxRobNbrTime = 0, maxArnSizeTime = 0;
var iMin = [], iMax = [], robNbr = [], arnSize = [];

var offlineData;

var clusterList = [0, 0];
var receiving = true;
var clustering = false;

// Creates the lines for the graph
const lineGenerator = d3.line()
    .x(d => X_SCALE(d.time))
    .y(d => Y_SCALE(d.value))
    .curve(d3.curveStep);

/**
 * Initializes the plot by the given data.
 * data - The data. A list of objects.
 * dataId - Describes the plot. (#iMin, #iMax, #robNbr, #arnSize)
 */
function initPlot(data, dataId) {
  let curMaxTime = 'max' + dataId.charAt(1).toUpperCase() + dataId.substring(2) + 'Time';         // max(Name)Time    }
  let curMaxValue = 'max' + dataId.charAt(1).toUpperCase() + dataId.substring(2);                 // max(Name)        } Name can be: IMin, IMax, RobNbr or ArnSize
  let maxTime = getMaxTime(data, curMaxTime);     // from getter.js
  let maxValue = getMaxValue(data, curMaxValue);  // from getter.js

  let xMinMax = [0, maxTime];
  let yMinMax = [0, maxValue];

  X_SCALE.domain(xMinMax);
  Y_SCALE.domain(yMinMax);

  let nestedData = d3.nest()
    .key(d => d.robot)
    .entries(data)
    .sort((a, b) => {
      return d3.descending((a.value, b.value));
    });

  /*if(nestedData.length == 1) {
    let beeId = QUERY_PARAMS.get('bee') - 1;
    manipulateColor(beeId);
  }*/

  let g = d3.select(dataId).append('g')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)
    .attr('id', 'line-paths');

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

  g.selectAll('.line-path').data(nestedData)
    .enter().append('path')
      .attr('class', 'line-path')
      .attr('id', d => 'color_' + d.key + '_' + dataId.substring(1))
      .attr('d', d => lineGenerator(d.values))
      .attr('stroke', d => COLOR_SCALE(d.key));

  g.append('text')
    .attr('class', 'title')
    .attr('x', INNER_WIDTH / 2)
    .attr('y', -5)
    .text(dataId.substring(1));
  
  d3.select(dataId).append('g')
    .attr('transform', `translate(635, 45)`)
    .attr('id', 'legend')
    .call(colorLegend, {                    // from colorLegend.js
      COLOR_SCALE,
      circleRadius: 5,
      spacing: 20,
      textOffset: 15,
      graphId: dataId.substring(1)
    });
}

/**
 * Updates the plot which was initiated before with new data and adapt the paths to the coordinate system.
 * data - The new and old data concatenated. A list of objects.
 * dataId - Describes the plot. (#iMin, #iMax, #robNbr, #arnSize)
 */
function updatePlot(data, dataId) {
  let curMaxTime = 'max' + dataId.charAt(1).toUpperCase() + dataId.substring(2) + 'Time';         // max(Name)Time    }
  let curMaxValue = 'max' + dataId.charAt(1).toUpperCase() + dataId.substring(2);                 // max(Name)        } Name can be: IMin, IMax, RobNbr or ArnSize
  let maxTime = getMaxTime(data, curMaxTime);
  let maxValue = getMaxValue(data, curMaxValue);

  let xMinMax = [0, maxTime];
  let yMinMax = [0, maxValue];

  X_SCALE.domain(xMinMax);
  Y_SCALE.domain(yMinMax);

  let nestedData = d3.nest()
    .key(d => d.robot)
    .entries(data)
    .sort((a, b) => {
      return d3.descending((a.value, b.value));
    });

  let graph = d3.select(dataId);

  let xAxis = d3.axisBottom().scale(X_SCALE)
    .tickPadding(15);

  let yAxis = d3.axisLeft().scale(Y_SCALE)
    .ticks(5)
    .tickPadding(10);

  graph.select('g.x.axis')
    .transition()
    .duration(100)
    .call(xAxis);

  graph.select('g.y.axis')
    .transition()
    .duration(100)
    .call(yAxis);

  let lines = graph.selectAll('.line-path').data(nestedData);

  lines
    .enter()
      .append('path')
      .attr('class','line-path')
      .attr('id', d => 'color_' + d.key + '_' + dataId.substring(1))
      .merge(lines)
    .transition()
      .duration(1)
      .attr('d', d => lineGenerator(d.values))
}

/**
 * Adapt the color scale if only one bee is chosen. Used for hide the legend circles if only one bee is obeserved.
 * beeId - The ID from the observed bee. 
 */
function manipulateColor(beeId) {
  COLOR_SCALE = d3.scaleOrdinal()
    .domain(COLOR_DOMAIN[beeId])
    .range(COLOR_RANGE[beeId]);
}

/**
 * The delay function waits the given time before returns. Should be used with await in async a function.
 * ms - The time which sould be delayed.
 * return - An empty string as promise object.
 */
function delay(ms) {
  return new Promise(resolve => {
    setTimeout(() => { resolve('') }, ms);
  });
}

/**
 * Appends the query parameters to the url.
 * valReset - The reset query parameter.
 * return - The url with query parameters.
 */
function buildUrl(valReset) {
  let id = QUERY_PARAMS.get('bee');
  return id == null ? '/api/overview?reset=' + valReset : '/api/detail?bee=' + id  + '&reset=' + valReset;
}

async function receiveLoop() {
  let reply;
  while(receiving) {
    reply = await fetchDataAsync(url);
    reply = await JSON.parse(reply);
    await sortDataInArrays(reply);                  // from preparation.js
    await updatePlot(iMin, '#iMin');
    await updatePlot(iMax, '#iMax');
    await updatePlot(robNbr, '#robNbr');
    await updatePlot(arnSize, '#arnSize');
    if(QUERY_PARAMS.get('bee') != null) {
      if(!clustering) {
        clusterList = await getClusterTime(reply);    // from getter.js
      }
      await updateClusterChart();                   // from clustering.js
    }
    await delay(WAIT_TIME);
  }
}

/**
 * Initializes the array and the plot
 */
async function init() {
  let waitTime = 0;
  let empty = ["", "", "", "", "", "", "", "", "", ""];
  let reply, result;
  do {
    await delay(waitTime);
    reply = await fetchDataAsync(url);              // from fetchData.js
    reply = await JSON.parse(reply);
    result = empty.every((val, index) => val === reply.bees[index]);
    waitTime = WAIT_TIME;
  }while(result);

  url = buildUrl('false');
  await initArrays(reply);                          // from preparation.js
  await initPlot(iMin, '#iMin');
  await initPlot(iMax, '#iMax');
  await initPlot(robNbr, '#robNbr');
  await initPlot(arnSize, '#arnSize');
  if(QUERY_PARAMS.get('bee') != null) {
    clusterList = await getClusterTime(reply);      // from getter.js
    initClusterChart();                             // from clustering.js
  }
  await delay(WAIT_TIME);
}

/**
 * The main function with the endless loop.
 */
async function main() {
  await init();
  receiveLoop();
}

main();



// Button functions

/**
 * Calls the download function with dynamicly created name.
 */
function startDownload() {
  let id = QUERY_PARAMS.get('bee');
  let name = (id == null) ? 'overview.json' : 'bee' + id + '.json';
  let content = {
    iMinVals : iMin,
    iMaxVals : iMax,
    robNbrVals : robNbr,
    arnSizeVals : arnSize 
  };
  // let indent = 4;
  download(name, content/*, indent*/);            // from download.js
}

/**
 * Saves the data from the chosen file. 
 */
function saveDataFromFile() {
  let file = document.querySelector('[type=file]');
  let reader = new FileReader();
  reader.readAsBinaryString(file.files[0]);
  reader.onload = () => {
    offlineData = reader.result;
  };
}

/**
 * Initializes the form action for the upload button.
 */
function initUpload() {
  let form = document.querySelector('form');
  let formData = new FormData();
    
  form.addEventListener('submit', e => {
    e.preventDefault();
    formData.append('data', offlineData);
    fetch(OFFLINE_URL, {
      method: 'post',
      body: formData,
    })
    .then((response) => {
      window.location.href = '/offline-analysis';
    });
  });
}

function toggleReceive() {
  receiving = document.querySelector("[type='checkbox']").checked;
  receiveLoop();
}