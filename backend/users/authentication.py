from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Simplified session auth for this project frontend.
    """

    def enforce_csrf(self, request):
        return
