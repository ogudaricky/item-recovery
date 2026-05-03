from rest_framework import serializers

from users.serializers import UserSerializer

from .models import FoundItem, LostItem


class LostItemSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LostItem
        fields = [
            "id",
            "user",
            "name",
            "description",
            "category",
            "color",
            "date_lost",
            "location",
            "status",
            "image",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class FoundItemSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = FoundItem
        fields = [
            "id",
            "user",
            "name",
            "description",
            "category",
            "color",
            "date_found",
            "location",
            "status",
            "image",
            "created_at",
        ]
        read_only_fields = ["created_at"]
