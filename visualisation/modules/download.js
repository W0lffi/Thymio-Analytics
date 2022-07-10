/**
 * Makes the collected data availbe for download.
 * @filename - The name of the file which will be downloaded. (with file extension)
 * @data - The data format as json.
 * @indent - The indent of the json data. (optional)
 */
function download(filename, data, indent = 0) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, indent)));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
