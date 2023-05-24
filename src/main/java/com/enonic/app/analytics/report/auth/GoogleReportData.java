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

public class GoogleReportData implements ScriptBean {
    private static final Logger log = LoggerFactory.getLogger(GoogleReportData.class);

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

    public String runSiteReports(String analyticsCode, String credentialPath) throws Exception {
        DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MONTH, -1);
        String previous = formatter.format(cal.getTime());

        BatchRunReportsRequest request =
                BatchRunReportsRequest.newBuilder()
                        .setProperty("properties/" + analyticsCode)
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("country"))
                                        .addMetrics(Metric.newBuilder().setName("activeUsers"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        ))
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("date"))
                                        .addMetrics(Metric.newBuilder().setName("activeUsers"))
                                        .addMetrics(Metric.newBuilder().setName("newUsers"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        )
                                        .addOrderBys(
                                                OrderBy.newBuilder().setDimension(
                                                                OrderBy.DimensionOrderBy.newBuilder()
                                                                        .setDimensionName("date")
                                                        )
                                                        .setDesc(true)
                                        )
                                        .setKeepEmptyRows(true))
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("platformDeviceCategory"))
                                        .addMetrics(Metric.newBuilder().setName("sessions"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        ))
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("browser"))
                                        .addMetrics(Metric.newBuilder().setName("sessions"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        ))

                        .build();

        BatchRunReportsRequest secondRequest =
                BatchRunReportsRequest.newBuilder()
                        .setProperty("properties/" + analyticsCode)
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("pagePath"))
                                        .addMetrics(Metric.newBuilder().setName("screenPageViews"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        )
                                        .addOrderBys(
                                                OrderBy.newBuilder().setDimension(
                                                                OrderBy.DimensionOrderBy.newBuilder()
                                                                        .setDimensionName("screenPageViews")
                                                        )
                                                        .setDesc(true)
                                        )
                                        .setLimit(30)
                        )
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("pageReferrer"))
                                        .addMetrics(Metric.newBuilder().setName("activeUsers"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        )
                                        .addOrderBys(
                                                OrderBy.newBuilder().setDimension(
                                                                OrderBy.DimensionOrderBy.newBuilder()
                                                                        .setDimensionName("activeUsers")
                                                        )
                                                        .setDesc(true))
                                        .setLimit(30)
                        )
                        .build();

        final BetaAnalyticsDataClient analyticsDataBatch = initializeAnalytics(credentialPath);

        final BetaAnalyticsDataClient analyticsDataSecondBatch = initializeAnalytics(credentialPath);

        ArrayList<PrettyReportData> allReports;

        try (analyticsDataBatch; analyticsDataSecondBatch) {
            BatchRunReportsResponse batchResponse = analyticsDataBatch.batchRunReports(request);
            allReports = analyticsDataToJson(batchResponse);


            BatchRunReportsResponse secondBatchResponse = analyticsDataBatch.batchRunReports(secondRequest);
            allReports.addAll(analyticsDataToJson(secondBatchResponse));
        }

        return gson.toJson(allReports);
    }

    public String runPageReports(String analyticsCode, String credentialPath, String pagePath) throws Exception {
        DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MONTH, -1);
        String previous = formatter.format(cal.getTime());

        BatchRunReportsRequest request =
                BatchRunReportsRequest.newBuilder()
                        .setProperty("properties/" + analyticsCode)
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("date"))
                                        .addMetrics(Metric.newBuilder().setName("activeUsers"))
                                        .addMetrics(Metric.newBuilder().setName("newUsers"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        )
                                        .setDimensionFilter(
                                                FilterExpression.newBuilder()
                                                        .setFilter(
                                                                Filter.newBuilder()
                                                                        .setFieldName("pagePath")
                                                                        .setStringFilter(
                                                                                Filter.StringFilter.newBuilder()
                                                                                        .setValue(pagePath)
                                                                        )
                                                        )
                                        )
                                        .addOrderBys(
                                                OrderBy.newBuilder().setDimension(
                                                                OrderBy.DimensionOrderBy.newBuilder()
                                                                        .setDimensionName("date")
                                                        )
                                                        .setDesc(false)
                                        )
                                        .setKeepEmptyRows(true)
                        )
                        .addRequests(
                                RunReportRequest.newBuilder()
                                        .addDimensions(Dimension.newBuilder().setName("newVsReturning"))
                                        .addMetrics(Metric.newBuilder().setName("sessions"))
                                        .addDateRanges(
                                                DateRange.newBuilder()
                                                        .setStartDate(previous)
                                                        .setEndDate("today")
                                        )
                                        .setDimensionFilter(
                                                FilterExpression.newBuilder()
                                                        .setFilter(
                                                                Filter.newBuilder()
                                                                        .setFieldName("pagePath")
                                                                        .setStringFilter(
                                                                                Filter.StringFilter.newBuilder()
                                                                                        .setValue(pagePath)
                                                                        )
                                                        )
                                        )
                        )
                        .build();

        final BetaAnalyticsDataClient analyticsDataBatch = initializeAnalytics(credentialPath);

        ArrayList<PrettyReportData> allReports;

        try (analyticsDataBatch) {
            BatchRunReportsResponse batchResponse = analyticsDataBatch.batchRunReports(request);

            allReports = analyticsDataToJson(batchResponse);
        }

        return gson.toJson(allReports);
    }

    ArrayList<PrettyReportData> analyticsDataToJson(BatchRunReportsResponse batchResponse) {
        ArrayList<PrettyReportData> allReports = new ArrayList<PrettyReportData>(1);

            for (RunReportResponse response : batchResponse.getReportsList()) {

                PrettyReportData reportData = new PrettyReportData();

                for (DimensionHeader diHead : response.getDimensionHeadersList()) {
                    reportData.dimensions.add(diHead.getName());
                }
                for (MetricHeader metHead : response.getMetricHeadersList()) {
                    reportData.metrics.add(metHead.getName());
                }
                for (Row row : response.getRowsList()) {
                    RowObject rowValues = new RowObject();
                    for (int i = 0; i < row.getDimensionValuesCount(); i++) {
                        String value = row.getDimensionValues(i).getValue();
                        rowValues.dimensionValues.add(
                                new ReportValue(row.getDimensionValues(i).getValue())
                        );
                    }
                    for (int j = 0; j < row.getMetricValuesCount(); j++) {
                        rowValues.metricValues.add(
                                new ReportValue(row.getMetricValues(j).getValue())
                        );
                    }

                    reportData.reportRow.add(rowValues);
                }

                allReports.add(reportData);
            }

        return allReports;
    }

    static class PrettyReportData {
        ArrayList<String> dimensions = new ArrayList<>();
        ArrayList<String> metrics = new ArrayList<>();
        ArrayList<RowObject> reportRow = new ArrayList<>();
    }

    static class ReportValue {
        String value = null;

        ReportValue(String valueInn) {
            value = valueInn;
        }
    }

    static class RowObject {
        ArrayList<ReportValue> dimensionValues = new ArrayList<>();
        ArrayList<ReportValue> metricValues = new ArrayList<>();
    }
}
