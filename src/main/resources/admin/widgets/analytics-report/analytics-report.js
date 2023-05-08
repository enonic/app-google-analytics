const portalLib = require('/lib/xp/portal');
const thymeleaf = require('/lib/thymeleaf');

function get(req) {
    const ga_auth = __.newBean("com.enonic.app.analytics.report.auth.GoogleAuthServiceAccount");

    // ga_auth.authenticate();

    const widgetId = app.name;

    return {
        contentType: 'text/html',
        body: `<widget id="widget-${widgetId}">:D</widget>`,
    }
}

exports.get = get;
