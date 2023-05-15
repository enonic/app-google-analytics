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

    let contentId = req.params.contentId ? req.params.contentId : portalLib.getContent()._id;

    if (!contentId) {
        return ErrorResponse('No content selected');
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
    const scriptAssetUrl = portalLib.assetUrl({path: 'js/client.js'});

    const reportData = ga_auth.authenticate(siteConfig.measureId, credentialPath);

    const widgetId = app.name;

    return {
        contentType: 'text/html',
        body: `<widget id="widget-${widgetId}">
            <div id="googleAnalyticsSiteData">
                <div id="googleAnalyticsGeoChart"></div>
                <div id="googleAnalyticsSiteUserChart"></div>
                <div id="googleAnalyticsDevices"></div>
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
