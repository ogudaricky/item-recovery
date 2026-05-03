from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from items.models import FoundItem, LostItem


class ItemMatch(models.Model):
    PENDING = "pending"
    VERIFIED = "verified"
    CLAIMED = "claimed"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (VERIFIED, "Verified"),
        (CLAIMED, "Claimed"),
    ]

    lost_item = models.ForeignKey(
        LostItem,
        on_delete=models.CASCADE,
        related_name="item_matches",
    )
    found_item = models.ForeignKey(
        FoundItem,
        on_delete=models.CASCADE,
        related_name="item_matches",
    )
    match_score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-match_score", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["lost_item", "found_item"],
                name="matches_itemmatch_unique_lost_found",
            ),
        ]

    def __str__(self):
        return f"Match {self.lost_item_id}↔{self.found_item_id} ({self.match_score})"
