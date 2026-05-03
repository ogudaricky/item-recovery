from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Notification

User = get_user_model()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notif_user",
            email="notif@example.com",
            password="pass12345",
        )
        self.other = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="pass12345",
        )

    def test_list_shows_only_own_notifications(self):
        Notification.objects.create(user=self.user, message="Mine")
        Notification.objects.create(user=self.other, message="Not yours")

        self.client.force_login(self.user)
        url = reverse("notification-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["message"], "Mine")

    def test_unread_query_param_filters(self):
        Notification.objects.create(user=self.user, message="A", is_read=True)
        Notification.objects.create(user=self.user, message="B", is_read=False)

        self.client.force_login(self.user)
        url = reverse("notification-list")
        response = self.client.get(url, {"unread": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["message"], "B")

    def test_patch_mark_read(self):
        note = Notification.objects.create(user=self.user, message="Read me", is_read=False)
        self.client.force_login(self.user)
        url = reverse("notification-detail", args=[note.pk])
        response = self.client.patch(url, {"is_read": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        note.refresh_from_db()
        self.assertTrue(note.is_read)

    def test_cannot_access_other_users_notification(self):
        note = Notification.objects.create(user=self.other, message="Private")
        self.client.force_login(self.user)
        url = reverse("notification-detail", args=[note.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
