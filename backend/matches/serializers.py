from rest_framework import serializers

from items.serializers import FoundItemSerializer, LostItemSerializer

from .models import ItemMatch


class ItemMatchSerializer(serializers.ModelSerializer):
    lost_item = LostItemSerializer(read_only=True)
    found_item = FoundItemSerializer(read_only=True)

    class Meta:
        model = ItemMatch
        fields = [
            "id",
            "lost_item",
            "found_item",
            "match_score",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "lost_item",
            "found_item",
            "match_score",
            "status",
            "created_at",
        ]
