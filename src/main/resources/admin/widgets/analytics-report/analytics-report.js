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

    // This is one annoying way to get the siteConfig.
    // Second alternative is executing it in a context also a lot of code.
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

    log.info(`Measure id ${siteConfig.measureId}`);

    const a = ga_auth.authenticate(siteConfig.measureId, credentialPath);

    log.info(JSON.stringify(a));

    const widgetId = app.name;

    return {
        contentType: 'text/html',
        body: `<widget id="widget-${widgetId}">:D</widget>`,
    }
}

function ErrorResponse(message) {
    return {
        contentType: 'text/html',
        body: `<widget class="error">${message}</widget>`,
    }
}

exports.get = get;
