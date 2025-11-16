from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet
from .monitoring import health_check, performance_metrics

router = DefaultRouter()
router.register(r'jobs', JobViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('health/', health_check, name='health_check'),
    path('metrics/', performance_metrics, name='performance_metrics'),
]