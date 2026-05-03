from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    STUDENT = "student"
    STAFF = "staff"
    ADMIN = "admin"

    ROLE_CHOICES = [
        (STUDENT, "Student"),
        (STAFF, "Staff"),
        (ADMIN, "Admin"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default=STUDENT)
    department = models.CharField(max_length=120, blank=True)
    phone_number = models.CharField(max_length=32, blank=True)
    campus_id = models.CharField(max_length=64, blank=True, null=True, unique=True)
    profile_image = models.URLField(blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"