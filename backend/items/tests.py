from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import FoundItem, LostItem

User = get_user_model()


class LostFoundItemApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="pass12345",
        )
        self.other = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="pass12345",
        )
        self.staff = User.objects.create_user(
            username="staffer",
            email="staff@example.com",
            password="pass12345",
            is_staff=True,
        )

    def test_create_lost_requires_authentication(self):
        url = reverse("lostitem-list")
        response = self.client.post(
            url,
            {
                "name": "Wallet",
                "description": "Brown leather",
                "category": "accessories",
                "color": "brown",
                "date_lost": str(date(2026, 4, 1)),
                "location": "Library",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_and_list_lost_item(self):
        self.client.force_login(self.owner)
        url = reverse("lostitem-list")
        payload = {
            "name": "Wallet",
            "description": "Brown leather",
            "category": "accessories",
            "color": "brown",
            "date_lost": str(date(2026, 4, 1)),
            "location": "Library",
        }
        create = self.client.post(url, payload, format="json")
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create.data["name"], "Wallet")
        self.assertEqual(create.data["user"]["username"], "owner")

        listed = self.client.get(url, format="json")
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(listed.data), 1)

    def test_owner_can_patch_lost_item_non_staff_cannot_patch_others(self):
        lost = LostItem.objects.create(
            user=self.owner,
            name="Keys",
            category="other",
            color="silver",
            date_lost=date(2026, 4, 2),
            location="Parking",
        )
        url = reverse("lostitem-detail", args=[lost.pk])

        self.client.force_login(self.other)
        response = self.client.patch(url, {"name": "Stolen keys"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_login(self.owner)
        response = self.client.patch(url, {"status": LostItem.RESOLVED}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], LostItem.RESOLVED)

    def test_staff_can_patch_any_lost_item(self):
        lost = LostItem.objects.create(
            user=self.owner,
            name="ID card",
            category="documents",
            color="",
            date_lost=date(2026, 4, 3),
            location="Admin",
        )
        self.client.force_login(self.staff)
        url = reverse("lostitem-detail", args=[lost.pk])
        response = self.client.patch(url, {"status": LostItem.RESOLVED}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_found_item_and_filter_by_status(self):
        self.client.force_login(self.owner)
        url = reverse("founditem-list")
        payload = {
            "name": "Umbrella",
            "description": "Black",
            "category": "other",
            "color": "black",
            "date_found": str(date(2026, 4, 4)),
            "location": "Cafeteria",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        filtered = self.client.get(url, {"status": FoundItem.UNCLAIMED})
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertTrue(
            any(row["name"] == "Umbrella" for row in filtered.data),
        )
