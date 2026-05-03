from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from items.models import FoundItem, LostItem
from matches.models import ItemMatch
from matches.scoring import calculate_match_score, rebuild_matches_for_lost

User = get_user_model()


class MatchScoringTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="u1",
            email="u1@example.com",
            password="pass12345",
        )

    def test_calculate_match_score_all_rules(self):
        lost = LostItem(
            category="Electronics",
            color="black",
            location="Block A",
            date_lost=date(2026, 4, 10),
        )
        found = FoundItem(
            category="Electronics",
            color="black",
            location="Block A",
            date_found=date(2026, 4, 12),
        )
        self.assertEqual(calculate_match_score(lost, found), 100)

    def test_calculate_match_score_category_only(self):
        lost = LostItem(
            category="Books",
            color="red",
            location="North",
            date_lost=date(2026, 4, 1),
        )
        found = FoundItem(
            category="Books",
            color="blue",
            location="South",
            date_found=date(2026, 5, 1),
        )
        self.assertEqual(calculate_match_score(lost, found), 40)

    def test_rebuild_matches_respects_min_score(self):
        lost = LostItem.objects.create(
            user=self.user,
            name="Phone",
            category="Electronics",
            color="white",
            date_lost=date(2026, 4, 5),
            location="Lab 1",
        )
        FoundItem.objects.create(
            user=self.user,
            name="Gadget",
            category="Electronics",
            color="white",
            date_found=date(2026, 4, 6),
            location="Lab 1",
        )
        FoundItem.objects.create(
            user=self.user,
            name="Random",
            category="Furniture",
            color="green",
            date_found=date(2020, 1, 1),
            location="Elsewhere",
        )
        created = rebuild_matches_for_lost(lost, min_score=40)
        self.assertGreaterEqual(created, 1)
        self.assertEqual(ItemMatch.objects.filter(lost_item=lost).count(), created)


class MatchApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="loser",
            email="loser@example.com",
            password="pass12345",
        )
        self.finder = User.objects.create_user(
            username="finder",
            email="finder@example.com",
            password="pass12345",
        )
        self.lost = LostItem.objects.create(
            user=self.owner,
            name="Bottle",
            category="Other",
            color="blue",
            date_lost=date(2026, 4, 7),
            location="Gym",
        )
        self.found = FoundItem.objects.create(
            user=self.finder,
            name="Water bottle",
            category="Other",
            color="blue",
            date_found=date(2026, 4, 8),
            location="Gym",
        )
        ItemMatch.objects.create(
            lost_item=self.lost,
            found_item=self.found,
            match_score=90,
            status=ItemMatch.PENDING,
        )

    def test_list_matches_limited_for_non_staff(self):
        self.client.force_login(self.owner)
        url = reverse("itemmatch-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        self.client.force_login(self.finder)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_recompute_forbidden_for_non_owner(self):
        self.client.force_login(self.finder)
        url = reverse("itemmatch-recompute")
        response = self.client.post(url, {"lost_item": self.lost.pk}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_recompute_allowed_for_lost_owner(self):
        ItemMatch.objects.all().delete()
        self.client.force_login(self.owner)
        url = reverse("itemmatch-recompute")
        response = self.client.post(url, {"lost_item": self.lost.pk}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
