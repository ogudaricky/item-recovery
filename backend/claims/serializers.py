from rest_framework import serializers

from matches.models import ItemMatch
from matches.serializers import ItemMatchSerializer
from users.serializers import UserSerializer

from .models import ItemClaim


class ItemClaimSerializer(serializers.ModelSerializer):
    claimant = UserSerializer(read_only=True)
    verified_by = UserSerializer(read_only=True)
    match = ItemMatchSerializer(read_only=True)

    class Meta:
        model = ItemClaim
        fields = [
            "id",
            "claimant",
            "match",
            "status",
            "verification_method",
            "verified_by",
            "verified_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "claimant",
            "match",
            "status",
            "verification_method",
            "verified_by",
            "verified_at",
            "created_at",
        ]


class ItemClaimCreateSerializer(serializers.ModelSerializer):
    match = serializers.PrimaryKeyRelatedField(queryset=ItemMatch.objects.all())

    class Meta:
        model = ItemClaim
        fields = ["match"]

    def validate(self, attrs):
        request = self.context.get("request")
        match = attrs["match"]
        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        if match.lost_item.user_id != request.user.id:
            raise serializers.ValidationError(
                {"match": "Only the reporter of the lost item can claim this match."},
            )
        if match.status != ItemMatch.PENDING:
            raise serializers.ValidationError(
                {"match": "This match is not open for new claims."},
            )
        from items.models import FoundItem

        if match.found_item.status != FoundItem.UNCLAIMED:
            raise serializers.ValidationError(
                {"match": "This found item is no longer available."},
            )
        if ItemClaim.objects.filter(match=match, status=ItemClaim.PENDING).exists():
            raise serializers.ValidationError(
                {"match": "A pending claim already exists for this match."},
            )
        if ItemClaim.objects.filter(match=match, status=ItemClaim.APPROVED).exists():
            raise serializers.ValidationError(
                {"match": "This match has already been approved."},
            )
        return attrs
