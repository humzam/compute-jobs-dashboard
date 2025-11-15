from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from django.db.models import Count, Q, Subquery, OuterRef, Avg, F, ExpressionWrapper, DurationField
from django.db import models
from django.db import connection
from django.utils import timezone
from datetime import datetime
import logging
from .models import Job, JobStatus
from .serializers import JobReadSerializer, JobWriteSerializer, JobStatusUpdateSerializer
from .pagination import JobPagination

logger = logging.getLogger('jobs.api')


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.select_related().prefetch_related(
        'statuses'
    ).only(
        'id', 'name', 'description', 'priority', 'created_at', 'updated_at', 'completed_at'
    )
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['priority']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'priority', 'updated_at']
    ordering = ['-priority', '-created_at']
    pagination_class = JobPagination

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return JobWriteSerializer
        return JobReadSerializer

    def update(self, request, *args, **kwargs):
        """Update job status by creating new JobStatus entry"""
        job = self.get_object()
        serializer = JobStatusUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Create new status entry with optional fields
            status_data = {
                'job': job,
                'status_type': serializer.validated_data['status_type']
            }
            
            # Add optional fields if provided
            if 'message' in serializer.validated_data:
                status_data['message'] = serializer.validated_data['message']
            if 'progress' in serializer.validated_data:
                status_data['progress'] = serializer.validated_data['progress']
                
            JobStatus.objects.create(**status_data)
            
            # Update job completed_at if status is terminal
            if serializer.validated_data['status_type'] in ['COMPLETED', 'FAILED', 'CANCELLED']:
                from django.utils import timezone
                job.completed_at = timezone.now()
                job.save(update_fields=['completed_at'])
            
            # Return updated job
            job.refresh_from_db()
            response_serializer = self.get_serializer(job)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        """Same as update for status changes"""
        return self.update(request, *args, **kwargs)

    def get_queryset(self):
        """Enhanced queryset with status and date filtering"""
        queryset = super().get_queryset()
        
        # Filter by status type (filter jobs by their latest status)
        status_type = self.request.query_params.get('status', None)
        if status_type:
            # Subquery to get the latest status for each job
            from django.db.models import Subquery, OuterRef
            latest_status_subquery = JobStatus.objects.filter(
                job=OuterRef('pk')
            ).order_by('-timestamp').values('status_type')[:1]
            
            queryset = queryset.annotate(
                latest_status_type=Subquery(latest_status_subquery)
            ).filter(latest_status_type=status_type)
        
        # Filter by date range
        created_after = self.request.query_params.get('created_after', None)
        created_before = self.request.query_params.get('created_before', None)
        
        if created_after:
            try:
                after_date = datetime.fromisoformat(created_after.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gte=after_date)
            except ValueError:
                pass
                
        if created_before:
            try:
                before_date = datetime.fromisoformat(created_before.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__lte=before_date)
            except ValueError:
                pass
        
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics using materialized view for better performance"""
        try:
            # Try to get stats from materialized view first
            with connection.cursor() as cursor:
                # Check if view needs refresh (older than 5 minutes)
                cursor.execute("""
                    SELECT last_updated, 
                           total_jobs, pending_jobs, running_jobs, completed_jobs, 
                           failed_jobs, cancelled_jobs, recent_jobs,
                           avg_completion_time_minutes
                    FROM job_stats_view 
                    WHERE last_updated > NOW() - INTERVAL '5 minutes'
                    LIMIT 1;
                """)
                
                result = cursor.fetchone()
                
                if result:
                    # Use cached stats from materialized view
                    stats_data = {
                        'total_jobs': result[1],
                        'pending_jobs': result[2],
                        'running_jobs': result[3], 
                        'completed_jobs': result[4],
                        'failed_jobs': result[5],
                        'cancelled_jobs': result[6],
                        'recent_jobs': result[7],
                        'avg_completion_time_minutes': float(result[8]) if result[8] else 0,
                        'last_updated': result[0].isoformat(),
                        'data_source': 'materialized_view'
                    }
                else:
                    # Refresh materialized view and get fresh stats
                    cursor.execute("SELECT refresh_job_stats();")
                    cursor.execute("""
                        SELECT last_updated, 
                               total_jobs, pending_jobs, running_jobs, completed_jobs, 
                               failed_jobs, cancelled_jobs, recent_jobs,
                               avg_completion_time_minutes
                        FROM job_stats_view 
                        LIMIT 1;
                    """)
                    
                    result = cursor.fetchone()
                    if result:
                        stats_data = {
                            'total_jobs': result[1],
                            'pending_jobs': result[2],
                            'running_jobs': result[3],
                            'completed_jobs': result[4], 
                            'failed_jobs': result[5],
                            'cancelled_jobs': result[6],
                            'recent_jobs': result[7],
                            'avg_completion_time_minutes': float(result[8]) if result[8] else 0,
                            'last_updated': result[0].isoformat(),
                            'data_source': 'refreshed_view'
                        }
                    else:
                        raise Exception("Failed to get stats from materialized view")
        
        except Exception as e:
            # Fallback to direct queries if materialized view fails
            logger.warning(f"Materialized view stats failed, using fallback: {e}")
            stats_data = self._get_stats_fallback()
            
        # Add priority distribution (not in materialized view due to complexity)
        priority_counts = Job.objects.values('priority').annotate(count=Count('priority')).order_by('priority')
        stats_data['priority_distribution'] = {item['priority']: item['count'] for item in priority_counts}
        
        return Response(stats_data)
    
    def _get_stats_fallback(self):
        """Fallback method for getting stats using direct queries"""
        total_jobs = Job.objects.count()
        
        # Status counts (get latest status for each job)
        status_counts = {}
        for status_choice in JobStatus.STATUS_CHOICES:
            status_type = status_choice[0]
            # Use more efficient subquery approach
            latest_status_subquery = JobStatus.objects.filter(
                job=OuterRef('pk')
            ).order_by('-timestamp').values('status_type')[:1]
            
            count = Job.objects.annotate(
                latest_status_type=Subquery(latest_status_subquery)
            ).filter(latest_status_type=status_type).count()
            
            status_counts[status_type.lower() + '_jobs'] = count
        
        # Recent activity (jobs created in last 24 hours)
        yesterday = timezone.now() - timezone.timedelta(days=1)
        recent_jobs = Job.objects.filter(created_at__gte=yesterday).count()
        
        # Average completion time
        avg_completion = Job.objects.filter(
            completed_at__isnull=False
        ).aggregate(
            avg_time=models.Avg(
                models.ExpressionWrapper(
                    models.F('completed_at') - models.F('created_at'),
                    output_field=models.DurationField()
                )
            )
        )['avg_time']
        
        avg_minutes = (avg_completion.total_seconds() / 60) if avg_completion else 0
        
        return {
            'total_jobs': total_jobs,
            'recent_jobs': recent_jobs,
            'avg_completion_time_minutes': round(avg_minutes, 2),
            'data_source': 'fallback_queries',
            **status_counts
        }

    @action(detail=False, methods=['post'])
    def bulk_status_update(self, request):
        """Update status for multiple jobs"""
        job_ids = request.data.get('job_ids', [])
        status_data = request.data.get('status', {})
        
        if not job_ids or not status_data:
            return Response(
                {'error': 'job_ids and status data are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status data
        status_serializer = JobStatusUpdateSerializer(data=status_data)
        if not status_serializer.is_valid():
            return Response(status_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update all specified jobs
        jobs = Job.objects.filter(id__in=job_ids)
        updated_count = 0
        
        for job in jobs:
            # Create new status entry
            status_entry_data = {
                'job': job,
                'status_type': status_serializer.validated_data['status_type']
            }
            
            if 'message' in status_serializer.validated_data:
                status_entry_data['message'] = status_serializer.validated_data['message']
            if 'progress' in status_serializer.validated_data:
                status_entry_data['progress'] = status_serializer.validated_data['progress']
                
            JobStatus.objects.create(**status_entry_data)
            
            # Update completed_at for terminal statuses
            if status_serializer.validated_data['status_type'] in ['COMPLETED', 'FAILED', 'CANCELLED']:
                job.completed_at = timezone.now()
                job.save(update_fields=['completed_at'])
            
            updated_count += 1
        
        return Response({
            'message': f'Updated {updated_count} jobs',
            'updated_jobs': updated_count
        })
