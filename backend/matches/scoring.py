from django.db import transaction

from items.models import FoundItem, LostItem


def calculate_match_score(lost_item: LostItem, found_item: FoundItem) -> int:
    score = 0
    if lost_item.category.strip().lower() == found_item.category.strip().lower():
        score += 40
    if lost_item.color.strip().lower() == found_item.color.strip().lower():
        score += 30
    if lost_item.location.strip().lower() == found_item.location.strip().lower():
        score += 20
    days_diff = abs((found_item.date_found - lost_item.date_lost).days)
    if days_diff <= 7:
        score += 10
    return min(score, 100)


@transaction.atomic
def rebuild_matches_for_lost(lost_item: LostItem, *, min_score: int = 40) -> int:
    """
    Replace all stored matches for this lost item with current candidates.
    Returns the number of matches created.
    """
    from .models import ItemMatch

    ItemMatch.objects.filter(lost_item=lost_item).delete()
    created = 0
    for found_item in FoundItem.objects.filter(status=FoundItem.UNCLAIMED).iterator():
        match_score = calculate_match_score(lost_item, found_item)
        if match_score >= min_score:
            ItemMatch.objects.create(
                lost_item=lost_item,
                found_item=found_item,
                match_score=match_score,
                status=ItemMatch.PENDING,
            )
            created += 1
    return created
