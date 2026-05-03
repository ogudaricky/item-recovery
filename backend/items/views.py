from rest_framework import permissions, viewsets

from .models import FoundItem, LostItem
from .permissions import IsOwnerOrStaff
from .serializers import FoundItemSerializer, LostItemSerializer


class LostItemViewSet(viewsets.ModelViewSet):
    serializer_class = LostItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = LostItem.objects.select_related("user").all()
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category__iexact=category)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FoundItemViewSet(viewsets.ModelViewSet):
    serializer_class = FoundItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = FoundItem.objects.select_related("user").all()
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category__iexact=category)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
