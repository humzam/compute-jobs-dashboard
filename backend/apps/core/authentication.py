from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    def get_raw_token(self, request):
        # First try to get token from cookie
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            # Fallback to header-based authentication
            return super().get_raw_token(request)
        return raw_token.encode('utf-8')

    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
            user = User.objects.get(id=user_id)
            return user
        except User.DoesNotExist:
            return None