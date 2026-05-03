from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "is_active",
    )
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "campus_id")
    ordering = ("username",)
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Custom fields", {"fields": ("role", "department", "phone_number", "campus_id", "profile_image")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Custom fields", {"fields": ("role", "department", "phone_number", "campus_id", "profile_image")}),
    )
