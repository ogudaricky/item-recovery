from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FoundItemViewSet, LostItemViewSet

router = DefaultRouter()
router.register(r"items/lost", LostItemViewSet, basename="lostitem")
router.register(r"items/found", FoundItemViewSet, basename="founditem")

urlpatterns = [
    path("", include(router.urls)),
]
