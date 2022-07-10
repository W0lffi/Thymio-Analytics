/**
 * Returns the local values specified by kind as an array of objects.
 * @data - The json data.
 * @kind - The wanted sublist from the json data. (iMin, iMax, robNbr or arnSize)
 * @return - The wanted sublist coverted to a list of objects.
 */
function getLocalVals(data, kind) {
    let locals = [];
    let id;
    let currentList;
    for(let i=0;i<data.bees.length;i++) {
        id = data.bees[i].name;
        currentList = data.bees[i].valsLocal[kind];
        for(let j=0;j<currentList.length;j++) {
            locals.push({robot: id, value: currentList[j][0], time: currentList[j][1]});
        }
    }
    return locals;
}

/**
 * Detects the max time of the given dataset.
 * @data - The dataset. e.g. iMin, iMax... .
 * @maxVal - The current maximum value and returned value if it's still the maximum.
 * @return - The ceiling maximum value.
 */
function getMaxTime(data, maxVal) {
    let maximum = eval(maxVal);                     // maximum = maxIMinTime, maxImaxTime, maxRobNbrTime or maxArnSizeTime
    let maximumList = [maximum];
    for(let i=0;i<data.length;i++) {
        if(data[i].time > maximum) {                 // without this compare an error will appear sometime in the Math.max function because the array were to large
            maximumList.push(data[i].time);    
        }
    }
    maximum = Math.ceil(Math.max(...maximumList));
    eval(maxVal + " = " + maximum);                 // maxIMinTime, maxImaxTime, maxRobNbrTime or maxArnSizeTime = maximum
    return maximum;
}

/**
 * Detects the max value of the given dataset.
 * @data - The dataset. e.g. iMin, iMax... .
 * @maxVal - The current maximum value and returned value if it's still the maximum.
 * @return - The ceiling maximum value.
 */
function getMaxValue(data, maxVal) {
    let maximum = eval(maxVal);                     // maximum = maxIMin, maxImax, maxRobNbr or maxArnSize
    let maximumList = [maximum];
    for(let i=0; i<data.length;i++) {
        if(data[i].value > maximum) {               // without this compare an error will appear sometime in the Math.max function because the array were to large
            maximumList.push(data[i].value);
        }
    }
    maximum = Math.ceil(Math.max(...maximumList));
    eval(maxVal + ' = ' + maximum);                 // maxIMin, maxImax, maxRobNbr or maxArnSize = maximum
    return maximum;
}

/**
 * Returns the cluster time list of the given dataset.
 * @data - The dataset of a specific bee.
 * @return - The cluster time list. 
 */
function getClusterTime(data) {
    let dataList = data.bees[0].clustering;
    dataList[1] *= 1000;
    return dataList[1] != clusterList[1] ? dataList : clusterList;
}