const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const thymeleaf = require('/lib/thymeleaf');

const view = resolve("analytics-report.html");

function ClientException(message) {
    this.name = "ClientException";
    this.message = message;
}

function getCredentialsPath(appRef) {
    if (!appRef.config) {
        throw new ClientException("No config found");
    }
    if (!appRef.config["ga.credentialPath"]) {
        throw new ClientException("No path to credentials found");
    }
    return appRef.config["ga.credentialPath"];
}

function getContent(req) {
    let content;
    if (req && req.params && req.params.contentId) {
        content = contentLib.get({ key: req.params.contentId });
    } else {
        content = portalLib.getContent();
    }

    if (content == null) {
        throw new ClientException("No content selected");
    }

    return content;
}

function getContentType(content) {
    if (content.type == "portal:site") {
        return "site";
    } else {
        return "page";
    }
}

// Would like a better way to get site config
    // A bad alternative is executing it in a created context
function getAppSettings(site) {
    let siteConfig;
    if (!site.data) {
        throw new ClientException("Missing property id? No app configuration found");
    }
    if (!site.data.siteConfig) {
        throw new ClientException("Missing app configuration")
    }
    site.data.siteConfig.forEach(element => {
        if (element.applicationKey == app.name) {
            siteConfig = element.config;
        }
    });
    if (!siteConfig.propertyId) {
        throw new ClientException("Missing propertyId. See app configuration");
    }

    return siteConfig;
}

function get(req) {
    let credentialPath
    let content;
    let type;
    let siteConfig;
    let reportData;
    let site;

    try {
        credentialPath = getCredentialsPath(app);
        content = getContent(req);
        type = getContentType(content);
        site = contentLib.getSite({ key: content._id });
        siteConfig = getAppSettings(site);
    }
    catch (e) {
        return ErrorResponse(e.message);
    }

    const report = __.newBean("com.enonic.app.analytics.report.auth.GoogleReportData");

    if (type === "site") {
        reportData = report.runSiteReports(siteConfig.propertyId, credentialPath);
    } else {
        reportData = report.runPageReports(siteConfig.propertyId, credentialPath, stripSite(content._path, site._path));
    }

    const serviceUrl = portalLib.serviceUrl({
        service: 'gaSettings',
        type: "absolute",
    })
    const scriptAssetUrl = portalLib.assetUrl({path: 'js/client.js'});
    const cssUrl = portalLib.assetUrl({ path: 'css/widget.css' });

    const widgetId = "widget-com-enonic-app-gareport"; // app.name.replace(/\./g, "-");

    const model = {
        type,
        serviceUrl,
        scriptAssetUrl,
        cssUrl,
        widgetId,
        reportData
    };

    return {
        contentType: 'text/html',
        body: thymeleaf.render(view, model),
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
