from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class UserApiTests(APITestCase):
    def test_signup_creates_user(self):
        url = reverse("user-list")
        data = {
            "username": "student1",
            "email": "student1@example.com",
            "password": "strongpass123",
            "first_name": "Student",
            "last_name": "One",
            "role": "student",
            "department": "Computer Science",
            "phone_number": "1234567890",
            "campus_id": "S1001",
            "profile_image": "https://example.com/avatar.png",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="student1").exists())
        self.assertNotIn("password", response.data)

    def test_me_requires_authentication(self):
        url = reverse("user-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_me_returns_authenticated_user(self):
        user = User.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="strongpass123",
        )
        self.client.force_login(user)
        url = reverse("user-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "student2")

    def test_list_requires_admin(self):
        user = User.objects.create_user(
            username="student3",
            email="student3@example.com",
            password="strongpass123",
        )
        self.client.force_login(user)
        url = reverse("user-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_users(self):
        admin = User.objects.create_superuser(
            username="admin1",
            email="admin1@example.com",
            password="strongpass123",
        )
        self.client.force_login(admin)
        url = reverse("user-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)

    def test_login_endpoint_returns_user(self):
        user = User.objects.create_user(
            username="student4",
            email="student4@example.com",
            password="strongpass123",
        )
        url = reverse("user-login")
        response = self.client.post(url, {"username": "student4", "password": "strongpass123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "student4")

    def test_logout_endpoint_requires_authentication(self):
        user = User.objects.create_user(
            username="student5",
            email="student5@example.com",
            password="strongpass123",
        )
        self.client.force_login(user)
        url = reverse("user-logout")
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_login_fails_with_invalid_password(self):
        User.objects.create_user(
            username="student6",
            email="student6@example.com",
            password="correcthorse",
        )
        url = reverse("user-login")
        response = self.client.post(
            url,
            {"username": "student6", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
