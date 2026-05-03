from rest_framework import mixins, permissions, viewsets

from .models import Notification
from .permissions import IsNotificationRecipient
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotificationRecipient]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        unread = self.request.query_params.get("unread")
        if unread is not None and str(unread).lower() in ("1", "true", "yes"):
            qs = qs.filter(is_read=False)
        return qs.order_by("-created_at")
