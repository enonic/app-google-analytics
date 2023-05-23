const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const thymeleaf = require('/lib/thymeleaf');

function get(req) {
    const ga_auth = __.newBean("com.enonic.app.analytics.report.auth.GoogleAuthServiceAccount");
    let credentialPath = "";

    if (app.config) {
        //TODO document key name + example
        if (app.config && app.config["ga.credentialPath"]) {
            // log.info(`CredentialPath: ${app.config["ga.credentialPath"]}`);
            credentialPath = app.config["ga.credentialPath"];
        } else {
            return ErrorResponse("No path to credentials found");
        }
    }

    let contentId;
    if (req.params.contentId) {
        contentId = req.params.contentId;
    } else {
        let content = portalLib.getContent();

        if (content === null) {
            return ErrorResponse("No content selected");
        } else {
            contentId = content._id;
        }
    }

    let siteConfig;

    // Would like a better way to get site config
    // A bad alternative is executing it in a created context
    const site = contentLib.getSite({key: contentId});
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

    const serviceUrl = portalLib.serviceUrl({
        service: 'gaSettings',
        type: "absolute",
    })
    const scriptAssetUrl = portalLib.assetUrl({path: 'js/client.js'});
    const cssUrl = portalLib.assetUrl({ path: 'css/widget.css' });

    const reportData = ga_auth.authenticate(siteConfig.measureId, credentialPath);

    const widgetId = "widget-com-enonic-app-gareport"; // app.name.replace(/\./g, "-");

    return {
        contentType: 'text/html',
        body: `<widget id="${widgetId}" data-settingsurl="${serviceUrl}">
            <link href="${cssUrl}" rel="stylesheet">
            <div id="googleAnalyticsSiteData">
                <div id="googleAnalyticsGeoChart"></div>
                <div id="googleAnalyticsSiteUserChart"></div>
                <div id="googleAnalyticsDevices"></div>
                <div id="googleAnalyticsBrowsers"></div>
            </div>
            <script id="googleAnalyticsReportData" type="application/json">${reportData}</script>
            <script type="text/javascript" src="${scriptAssetUrl}"></script>
        </widget>`,
    }
}

function ErrorResponse(message) {
    return {
        contentType: 'text/html',
        body: `<widget class="error">${message}</widget>`,
    }
}

exports.get = get;
