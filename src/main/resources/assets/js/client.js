
if (!window.google) {
    const newScript = document.createElement("script");
    newScript.onload = init;
    document.head.appendChild(newScript);
    newScript.src = "https://www.gstatic.com/charts/loader.js";
} else {
    init();
}



function init() {
    // Our widget element.
    window.googleWidget = document.getElementById("widget-com-enonic-app-gareport");

    fetch(window.googleWidget.dataset.settingsurl)
        .then(response => {
            if (!response.ok) {
                console.log("Error with fetching settings service. Loading other graphs");
                return { error: "error" };
            } else {
                return response.json();
            }
        })
        .then(data => {
            loadGoogleApis(data.maps, () => drawData(data.maps));
        })
        .catch(e => {
            console.log(e);
            showError("Error while fetching data");
        });
}

/**
 * Load all the needed apis and start drawing widgets
 *
 * @param {String} key
 */
function loadGoogleApis(key, callback) {
    const googleLoadOptions = {
        'packages': ['geochart', 'corechart', 'bar'],
    };

    if (key && key.length > 0) {
        googleLoadOptions.mapsApiKey = key;
    }

    google.charts.load('current', googleLoadOptions);
    google.charts.setOnLoadCallback(callback);

}

function drawData(ApiKey) {
    const reportElem = document.getElementById("googleAnalyticsReportData");
    const analyticsData = JSON.parse(reportElem.textContent);


    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.contentBoxSize) {
                throttle(() => {
                    drawAllCharts(ApiKey);
                }, 100);
                break;
            }
        }
    });

    // The charts are not responsive so we redraw on resize
    // the observer called on load so don't need a seperate one
    resizeObserver.observe(window.googleWidget);

    this.timeOut = null;
    function throttle(call, delay) {
        this.timeOut && clearTimeout(timeOut);
        this.timeOut = setTimeout(call, delay);
    }

    function drawAllCharts(apiKey) {
        const widget = window.googleWidget;

        if (apiKey) {
            // The map draws identical without the api key...
            // A lot of console errors show up without the key
            // The gradient line data does not work.
            drawGeoChart(analyticsData[0]);
        }
        drawUserChart(analyticsData[1]);
        drawDeviceChart(analyticsData[2]);
        drawBrowserChart(analyticsData[3]);

    }


    /**
     * Site charts
     */

    function drawGeoChart(chartData) {
        const visualizationData = createChartData(chartData);

        const options = {
            width: window.googleWidget.getBoundingClientRect().width - 50,
        };

        const usersGeoChart = new google.visualization.GeoChart(document.getElementById('googleAnalyticsGeoChart'));

        usersGeoChart.draw(visualizationData, options);
    }

    function drawUserChart(reportData) {
        const chartData = createChartData(
            reportData,
            {
                dimModify: value => new Date(
                    "".concat(
                        value.slice(0, 4),
                        "-",
                        value.slice(4, 6),
                        "-",
                        value.slice(6, 8))
                ).toLocaleDateString(),
                metModify: value => parseInt(value),
                reverse: true
            }
        );

        const options = {
            chart: {
                title: 'Site users'
            },
            vAxis: {
                title: "User count",
                minValue: 0
            },
            hAxis: {
                title: "Dates"
            }
        };

        const chart = new google.charts.Bar(document.getElementById('googleAnalyticsSiteUserChart'));

        chart.draw(chartData, google.charts.Bar.convertOptions(options));
    }

    function drawDeviceChart(reportData) {
        const chartData = createChartData(
            reportData,
            {
                metModify: value => parseInt(value)
            }
        );

        const options = {
            title: 'Devices',
            is3D: true,
            width: Math.floor((window.googleWidget.getBoundingClientRect().width - 20) / 2) // half parent size
        };

        const chart = new google.visualization.PieChart(document.getElementById('googleAnalyticsDevices'));

        chart.draw(chartData, options);
    }

    function drawBrowserChart(reportData) {
        const chartData = createChartData(
            reportData,
            {
                metModify: value => parseInt(value)
            }
        );

        const options = {
            title: 'Browsers',
            is3D: true,
            width: Math.floor((window.googleWidget.getBoundingClientRect().width - 20) / 2) // half parent size
        }

        const chart = new google.visualization.PieChart(document.getElementById('googleAnalyticsBrowsers'));

        chart.draw(chartData, options);
    }

    function drawTop10Pages(reportData) {
        //TODO
    }

    function drawTop10Referers(reportData) {
        //TODO
    }

    /**
     * Page charts
     */

    /**
     * From array to google chart expected data
     * @param {Object} reportData Report data from Java bean
     * @param {Object} options Object with all option properties
     * @param {Function} options.metModify Function to modify metric value
     * @param {Function} options.dimModify Function to modify dimension value
     * @param {Boolean} options.reverse if the report data rows should be reversed
     * @returns {Array[][]} Google expected data format
     */
    function createChartData(reportData, options) {
        const dataTable = [
            [...reportData.dimensions, ...reportData.metrics],
        ];

        let dataTableEntrys = reportData.reportRow.map(row => [
            ...row.dimensionValues.map(dimension => {
                if (options && options.dimModify) {
                    return options.dimModify(dimension.value);
                } else {
                    return dimension.value;
                }
            }),
            ...row.metricValues.map(metric => {
                if (options && options.metModify) {
                    return options.metModify(metric.value);
                } else {
                    return metric.value;
                }
            }),
        ]);

        if (options && options.reverse) {
            dataTableEntrys = dataTableEntrys.reverse();
        }

        dataTable.push(...dataTableEntrys);

        return google.visualization.arrayToDataTable(dataTable);
    }
}

/**
 *
 * @param {HtmlElement} widget The container widget
 * @param {String} message The error message to show
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add("error");

    errorDiv.textContent = message;
    document.querySelector('#googleAnalyticsSiteData').style.display = "none;"
    window.googleWidget.appendChild(errorDiv);
}
