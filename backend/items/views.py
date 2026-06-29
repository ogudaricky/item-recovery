from rest_framework import permissions, viewsets, pagination
from django.db.models import Q

from .models import FoundItem, LostItem
from .permissions import IsOwnerOrStaff
from .serializers import FoundItemSerializer, LostItemSerializer


class LostItemViewSet(viewsets.ModelViewSet):
    serializer_class = LostItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = pagination.PageNumberPagination

    def get_queryset(self):
        qs = LostItem.objects.select_related("user").all()
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        date_lost_gte = self.request.query_params.get("date_lost__gte")
        date_lost_lte = self.request.query_params.get("date_lost__lte")
        search = self.request.query_params.get("search")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category__iexact=category)
        if date_lost_gte:
            qs = qs.filter(date_lost__gte=date_lost_gte)
        if date_lost_lte:
            qs = qs.filter(date_lost__lte=date_lost_lte)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
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
    pagination_class = pagination.PageNumberPagination

    def get_queryset(self):
        qs = FoundItem.objects.select_related("user").all()
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        date_found_gte = self.request.query_params.get("date_found__gte")
        date_found_lte = self.request.query_params.get("date_found__lte")
        search = self.request.query_params.get("search")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category__iexact=category)
        if date_found_gte:
            qs = qs.filter(date_found__gte=date_found_gte)
        if date_found_lte:
            qs = qs.filter(date_found__lte=date_found_lte)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)