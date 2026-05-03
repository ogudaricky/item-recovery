from rest_framework import permissions


class IsOwnerOrStaff(permissions.BasePermission):
    """Allow staff/superuser or the user who created the record."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return getattr(obj, "user_id", None) == request.user.id
