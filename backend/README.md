# ItemRecovery — Backend

Django + Django REST Framework API for the digital lost-and-found system.

## Documentation

**Full beginner-friendly guide (models, API, workflows, Postman tips):**

→ **[`docs/BACKEND_GUIDE.md`](docs/BACKEND_GUIDE.md)**

## Quick start

1. Create a virtual environment, then install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Copy/configure `.env` (see **Environment variables** in the guide).

3. Apply migrations and run the server:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

4. (Optional) Create an admin user and run tests:

   ```bash
   python manage.py createsuperuser
   python manage.py test
   ```

API base URL (default): `http://127.0.0.1:8000/api/`
