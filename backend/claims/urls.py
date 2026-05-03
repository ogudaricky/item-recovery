from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ItemClaimViewSet

router = DefaultRouter()
router.register(r"claims", ItemClaimViewSet, basename="itemclaim")

urlpatterns = [
    path("", include(router.urls)),
]
