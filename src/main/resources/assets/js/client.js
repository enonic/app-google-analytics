
if (!window.google) {
    const newScript = document.createElement("script");
    newScript.onload = init;
    document.head.appendChild(newScript);
    newScript.src = "https://www.gstatic.com/charts/loader.js";
} else {
    init();
}

function init() {
    google.charts.load('current', { packages: ['corechart', 'geochart', 'bar'] });

    google.charts.setOnLoadCallback(drawAllCharts);

    const script = document.getElementById("googleAnalyticsReportData");
    const analyticsData = JSON.parse(script.textContent);

    const geoContainer = document.getElementById('googleAnalyticsGeoChart');
    const userContainer = document.getElementById('googleAnalyticsSiteUserChart');

    function drawAllCharts() {
        drawGeoChart(analyticsData[0]);
        drawUserChart(analyticsData[1]);
        drawDeviceChart(analyticsData[2]);
    }

    function drawGeoChart(chartData) {
        // const visualizationData = google.visualization.arrayToDataTable([
        //     [...data.dimensions, ...data.metrics],
        //     ...data.reportRow.map( (row) => {
        //         return [
        //             row.dimensionValues[0].value,
        //             row.metricValues[0].value
        //         ]
        //     })
        // ]);

        // const options = {
        //     width: container.parentNode.offsetWidth - 50 //Add some space
        // };

        // const usersGeoChart = new google.visualization.GeoChart(container);

        // usersGeoChart.draw(visualizationData, options);
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

        const chart = new google.charts.Bar(userContainer);

        chart.draw(chartData, google.charts.Bar.convertOptions(options));
    }

    function drawDeviceChart(reportData) {
        const chartData = createChartData(reportData);

        const options = {
            title: 'Devices',
            is3D: true,
        };

        const chart = new google.visualization.PieChart(document.getElementById('googleAnalyticsDevices'));

        chart.draw(chartData, options);
    }

    /**
     * From array to google chart espected data
     * @param {Object} reportData Report data from Java bean
     * @param {Object} options
     * @param {Function} options.metModify Function to modify metric value
     * @param {Function} options.dimModify Function to modify dimension value
     * @param {Boolean} options.reverse if the report data rows should be reversed
     * @returns The data returned as needed for charts
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


        return google.visualization.arrayToDataTable(dataTable.slice(0, 13));
    }
}
