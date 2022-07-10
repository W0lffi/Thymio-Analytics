const PATH = require('path');
const FS = require('fs');
const ZMQ = require('zeromq')

const DATA = PATH.join(PATH.join(PATH.join(__dirname, '..'), '..'), 'data');
const SOCKET = new ZMQ.Request();

SOCKET.connect('tcp://127.0.0.1:5556');

/**
 * Asks the needed json files from the server.  
 * 
 * @param beeId - Specifies the json file. 
 * @return The json file(s) in an array.
 */ 
async function getBee(beeId, ip, bReset) {
	const EXTENSION = '.json'
	var beesDict = {};
	var key = 'bees';
	beesDict[key] = [];
	var files = FS.readdirSync(DATA);

	// Filter the directory list for json data
	files = files.filter(file => {
    	return PATH.extname(file).toLowerCase() === EXTENSION;
	});

	try {
		// Request all json files from server and save them into the array
		if(beeId < 1) {
			for(const file of files) {
				await SOCKET.send(file.slice(0, 5) + ',' + ip + ',' + bReset);
		    let reply = await SOCKET.receive();
		    beesDict[key].push(JSON.parse(reply));
			}
		}

		// Request the specific json file from the server and save it into the array
		else if(beeId <= files.length) {
			await SOCKET.send(files[beeId - 1].slice(0, 5) + ',' + ip  + ',' + bReset);
	    let reply = await SOCKET.receive();
	    beesDict[key].push(JSON.parse(reply));
		}
		else {
			console.log('The requested bee with number ' + beeId + ' doesnt exists.');
		}
	} catch(e) {
		console.log(e);
		Function.prototype();		// equal to NOP operation
	}
	return beesDict;
}

module.exports.getBee = getBee;