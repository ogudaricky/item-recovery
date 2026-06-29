from django.urls import path

from .views import report_summary

urlpatterns = [
    path("reports/", report_summary, name="admin-report-summary"),
]
