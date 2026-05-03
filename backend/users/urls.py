from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .auth_views import login_view, logout_view
from .views import UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("auth/login/", login_view, name="user-login"),
    path("auth/logout/", logout_view, name="user-logout"),
    path("", include(router.urls)),
]