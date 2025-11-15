import time
import psutil
import logging
from django.http import JsonResponse
from django.db import connections, connection
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache
from .models import Job, JobStatus

logger = logging.getLogger('jobs.performance')


@require_http_methods(["GET"])
@never_cache
def health_check(request):
    """
    Comprehensive health check endpoint
    Returns system health status with detailed diagnostics
    """
    start_time = time.time()
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'checks': {},
        'response_time_ms': 0
    }
    
    try:
        # Database connectivity check
        health_status['checks']['database'] = check_database_health()
        
        # Cache connectivity check  
        health_status['checks']['cache'] = check_cache_health()
        
        # Application-specific checks
        health_status['checks']['jobs'] = check_jobs_health()
        
        # System resources check
        health_status['checks']['system'] = check_system_health()
        
        # Determine overall status
        failed_checks = [check for check, status in health_status['checks'].items() 
                        if status.get('status') != 'healthy']
        
        if failed_checks:
            health_status['status'] = 'degraded' if len(failed_checks) == 1 else 'unhealthy'
            health_status['failed_checks'] = failed_checks
            
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['error'] = str(e)
        logger.error(f"Health check failed: {e}")
    
    # Calculate response time
    health_status['response_time_ms'] = round((time.time() - start_time) * 1000, 2)
    
    # Set appropriate HTTP status code
    status_code = 200 if health_status['status'] == 'healthy' else 503
    
    return JsonResponse(health_status, status=status_code)


def check_database_health():
    """Check database connectivity and performance"""
    try:
        start_time = time.time()
        
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        # Test query performance on jobs table
        job_count = Job.objects.count()
        
        db_response_time = round((time.time() - start_time) * 1000, 2)
        
        return {
            'status': 'healthy',
            'response_time_ms': db_response_time,
            'job_count': job_count,
            'connection_status': 'connected'
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'connection_status': 'failed'
        }


def check_cache_health():
    """Check cache connectivity and performance"""
    try:
        start_time = time.time()
        test_key = 'health_check_test'
        test_value = 'ok'
        
        # Test cache write
        cache.set(test_key, test_value, timeout=30)
        
        # Test cache read
        cached_value = cache.get(test_key)
        
        cache_response_time = round((time.time() - start_time) * 1000, 2)
        
        if cached_value == test_value:
            # Cleanup test key
            cache.delete(test_key)
            return {
                'status': 'healthy',
                'response_time_ms': cache_response_time,
                'read_write': 'successful'
            }
        else:
            return {
                'status': 'unhealthy',
                'error': 'Cache read/write mismatch',
                'read_write': 'failed'
            }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'read_write': 'failed'
        }


def check_jobs_health():
    """Check job-specific application health"""
    try:
        # Check for recent job activity
        recent_jobs = Job.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()
        
        # Check for stuck running jobs (running for more than 2 hours)
        stuck_jobs = Job.objects.filter(
            statuses__status_type='RUNNING',
            statuses__timestamp__lt=timezone.now() - timezone.timedelta(hours=2)
        ).distinct().count()
        
        # Check for high error rate (more than 50% failed in last hour)
        recent_hour = timezone.now() - timezone.timedelta(hours=1)
        recent_jobs_hour = Job.objects.filter(created_at__gte=recent_hour).count()
        failed_jobs_hour = Job.objects.filter(
            created_at__gte=recent_hour,
            statuses__status_type='FAILED'
        ).distinct().count()
        
        error_rate = (failed_jobs_hour / recent_jobs_hour * 100) if recent_jobs_hour > 0 else 0
        
        status = 'healthy'
        warnings = []
        
        if stuck_jobs > 0:
            warnings.append(f'{stuck_jobs} jobs stuck in running state')
        
        if error_rate > 50:
            warnings.append(f'High error rate: {error_rate:.1f}%')
            status = 'degraded'
            
        return {
            'status': status,
            'recent_jobs_24h': recent_jobs,
            'stuck_jobs': stuck_jobs,
            'error_rate_1h': round(error_rate, 1),
            'warnings': warnings
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }


def check_system_health():
    """Check system resource health"""
    try:
        # Get system metrics
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Determine status based on thresholds
        status = 'healthy'
        warnings = []
        
        if memory.percent > 90:
            status = 'degraded'
            warnings.append(f'High memory usage: {memory.percent:.1f}%')
        
        if disk.percent > 85:
            status = 'degraded'
            warnings.append(f'High disk usage: {disk.percent:.1f}%')
            
        if cpu_percent > 85:
            status = 'degraded'  
            warnings.append(f'High CPU usage: {cpu_percent:.1f}%')
        
        return {
            'status': status,
            'memory_percent': round(memory.percent, 1),
            'disk_percent': round(disk.percent, 1),
            'cpu_percent': round(cpu_percent, 1),
            'warnings': warnings
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }


