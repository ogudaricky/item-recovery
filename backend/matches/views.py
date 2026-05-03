from django.db.models import Q
from django.shortcuts import get_object_or_404
from items.models import LostItem
from notifications.utils import create_notification
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ItemMatch
from .scoring import rebuild_matches_for_lost
from .serializers import ItemMatchSerializer


class ItemMatchViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ItemMatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ItemMatch.objects.select_related(
            "lost_item__user",
            "found_item__user",
        ).all()
        lost_id = self.request.query_params.get("lost_id")
        found_id = self.request.query_params.get("found_id")
        if lost_id:
            qs = qs.filter(lost_item_id=lost_id)
        if found_id:
            qs = qs.filter(found_item_id=found_id)

        user = self.request.user
        if not user.is_staff:
            qs = qs.filter(
                Q(lost_item__user=user) | Q(found_item__user=user),
            )
        return qs.order_by("-match_score", "-created_at")

    @action(detail=False, methods=["post"], url_path="recompute")
    def recompute(self, request):
        lost_item_id = request.data.get("lost_item") or request.query_params.get("lost_id")
        if lost_item_id is None:
            return Response(
                {"detail": "Provide lost_item (body) or lost_id (query)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lost_item = get_object_or_404(LostItem, pk=lost_item_id)
        if not (request.user.is_staff or lost_item.user_id == request.user.id):
            return Response(status=status.HTTP_403_FORBIDDEN)

        count = rebuild_matches_for_lost(lost_item)
        if count:
            create_notification(
                lost_item.user,
                f'{count} potential match(es) found for your lost item "{lost_item.name}".',
            )
        matches = (
            ItemMatch.objects.select_related("lost_item__user", "found_item__user")
            .filter(lost_item=lost_item)
            .order_by("-match_score", "-created_at")
        )
        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
