from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "message_preview", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("message", "user__username", "user__email")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)

    @admin.display(description="Message")
    def message_preview(self, obj):
        text = (obj.message or "")[:80]
        return f"{text}…" if len(obj.message or "") > 80 else text