@require_http_methods(["GET"])
@never_cache
def performance_metrics(request):
    """
    Detailed performance metrics endpoint
    Returns comprehensive application and system metrics
    """
    try:
        start_time = time.time()
        
        metrics = {
            'timestamp': timezone.now().isoformat(),
            'application': get_application_metrics(),
            'database': get_database_metrics(),
            'system': get_system_metrics(),
            'response_time_ms': 0
        }
        
        # Calculate response time
        metrics['response_time_ms'] = round((time.time() - start_time) * 1000, 2)
        
        return JsonResponse(metrics)
        
    except Exception as e:
        logger.error(f"Performance metrics failed: {e}")
        return JsonResponse({
            'error': 'Failed to collect metrics',
            'message': str(e)
        }, status=500)


def get_application_metrics():
    """Get application-specific metrics"""
    try:
        # Job statistics
        total_jobs = Job.objects.count()
        
        # Status distribution
        status_counts = {}
        for status_type, _ in JobStatus.STATUS_CHOICES:
            count = Job.objects.filter(
                statuses__status_type=status_type,
                statuses__timestamp__in=Job.objects.filter(
                    pk=job.pk
                ).values_list('statuses__timestamp', flat=True).order_by('-statuses__timestamp')[:1]
                for job in Job.objects.all()
            ).distinct().count()
            status_counts[status_type.lower()] = count
        
        # Performance metrics
        avg_completion_time = Job.objects.filter(
            completed_at__isnull=False
        ).extra(
            select={'duration': 'EXTRACT(EPOCH FROM (completed_at - created_at))'}
        ).aggregate(
            avg_duration=models.Avg('duration')
        )['avg_duration']
        
        return {
            'total_jobs': total_jobs,
            'status_distribution': status_counts,
            'avg_completion_time_seconds': round(avg_completion_time or 0, 2),
        }
    except Exception as e:
        return {'error': str(e)}


def get_database_metrics():
    """Get database performance metrics"""
    try:
        with connection.cursor() as cursor:
            # Query performance
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    seq_scan,
                    seq_tup_read,
                    idx_scan,
                    idx_tup_fetch,
                    n_tup_ins,
                    n_tup_upd,
                    n_tup_del
                FROM pg_stat_user_tables 
                WHERE tablename LIKE 'jobs_%';
            """)
            
            table_stats = []
            for row in cursor.fetchall():
                table_stats.append({
                    'table': row[1],
                    'sequential_scans': row[2],
                    'index_scans': row[4],
                    'inserts': row[6],
                    'updates': row[7],
                    'deletes': row[8]
                })
            
            # Database size
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size(current_database()));
            """)
            db_size = cursor.fetchone()[0]
            
            return {
                'table_statistics': table_stats,
                'database_size': db_size,
                'connection_count': len(connections.all())
            }
    except Exception as e:
        return {'error': str(e)}


def get_system_metrics():
    """Get detailed system metrics"""
    try:
        # Memory details
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        # Disk details
        disk = psutil.disk_usage('/')
        
        # Network details
        network = psutil.net_io_counters()
        
        # Process details
        process = psutil.Process()
        process_memory = process.memory_info()
        
        return {
            'memory': {
                'total_gb': round(memory.total / (1024**3), 2),
                'used_gb': round(memory.used / (1024**3), 2),
                'percent': round(memory.percent, 1)
            },
            'swap': {
                'total_gb': round(swap.total / (1024**3), 2),
                'used_gb': round(swap.used / (1024**3), 2),
                'percent': round(swap.percent, 1)
            },
            'disk': {
                'total_gb': round(disk.total / (1024**3), 2),
                'used_gb': round(disk.used / (1024**3), 2),
                'percent': round(disk.percent, 1)
            },
            'network': {
                'bytes_sent': network.bytes_sent,
                'bytes_recv': network.bytes_recv,
                'packets_sent': network.packets_sent,
                'packets_recv': network.packets_recv
            },
            'process': {
                'memory_mb': round(process_memory.rss / (1024**2), 2),
                'cpu_percent': round(process.cpu_percent(), 1),
                'threads': process.num_threads()
            }
        }
    except Exception as e:
        return {'error': str(e)}


# Import models at the end to avoid circular imports
from django.db import models