from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ItemMatchViewSet

router = DefaultRouter()
router.register(r"matches", ItemMatchViewSet, basename="itemmatch")

urlpatterns = [
    path("", include(router.urls)),
]
