from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ItemClaim
from items.models import FoundItem, LostItem
from matches.models import ItemMatch

User = get_user_model()


class ItemClaimApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="claimant",
            email="claimant@example.com",
            password="pass12345",
        )
        self.finder = User.objects.create_user(
            username="finder2",
            email="finder2@example.com",
            password="pass12345",
        )
        self.staff = User.objects.create_user(
            username="adminstaff",
            email="adminstaff@example.com",
            password="pass12345",
            is_staff=True,
        )
        self.lost = LostItem.objects.create(
            user=self.owner,
            name="Watch",
            category="accessories",
            color="gold",
            date_lost=date(2026, 4, 9),
            location="Hall",
        )
        self.found = FoundItem.objects.create(
            user=self.finder,
            name="Gold watch",
            category="accessories",
            color="gold",
            date_found=date(2026, 4, 9),
            location="Hall",
        )
        self.match = ItemMatch.objects.create(
            lost_item=self.lost,
            found_item=self.found,
            match_score=95,
            status=ItemMatch.PENDING,
        )

    def test_create_claim_only_lost_owner(self):
        url = reverse("itemclaim-list")
        self.client.force_login(self.finder)
        response = self.client.post(url, {"match": self.match.pk}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_login(self.owner)
        response = self.client.post(url, {"match": self.match.pk}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], ItemClaim.PENDING)

    def test_verify_approve_updates_related_records(self):
        claim = ItemClaim.objects.create(
            claimant=self.owner,
            match=self.match,
            status=ItemClaim.PENDING,
        )
        self.client.force_login(self.staff)
        url = reverse("itemclaim-verify", args=[claim.pk])
        response = self.client.post(url, {"decision": "approved"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.match.refresh_from_db()
        self.found.refresh_from_db()
        self.lost.refresh_from_db()
        self.assertEqual(self.match.status, ItemMatch.CLAIMED)
        self.assertEqual(self.found.status, FoundItem.CLAIMED)
        self.assertEqual(self.lost.status, LostItem.RESOLVED)
        claim.refresh_from_db()
        self.assertEqual(claim.status, ItemClaim.APPROVED)

    def test_verify_rejected_does_not_close_match(self):
        claim = ItemClaim.objects.create(
            claimant=self.owner,
            match=self.match,
            status=ItemClaim.PENDING,
        )
        self.client.force_login(self.staff)
        url = reverse("itemclaim-verify", args=[claim.pk])
        response = self.client.post(url, {"decision": "rejected"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.match.refresh_from_db()
        self.assertEqual(self.match.status, ItemMatch.PENDING)
        claim.refresh_from_db()
        self.assertEqual(claim.status, ItemClaim.REJECTED)

    def test_verify_requires_staff(self):
        claim = ItemClaim.objects.create(
            claimant=self.owner,
            match=self.match,
            status=ItemClaim.PENDING,
        )
        self.client.force_login(self.owner)
        url = reverse("itemclaim-verify", args=[claim.pk])
        response = self.client.post(url, {"decision": "approved"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
