const contentLib = require('/lib/xp/content');
const portalLib = require('/lib/xp/portal');

//TODO check if tracking is enabled or not

exports.responseProcessor = function (req, res) {
    let contentId = req.params.contentId;
    if (!contentId) {
        const fetchContent = portalLib.getContent();
        if (fetchContent) {
            contentId = fetchContent._id;
        } else {
            return res;
        }
    }

    const siteConfig = contentLib.getSiteConfig({
        key: contentId,
        applicationKey: app.name
    });

    const measurementID = siteConfig.measureId || '';
    const enableTracking = siteConfig.enableTracking || false;
    const enableAnonymization = siteConfig.enableAnonymization || false;

    if (!measurementID || !enableTracking) {
        return res;
    }

    if (req.mode !== 'live') {
        return res;
    }

    let snippet = `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementID}"></script>
        <script>
            window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${measurementID}');`

    if (enableAnonymization) {
        snippet += `gtag('config','${measurementID}',{'anonymize_ip':true});`;
    }
    snippet += "</script>";

    const headEnd = res.pageContributions.headEnd;
    if (!headEnd) {
        res.pageContributions.headEnd = [];
    }
    else if (typeof (headEnd) == 'string') {
        res.pageContributions.headEnd = [headEnd];
    }

    res.pageContributions.headEnd.push(snippet);
    return res;
};
