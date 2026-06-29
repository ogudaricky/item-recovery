from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from items.models import FoundItem, LostItem
from matches.models import ItemMatch
from claims.models import ItemClaim

User = get_user_model()

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def report_summary(request):
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    inactive_users = total_users - active_users

    total_lost_items = LostItem.objects.count()
    total_found_items = FoundItem.objects.count()
    total_matches = ItemMatch.objects.count()
    total_claims = ItemClaim.objects.count()

    match_status = {
        row["status"]: row["count"]
        for row in ItemMatch.objects.values("status").annotate(count=Count("pk"))
    }
    claim_status = {
        row["status"]: row["count"]
        for row in ItemClaim.objects.values("status").annotate(count=Count("pk"))
    }
    user_roles = {
        row["role"]: row["count"]
        for row in User.objects.values("role").annotate(count=Count("pk"))
    }

    return Response({
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "total_lost_items": total_lost_items,
        "total_found_items": total_found_items,
        "total_matches": total_matches,
        "total_claims": total_claims,
        "match_status": match_status,
        "claim_status": claim_status,
        "user_roles": user_roles,
    })
