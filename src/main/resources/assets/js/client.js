
if (!window.google) {
    const newScript = document.createElement("script");
    newScript.onload = init;
    document.head.appendChild(newScript);
    newScript.src = "https://www.gstatic.com/charts/loader.js";
} else {
    init();
}

function init() {
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
        'packages': ['geochart', 'corechart', 'bar', 'table'],
    };

    if (key && key.length > 0) {
        googleLoadOptions.mapsApiKey = key;
    }

    google.charts.load('current', googleLoadOptions);
    google.charts.setOnLoadCallback(callback);

}

function drawData(ApiKey) {
    let lastWidgetWidth = 0;

    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.borderBoxSize != lastWidgetWidth) {
                throttle(() => {
                    lastWidgetWidth = entry.borderBoxSize[0].inlineSize;
                    drawAllCharts(ApiKey);
                }, 100);
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
        const reportElem = document.getElementById("gaReportData");

        const analyticsData = JSON.parse(reportElem.textContent);

        const type = window.googleWidget.dataset.type;

        if (type == "site") {
            if (apiKey) {
                // The map draws identical without the api key...
                // A lot of console errors show up without the key
                // The gradient line data does not work.
                drawGeoChart(analyticsData[0]);
            }
            drawUserChart(analyticsData[1]);
            drawDeviceChart(analyticsData[2]);
            drawBrowserChart(analyticsData[3]);
            drawTopPagesChart(analyticsData[4]);
            drawTopReferersChart(analyticsData[5]);

        } else if (type == "page") {
            drawPageViewsChart(analyticsData[0]);
            drawVisitersChart(analyticsData[1]);
            //TODO draw Kpi
        }
    }

    /**
     * Site charts
     */
    function drawGeoChart(chartData) {

        const visualizationData = createChartData(chartData, {
            metModify: value => parseInt(value),
        });;

        const options = {
            width: "90%",
        };

        const element = document.getElementById('gaGeoChart');
        element.style.display = "block";

        const usersGeoChart = new google.visualization.GeoChart(element.querySelector('.chart'));

        usersGeoChart.draw(visualizationData, options);
    }

    function drawUserChart(reportData) {
        const chartData = createChartData(
            reportData,
            {
                dimModify: value => new Date(parseCompactDate(value)).toLocaleDateString(),
                metModify: value => parseInt(value),
                reverse: true
            }
        );

        const options = {
            vAxis: {
                title: "User count",
                minValue: 0
            },
            hAxis: {
                title: "Dates"
            },
            legend: {
                position: "bottom"
            },
            width: "90%"
        };

        const element = document.getElementById('gaSiteUserChart');
        element.style.display = "block";

        const chart = new google.charts.Bar(element.querySelector(".chart"));

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
            width: (window.googleWidget.getBoundingClientRect().width - 20) / 2,
            legend: {
                position: 'bottom'
            }
        };

        const chart = new google.visualization.PieChart(document.getElementById('gaDevices'));

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
            width: (window.googleWidget.getBoundingClientRect().width - 20) / 2,
            legend: {
                position: 'bottom'
            }
        }

        const chart = new google.visualization.PieChart(document.getElementById('gaBrowsers'));

        chart.draw(chartData, options);
    }

    function drawTopPagesChart(reportData) {
        const chartData = createChartData(reportData);

        const options = {
            width: "90%",
            page: "enable"
        };

        const element = document.getElementById('gaPages');
        element.style.display = "block";

        const chart = new google.visualization.Table(element.querySelector('.chart'));

        chart.draw(chartData, options);
    }

    function drawTopReferersChart(reportData) {
        const chartData = createChartData(reportData);

        const options = {
            width: "90%",
            page: "enable",
        };

        const element = document.getElementById('gaReferer');
        element.style.display = "block";

        const chart = new google.visualization.Table(element.querySelector('.chart'));

        chart.draw(chartData, options);
    }

    /**
     * Page charts
     */
    function drawPageViewsChart(reportData) {
        const chartData = createChartData(reportData, {
            dimModify: value => new Date(parseCompactDate(value)).toLocaleDateString(),
            metModify: value => parseInt(value),
        });

        const options = {
            title: 'Pageviews by Date',
            width: "90%"
        }

        if (chartData.getNumberOfRows() > 0) {
            const element = document.getElementById('gaPageViews');
            element.style.display = "block";

            const chart = new google.visualization.LineChart(element);

            chart.draw(chartData, options);
        }
    }

    function drawVisitersChart(reportData) {
        const chartData = createChartData(reportData, {
            metModify: value => parseInt(value)
        });

        const options = {
            title: 'Visitors',
            width: "90%"
        }

        const chart = new google.visualization.PieChart(document.getElementById('gaVisiters'));

        chart.draw(chartData, options);
    }

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

        if (options && options.debug) {
            console.log("DataTable", dataTable);
        }

        return google.visualization.arrayToDataTable(dataTable);
    }
}

/** Send in 20600501 out 2060-05-01 */
function parseCompactDate(val) {
    return val.slice(0, 4) +
        "-" +
        val.slice(4, 6) +
        "-" +
        val.slice(6, 8);
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
    document.querySelector('#gaSiteData').style.display = "none;"
    window.googleWidget.appendChild(errorDiv);
}
