from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


class LostItem(models.Model):
    ACTIVE = "active"
    RESOLVED = "resolved"
    STATUS_CHOICES = [
        (ACTIVE, "Active"),
        (RESOLVED, "Resolved"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lost_items",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=120)
    color = models.CharField(max_length=80, blank=True)
    date_lost = models.DateField()
    location = models.CharField(max_length=200)
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=ACTIVE,
    )
    image = models.FileField(
        upload_to="lost_items/%Y/%m/",
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp", "gif"]),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Lost: {self.name} ({self.status})"


class FoundItem(models.Model):
    UNCLAIMED = "unclaimed"
    CLAIMED = "claimed"
    STATUS_CHOICES = [
        (UNCLAIMED, "Unclaimed"),
        (CLAIMED, "Claimed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="found_items",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=120)
    color = models.CharField(max_length=80, blank=True)
    date_found = models.DateField()
    location = models.CharField(max_length=200)
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=UNCLAIMED,
    )
    image = models.FileField(
        upload_to="found_items/%Y/%m/",
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp", "gif"]),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Found: {self.name} ({self.status})"
