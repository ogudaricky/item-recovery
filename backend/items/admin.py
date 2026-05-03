from django.contrib import admin

from .models import FoundItem, LostItem


@admin.register(LostItem)
class LostItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "status", "date_lost", "location", "user", "created_at")
    list_filter = ("status", "category", "created_at")
    search_fields = ("name", "description", "location", "user__username", "user__email")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)


@admin.register(FoundItem)
class FoundItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "status", "date_found", "location", "user", "created_at")
    list_filter = ("status", "category", "created_at")
    search_fields = ("name", "description", "location", "user__username", "user__email")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)
