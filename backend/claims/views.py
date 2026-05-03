from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from items.models import FoundItem, LostItem
from matches.models import ItemMatch
from notifications.utils import create_notification
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ItemClaim
from .permissions import IsClaimantOrStaff, IsStaff
from .serializers import ItemClaimCreateSerializer, ItemClaimSerializer

User = get_user_model()


class ItemClaimViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ItemClaim.objects.select_related(
            "claimant",
            "verified_by",
            "match__lost_item__user",
            "match__found_item__user",
        ).all()
        user = self.request.user
        if not user.is_staff:
            qs = qs.filter(claimant=user)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return ItemClaimCreateSerializer
        return ItemClaimSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        claim = serializer.instance
        output = ItemClaimSerializer(claim, context={"request": request})
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_permissions(self):
        if self.action == "verify":
            return [permissions.IsAuthenticated(), IsStaff()]
        if self.action in ("retrieve",):
            return [permissions.IsAuthenticated(), IsClaimantOrStaff()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(
            claimant=self.request.user,
            verification_method=ItemClaim.ADMIN_REVIEW,
        )
        claim = serializer.instance
        lost_name = claim.match.lost_item.name
        for staff in User.objects.filter(is_staff=True):
            create_notification(
                staff,
                f'New claim #{claim.pk} pending review (lost item: "{lost_name}").',
            )

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        claim = self.get_object()
        if claim.status != ItemClaim.PENDING:
            return Response(
                {"detail": "Only pending claims can be verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        decision = request.data.get("decision")
        if decision not in ("approved", "rejected"):
            return Response(
                {"detail": 'decision must be "approved" or "rejected".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        claimant = claim.claimant
        finder = claim.match.found_item.user
        found_name = claim.match.found_item.name
        if decision == "rejected":
            with transaction.atomic():
                claim.status = ItemClaim.REJECTED
                claim.verified_by = request.user
                claim.verified_at = now
                claim.save(update_fields=["status", "verified_by", "verified_at"])
        else:
            match = claim.match
            with transaction.atomic():
                claim.status = ItemClaim.APPROVED
                claim.verified_by = request.user
                claim.verified_at = now
                claim.save(update_fields=["status", "verified_by", "verified_at"])

                ItemMatch.objects.filter(pk=match.pk).update(status=ItemMatch.CLAIMED)
                FoundItem.objects.filter(pk=match.found_item_id).update(
                    status=FoundItem.CLAIMED,
                )
                LostItem.objects.filter(pk=match.lost_item_id).update(
                    status=LostItem.RESOLVED,
                )

        if decision == "rejected":
            create_notification(
                claimant,
                "Your claim was rejected by an administrator.",
            )
        else:
            create_notification(
                claimant,
                "Your claim was approved. Follow campus procedures to collect your item.",
            )
            create_notification(
                finder,
                f'Your found item "{found_name}" was matched and resolved.',
            )

        fresh = self.get_queryset().get(pk=claim.pk)
        serializer = ItemClaimSerializer(fresh, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
