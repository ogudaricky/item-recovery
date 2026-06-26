from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Custom permission to only allow users with 'admin' role to access the view.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated and has admin role
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'admin'
        )

    def has_object_permission(self, request, view, obj):
        # Object-level permissions - for now same as has_permission
        return self.has_permission(request, view)