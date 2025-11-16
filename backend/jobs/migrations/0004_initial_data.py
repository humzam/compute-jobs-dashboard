# Migration to create initial sample data for production

from django.db import migrations
from django.utils import timezone


def create_sample_jobs(apps, schema_editor):
    """Create initial sample jobs for demonstration"""
    Job = apps.get_model('jobs', 'Job')
    JobStatus = apps.get_model('jobs', 'JobStatus')
    
    # Sample job templates
    job_templates = [
        {
            'name': 'Welcome Demo Job',
            'description': 'This is a demonstration job showing the system capabilities. You can edit its status or delete it.',
            'priority': 5
        },
        {
            'name': 'Data Processing Pipeline',
            'description': 'Process large CSV datasets with validation and transformation rules.',
            'priority': 8
        },
        {
            'name': 'Machine Learning Model Training',
            'description': 'Train a neural network model on historical data with hyperparameter optimization.',
            'priority': 9
        },
        {
            'name': 'Report Generation',
            'description': 'Generate monthly analytics reports with charts and insights.',
            'priority': 3
        },
        {
            'name': 'Database Backup',
            'description': 'Create automated backup of production database with compression.',
            'priority': 6
        }
    ]
    
    # Status progression examples
    status_progressions = [
        ['PENDING'],
        ['PENDING', 'RUNNING'],
        ['PENDING', 'RUNNING', 'COMPLETED'],
        ['PENDING', 'RUNNING', 'FAILED'],
        ['PENDING', 'CANCELLED']
    ]
    
    created_jobs = []
    
    for i, template in enumerate(job_templates):
        # Create job
        job = Job.objects.create(
            name=template['name'],
            description=template['description'],
            priority=template['priority'],
        )
        
        # Create status progression
        progression = status_progressions[i % len(status_progressions)]
        current_time = job.created_at
        
        for j, status_type in enumerate(progression):
            # Add some time between status changes
            if j > 0:
                current_time = current_time + timezone.timedelta(minutes=5 + j * 10)
            
            # Create status messages
            messages = {
                'PENDING': 'Job queued and waiting for resources',
                'RUNNING': f'Processing... ({25 + j * 25}% complete)',
                'COMPLETED': 'Job completed successfully',
                'FAILED': 'Job failed due to resource constraints',
                'CANCELLED': 'Job cancelled by user request'
            }
            
            # Set progress for running jobs
            progress = None
            if status_type == 'RUNNING':
                progress = 25 + (j * 25) if j < 3 else 75
            elif status_type == 'COMPLETED':
                progress = 100
                
            JobStatus.objects.create(
                job=job,
                status_type=status_type,
                message=messages[status_type],
                progress=progress,
                timestamp=current_time
            )
            
            # Update job completion time for terminal statuses
            if status_type in ['COMPLETED', 'FAILED', 'CANCELLED']:
                job.completed_at = current_time
                job.save()
        
        created_jobs.append(job)


def remove_sample_jobs(apps, schema_editor):
    """Remove sample jobs if migration is reversed"""
    Job = apps.get_model('jobs', 'Job')
    
    # Remove jobs by name pattern (only the demo ones)
    demo_names = [
        'Welcome Demo Job',
        'Data Processing Pipeline', 
        'Machine Learning Model Training',
        'Report Generation',
        'Database Backup'
    ]
    
    Job.objects.filter(name__in=demo_names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0003_create_stats_view'),
    ]

    operations = [
        migrations.RunPython(
            create_sample_jobs,
            remove_sample_jobs,
            elidable=True,
        ),
    ]