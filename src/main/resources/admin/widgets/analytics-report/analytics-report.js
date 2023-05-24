const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const thymeleaf = require('/lib/thymeleaf');

function get(req) {
    const report = __.newBean("com.enonic.app.analytics.report.auth.GoogleReportData");
    let credentialPath = "";
    let content;
    let type;
    let siteConfig;
    let reportData;

    if (app.config) {
        //TODO document key name + example
        if (app.config && app.config["ga.credentialPath"]) {
            // log.info(`CredentialPath: ${app.config["ga.credentialPath"]}`);
            credentialPath = app.config["ga.credentialPath"];
        } else {
            return ErrorResponse("No path to credentials found");
        }
    }

    if (req.params.contentId) {
        content = contentLib.get({ key: req.params.contentId });
    } else {
        content = portalLib.getContent();
    }

    if (content === null) {
        return ErrorResponse("No content selected");
    }

    const site = contentLib.getSite({ key: content._id });

    if (site._id === content._id) {
        type = "site";
    } else {
        type = "page";
    }

    // Would like a better way to get site config
    // A bad alternative is executing it in a created context
    if (site.data && site.data.siteConfig) {
        site.data.siteConfig.forEach(element => {
            if (element.applicationKey = app.name) {
                siteConfig = element.config;
            }
        });
    }

    if (!siteConfig) {
        //TODO Trigger this aka test it
        return ErrorResponse("Missing measure id? No site configuration found for application.");
    }

    if (type === "site") {
        reportData = report.runSiteReports(siteConfig.measureId, credentialPath);
    } else {
        reportData = report.runPageReports(siteConfig.measureId, credentialPath, stripSite(content._path, site._path));
    }

    const serviceUrl = portalLib.serviceUrl({
        service: 'gaSettings',
        type: "absolute",
    })
    const scriptAssetUrl = portalLib.assetUrl({path: 'js/client.js'});
    const cssUrl = portalLib.assetUrl({ path: 'css/widget.css' });

    const widgetId = "widget-com-enonic-app-gareport"; // app.name.replace(/\./g, "-");

    return {
        contentType: 'text/html',
        body: `<widget id="${widgetId}" data-type="${type}" data-settingsurl="${serviceUrl}">
            <link href="${cssUrl}" rel="stylesheet">
            <div id="googleAnalyticsSiteData">
                <h1>Last month</h1>
                <!-- site -->
                <div id="googleAnalyticsGeoChart"></div>
                <div id="googleAnalyticsSiteUserChart"></div>
                <div id="googleAnalyticsDevices"></div>
                <div id="googleAnalyticsBrowsers"></div>
                <div class="container" id="googleAnalyticsPages">
                    <h2>Top pages<h2>
                    <div class="chart"></div>
                </div>
                <div class="container" id="googleAnalyticsReferer">
                    <h2>Top Referrers<h2>
                    <div class="chart"></div>
                </div>
                <!-- Page -->
                <div id="googleAnalyticsPageViews"></div>
                <div id="googleAnalyticsVisiters"></div>
            </div>
            <script id="googleAnalyticsReportData" type="application/json">${reportData}</script>
            <script type="text/javascript" src="${scriptAssetUrl}"></script>
        </widget>`,
    }
}

function stripSite(contentPath, sitePath) {
    const stripSite = contentPath.slice(sitePath.length);
    return stripSite.length > 0 ? stripSite : "/";
}

function ErrorResponse(message) {
    return {
        contentType: 'text/html',
        body: `<widget class="error">${message}</widget>`,
    }
}

exports.get = get;
