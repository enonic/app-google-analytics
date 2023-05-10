package com.enonic.app.analytics.report.auth;

import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

import com.google.analytics.data.v1beta.*;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;

public class GoogleAuthServiceAccount implements ScriptBean {
    private static final Logger log  = LoggerFactory.getLogger(GoogleAuthServiceAccount.class);

    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    private static final String APPLICATION_NAME = "Enonic google Analytics data widget";
    public void initialize(BeanContext context) {

    }

    private BetaAnalyticsDataClient initializeAnalytics(String credentialPath) throws Exception {
        if (credentialPath == null || credentialPath.isEmpty()) {
            log.warn("Missing path to credentials file in app configuration");
            throw new Exception("No credentialsFile provided");
        }

        Path credentialFile = Paths.get(credentialPath);
        GoogleCredentials credentials = ServiceAccountCredentials.fromStream(
                Files.newInputStream(credentialFile)
        );

        BetaAnalyticsDataSettings clientSettings = BetaAnalyticsDataSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                .build();

        BetaAnalyticsDataClient analyticsData;
        try {
             analyticsData = BetaAnalyticsDataClient.create(clientSettings);
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }

        return analyticsData;
    }

    public String authenticate(String analyticsCode, String credentialPath) throws Exception {
        //TODO check analyticsCode and credentialPath for empty, null, missing

        DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
//        String currentDate = formatter.format(new Date());
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.YEAR, -1);
        String previousYear = formatter.format(cal.getTime());

        RunReportRequest request =
                RunReportRequest.newBuilder()
                        .setProperty("properties/" + analyticsCode)
                        .addDimensions(Dimension.newBuilder().setName("country"))
                        .addDimensions(Dimension.newBuilder().setName("date"))
                        .addMetrics(Metric.newBuilder().setName("activeUsers"))
                        .addDateRanges(
                                DateRange.newBuilder()
                                        .setStartDate(previousYear)
                                        .setEndDate("today")
                        )
                        .build();

        final BetaAnalyticsDataClient analyticsData = initializeAnalytics(credentialPath);
        PrettyReportData reportOut;
        try (analyticsData) {
            RunReportResponse response = analyticsData.runReport(request);

            reportOut = new PrettyReportData();

            for (DimensionHeader diHead : response.getDimensionHeadersList()) {
                reportOut.addDimensionHeader(diHead.getName());
            }
            for (MetricHeader metHead : response.getMetricHeadersList()) {
                reportOut.addMetricHeader(metHead.getName());
            }
            for (Row row : response.getRowsList()) {
                RowObject rowValues = new RowObject();
                for (int i = 0; i>row.getDimensionValuesCount(); i++) {
                    rowValues.dimensionValues.add(
                            new ReportValue(row.getDimensionValues(i).getValue())
                    );
                }
                for (int j = 0; j>row.getMetricValuesCount(); j++) {
                    rowValues.metricValues.add(
                            new ReportValue(row.getDimensionValues(j).getValue())
                    );
                }

                reportOut.reportRow.add(rowValues);
            }
        }

        log.info(gson.toJson(reportOut));

        return ":D";
    }

    class PrettyReportData {
        private ArrayList<String> dimentions = new ArrayList<String>();
        private ArrayList<String> metrics = new ArrayList<String>();
        private ArrayList<RowObject> reportRow = new ArrayList<RowObject>();

        public void addMetricHeader(String header) {
            metrics.add(header);
        }

        public void addDimensionHeader(String header) {
            dimentions.add(header);
        }

        public void addRow(RowObject nextRow) {
            reportRow.add(nextRow);
        }
    }

    class ReportValue {
        private String value;
        ReportValue(String value) {
            this.value = value;
        }
    }

    class RowObject {
        public ArrayList<ReportValue> dimensionValues = new ArrayList<ReportValue>();
        public ArrayList<ReportValue> metricValues = new ArrayList<ReportValue>();
    }
}
