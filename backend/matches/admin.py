from django.contrib import admin

from .models import ItemMatch


@admin.register(ItemMatch)
class ItemMatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lost_item",
        "found_item",
        "match_score",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "lost_item__name",
        "found_item__name",
        "lost_item__user__username",
        "found_item__user__username",
    )
    readonly_fields = ("created_at",)
    ordering = ("-match_score", "-created_at")
