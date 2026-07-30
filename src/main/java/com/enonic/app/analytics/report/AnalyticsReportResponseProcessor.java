package com.enonic.app.analytics.report;

import org.osgi.service.component.annotations.Component;

import com.enonic.xp.admin.extension.AdminExtensionResponseProcessor;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalResponse;

/**
 * Adds the Google hosts needed by the analytics-report widget to the Content-Security-Policy of the
 * admin tool pages hosting it: the widget's client script loads Google Charts (scripts and styles from
 * gstatic), which fetches report data from googleapis and loads chart/map images.
 */
@Component(immediate = true)
public class AnalyticsReportResponseProcessor
    implements AdminExtensionResponseProcessor
{
    private static final DescriptorKey EXTENSION_KEY = DescriptorKey.from( "com.enonic.app.ga:analytics-report" );

    @Override
    public DescriptorKey getExtensionKey()
    {
        return EXTENSION_KEY;
    }

    @Override
    public PortalResponse process( final PortalRequest request, final PortalResponse response )
    {
        request.getContentSecurityPolicy()
            .scriptSrc( "https://www.gstatic.com" )
            .styleSrc( "https://www.gstatic.com" )
            .connectSrc( "https://www.googleapis.com", "https://maps.googleapis.com" )
            .imgSrc( "https://www.gstatic.com", "https://maps.googleapis.com", "https://maps.gstatic.com" )
            .fontSrc( "https://fonts.gstatic.com" );
        return response;
    }
}
