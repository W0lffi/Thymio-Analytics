// Online version

/**
 * Appends the new data on the old dataset.
 * @existingData - The old data, the new data will be appended to them.
 * @newData - The data which will be appended.
 * @robot - The id of the robot.
 */
function concatExistingNewData(existingData, newData, id) {
    let time;
    for(let i=0;i<newData.length;i++) {
        time = newData[i][1];
        existingData.push({robot: id, value: newData[i][0], time: newData[i][1]});
    }
}

/**
 * Get the whole dataset with all new values and sort them into the right arrays.
 * @data - The whole dataset.
 */
function sortDataInArrays(data) {
    let dataLength = data.bees.length;
    for(let i=0;i<dataLength;i++) {
        let id = data.bees[i].name;
        concatExistingNewData(iMin, data.bees[i].valsLocal.iMin, id);
        concatExistingNewData(iMax, data.bees[i].valsLocal.iMax, id);
        concatExistingNewData(robNbr, data.bees[i].valsLocal.robNbr, id);
        concatExistingNewData(arnSize, data.bees[i].valsLocal.arnSize, id);
    }
}

/**
 * Initializes the arrays with a zero pair in beginning and adds the first data.
 * @data - The first dataset.
 */
function initArrays(data){
    let dataLength = data.bees.length;
    for(let i=0;i<dataLength;i++) {
        let id = data.bees[i].name;
        concatExistingNewData(iMin, data.bees[i].valsLocal.iMin, id);
        concatExistingNewData(iMax, data.bees[i].valsLocal.iMax, id);
        concatExistingNewData(robNbr, data.bees[i].valsLocal.robNbr, id);
        concatExistingNewData(arnSize, data.bees[i].valsLocal.arnSize, id);
    }
}

/**
 * Rounds a number to the desired decimal places.
 * @number - The number which should be rounded.
 * @decimalPlaces - The number of decimal places.
 * @return - The rounded number.
 */
function roundAccurately(number, decimalPlaces) {
    return Number(Math.round(number + "e" + decimalPlaces) + "e-" + decimalPlaces)
}

// Offline version

/**
 * Get the while Json object from the uploaded file.
 * @data - The json object.
 * @targets - The list with the targets.
 */
function sortDataIntoArrays(data, targets) {
    iMin = data.iMinVals;
    iMax = data.iMaxVals;
    robNbr = data.robNbrVals;
    arnSize = data.arnSizeVals;
    /*let keys = Object.keys(data);
    let target = 0;

    for(const key of keys) {
        console.log(targets[target])
        console.log(data[key])
        // eval(targets[target] + " = " + data[key]);
        target++;
    }*/
}