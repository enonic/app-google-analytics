

function get() {
    let mapsKey;
    if (app.config && app.config["ga.mapsApiKey"]) {
        mapsKey = app.config["ga.mapsApiKey"] || "";
    }

    return {
        contentType: 'application/json',
        body: JSON.stringify({
            maps: mapsKey
        })
    }
}

exports.get = get;
