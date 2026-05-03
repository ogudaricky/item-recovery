def create_notification(user, message: str):
    """Create an in-app notification for the given user."""
    from .models import Notification

    return Notification.objects.create(user=user, message=message)
