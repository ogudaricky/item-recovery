from django.conf import settings
from django.db import models

from matches.models import ItemMatch


class ItemClaim(models.Model):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]

    ADMIN_REVIEW = "admin_review"
    SECURITY_QUESTION = "security_question"
    VERIFICATION_METHOD_CHOICES = [
        (ADMIN_REVIEW, "Admin review"),
        (SECURITY_QUESTION, "Security question"),
    ]

    claimant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="item_claims",
    )
    match = models.ForeignKey(
        ItemMatch,
        on_delete=models.CASCADE,
        related_name="claims",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=PENDING,
    )
    verification_method = models.CharField(
        max_length=32,
        choices=VERIFICATION_METHOD_CHOICES,
        default=ADMIN_REVIEW,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_item_claims",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Claim {self.pk} ({self.status}) — match {self.match_id}"
