from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update test student/admin accounts for local login."

    def handle(self, *args, **options):
        User = get_user_model()

        accounts = [
            {
                "username": "student_demo",
                "email": "student_demo@example.com",
                "password": "StudentDemo123!",
                "role": getattr(User, "STUDENT", "student"),
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
                "first_name": "Student",
                "last_name": "Demo",
            },
            {
                "username": "admin_demo",
                "email": "admin_demo@example.com",
                "password": "AdminDemo123!",
                "role": getattr(User, "ADMIN", "admin"),
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "first_name": "Admin",
                "last_name": "Demo",
            },
        ]

        for account in accounts:
            username = account["username"]
            password = account.pop("password")

            user, created = User.objects.get_or_create(
                username=username,
                defaults=account,
            )

            if not created:
                for field, value in account.items():
                    setattr(user, field, value)

            user.set_password(password)
            user.save()

            verb = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{verb} user: {username}"))

