package com.enonic.app.analytics.report.auth;

import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.analyticsdata.v1beta.AnalyticsData;
import com.google.api.services.analyticsdata.v1beta.AnalyticsDataRequest;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.gson.Gson;
import org.apache.commons.io.FileExistsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class GoogleAuthServiceAccount implements ScriptBean {
    private static final Logger log  = LoggerFactory.getLogger(GoogleAuthServiceAccount.class);
    public void initialize(BeanContext context) {

    }

    public String authenticate(String credentialPath) throws Exception {
        Gson gson = new Gson();

        if (credentialPath == null) {
            log.warn("Missing path to credentials file in app configuration");
        }

        Path credentialFile = Paths.get(credentialPath);
        GoogleCredentials credentials = null;
        try {
            credentials = GoogleCredentials.fromStream(
                    Files.newInputStream(credentialFile)
            );
        } catch (FileExistsException e) {
            log.error("File exception " + e.getMessage());
        } catch (Exception e) {
            log.error("Authentication error " + e.getMessage());
        }

        credentials.refreshIfExpired();
        AccessToken token = credentials.getAccessToken();
        AnalyticsData data = new AnalyticsData(
                GoogleNetHttpTransport.newTrustedTransport(),
                new GsonFactory(),
                request -> {
                    log.info("Request callback?");
                    log.info(request.getContent().toString());
                }
        );
        AnalyticsDataRequest widgetRequest = new AnalyticsDataRequest(
                data,
                "GET", //todo posting later
                

        );
        data.

        /*(
                GoogleNetHttpTransport.newTrustedTransport(),
                new GsonFactory(),
        );*/

        return "credentials created";
    }


}
