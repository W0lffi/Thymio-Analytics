/**
 * Fetches json-data from the server by the given url.
 * @url - The server address.
 * @return - The fetched json-data as string. 
 */
async function fetchDataAsync(url) {
    let response = await fetch(url);
    let file, str;
    try {
        file = await response.json();
        str = JSON.stringify(JSON.parse(file));
    } catch(e) {
        str = null
    }
    return str;
}

/*
function fetchWithTimeout(url, timeout) {
    return new Promise( (resolve, reject) => {
        let timer = setTimeout(
            () => reject(new Error('Request timed out')), timeout
        );

        fetch(url)
        .then(
            response => resolve(response),
            err => reject(err))
        .finally(() => clearTimeout(timer));
    });
}
*/
