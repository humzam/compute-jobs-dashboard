from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Job, JobStatus
from .serializers import JobReadSerializer, JobWriteSerializer, JobStatusUpdateSerializer


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.prefetch_related('statuses')
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return JobWriteSerializer
        return JobReadSerializer

    def update(self, request, *args, **kwargs):
        """Update job status by creating new JobStatus entry"""
        job = self.get_object()
        serializer = JobStatusUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Create new status entry
            JobStatus.objects.create(
                job=job,
                status_type=serializer.validated_data['status_type']
            )
            
            # Return updated job
            job.refresh_from_db()
            response_serializer = self.get_serializer(job)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        """Same as update for status changes"""
        return self.update(request, *args, **kwargs)
