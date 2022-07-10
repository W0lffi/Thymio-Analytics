#! /usr/bin/env node

/**
 * This is the webserver which visualize the incoming data of the robots.
 * After you started the server call localhost:3000 in your webbrowser, if the server runs on the same pc and you didn't changed the port.
 * The IP and port are shown in the terminal if you start the server.
 * @author Sven Wolff
 */
const HTTP = require('http');
const PATH = require('path');

const IP = require("ip");
const EXPRESS = require('express');
const MULTER = require('multer');

const BEE_READER = require(PATH.join(PATH.join(__dirname, 'modules'), 'beeReader'));
const VIEWS = PATH.join(__dirname, 'views');
const DATA = PATH.join(PATH.join(__dirname, '..'), 'data');

const APP = EXPRESS();
const UPLOAD = MULTER({limits: {fieldSize: 10 * 1024 * 1024}}); // upload file size limited to 10 mb

var offlineData;

APP.use(EXPRESS.static(PATH.join(VIEWS, 'src')));
APP.use(EXPRESS.static(PATH.join(__dirname, 'modules')));
APP.use(UPLOAD.array());


APP.get('/', (req, res)  => {
	res.sendFile(PATH.join(VIEWS, 'overview.html'));
});

APP.get('/api/overview', async (req, res) => {
	let bReset = req.query.reset;
	let ip = req.connection.remoteAddress;
	let json = await BEE_READER.getBee(0, ip, bReset);
	json = JSON.stringify(json);
	res.json(json);
});

APP.get('/bee', (req, res) => {
	res.sendFile(PATH.join(VIEWS, 'detail.html'));
});

APP.get('/api/detail', async (req, res) => {
	let beeId = req.query.bee;
	let bReset = req.query.reset;
	let ip = req.connection.remoteAddress;
	let json = await BEE_READER.getBee(beeId, ip, bReset);
	json = JSON.stringify(json);
	res.json(json);
});

APP.get('/offline-analysis', (req, res) => {
	res.sendFile(PATH.join(VIEWS, 'offline-analysis.html'));
});

APP.get('/api/offline-analysis', (req,res) => {
	res.json(JSON.stringify(offlineData));
});

APP.post('/upload/offline-analysis', (req, res) => {
	offlineData = JSON.parse(req.body.data);
	res.json({});
});

const SERVER = HTTP.createServer(APP);
var suffix = "";
var port;


// If no port is given choose the default port 3000
if (process.argv[2] == undefined){
	port = 3000;
	suffix = ', by default.';
	console.log('You can specify the Port by using the first command line argument.');
}
// If a valid port is given use it
else if(!isNaN(process.argv[2]) && parseInt(process.argv[2]) > 0 && parseInt(process.argv[2]) < 65536) {
	port = process.argv[2];
	suffix = ', by your choice.';
}
// else the argument isn't a number or not in range return an error and exit the program
else {
	console.log('TypeError: The port must be a number and must between 0 and 65536.');
	process.exit();
}

SERVER.listen(port, () => {
	console.log('Server is listening on port ' + port + suffix);
	console.log('The local IPv4 address: ' + IP.address());
});

