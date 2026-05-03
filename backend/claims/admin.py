from django.contrib import admin

from .models import ItemClaim


@admin.register(ItemClaim)
class ItemClaimAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "claimant",
        "match",
        "status",
        "verification_method",
        "verified_by",
        "verified_at",
        "created_at",
    )
    list_filter = ("status", "verification_method", "created_at")
    search_fields = (
        "claimant__username",
        "claimant__email",
        "match__lost_item__name",
        "match__found_item__name",
    )
    readonly_fields = ("created_at", "verified_at")
    ordering = ("-created_at",)
