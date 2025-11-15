from django.core.management.base import BaseCommand
from django.utils import timezone
from jobs.models import Job, JobStatus
import random
from datetime import timedelta


class Command(BaseCommand):
    help = 'Seed database with test data for E2E tests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Number of jobs to create (default: 50)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        count = options['count']
        
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Job.objects.all().delete()
            JobStatus.objects.all().delete()

        self.stdout.write(f'Creating {count} test jobs...')

        # Job templates for realistic test data
        job_templates = [
            ('Data Processing Pipeline', 'Process large CSV datasets'),
            ('Machine Learning Training', 'Train neural network model'),
            ('Image Resizing Batch', 'Resize product images for web'),
            ('Database Migration', 'Migrate user data to new schema'),
            ('Report Generation', 'Generate monthly analytics report'),
            ('Backup Creation', 'Create database backup archive'),
            ('Email Campaign', 'Send marketing emails to subscribers'),
            ('Log Analysis', 'Analyze server logs for patterns'),
            ('File Compression', 'Compress and archive old files'),
            ('API Sync', 'Sync data with external API'),
        ]

        status_choices = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
        status_messages = {
            'PENDING': ['Waiting for resources', 'Queued for processing', 'Scheduled to run'],
            'RUNNING': ['Processing data...', 'Halfway complete', 'Training in progress'],
            'COMPLETED': ['Successfully processed', 'Task completed', 'All done!'],
            'FAILED': ['Network timeout', 'Insufficient memory', 'Permission denied'],
            'CANCELLED': ['User cancelled', 'Timeout reached', 'Resource unavailable'],
        }

        created_jobs = []
        
        for i in range(count):
            # Create job with realistic data
            name_template, desc_template = random.choice(job_templates)
            job_name = f"{name_template} #{i+1:03d}"
            job_desc = f"{desc_template} - Test job for E2E testing"
            
            # Create job
            job = Job.objects.create(
                name=job_name,
                description=job_desc,
                priority=random.randint(1, 10),
            )
            
            # Create initial PENDING status
            initial_timestamp = job.created_at
            JobStatus.objects.create(
                job=job,
                status_type='PENDING',
                message='Job created and queued',
                timestamp=initial_timestamp
            )
            
            # Add random status progression for some jobs
            current_status = 'PENDING'
            current_timestamp = initial_timestamp
            
            # Simulate status progression (30% chance for each transition)
            if random.random() < 0.7:  # 70% chance to progress beyond PENDING
                current_status = 'RUNNING'
                current_timestamp += timedelta(minutes=random.randint(1, 30))
                progress = random.randint(10, 90) if current_status == 'RUNNING' else None
                JobStatus.objects.create(
                    job=job,
                    status_type=current_status,
                    message=random.choice(status_messages[current_status]),
                    progress=progress,
                    timestamp=current_timestamp
                )
                
                if random.random() < 0.6:  # 60% chance to complete
                    final_status = random.choice(['COMPLETED', 'FAILED', 'CANCELLED'])
                    current_timestamp += timedelta(minutes=random.randint(5, 120))
                    final_progress = 100 if final_status == 'COMPLETED' else None
                    
                    JobStatus.objects.create(
                        job=job,
                        status_type=final_status,
                        message=random.choice(status_messages[final_status]),
                        progress=final_progress,
                        timestamp=current_timestamp
                    )
                    
                    # Update job completion time for terminal statuses
                    if final_status in ['COMPLETED', 'FAILED', 'CANCELLED']:
                        job.completed_at = current_timestamp
                        job.save()
            
            created_jobs.append(job)

        # Create some specific test jobs with known data for reliable testing
        test_jobs = [
            {
                'name': 'Test Job for Automation',
                'description': 'Specific job for E2E test automation',
                'priority': 5,
                'status': 'PENDING'
            },
            {
                'name': 'Long Running Test Job',
                'description': 'Job that simulates long execution',
                'priority': 8,
                'status': 'RUNNING',
                'progress': 45
            },
            {
                'name': 'Completed Test Job',
                'description': 'Job that has completed successfully',
                'priority': 3,
                'status': 'COMPLETED',
                'progress': 100
            }
        ]
        
        for test_job_data in test_jobs:
            job = Job.objects.create(
                name=test_job_data['name'],
                description=test_job_data['description'],
                priority=test_job_data['priority'],
            )
            
            status_data = {
                'job': job,
                'status_type': test_job_data['status'],
                'message': f"Test job in {test_job_data['status'].lower()} state",
                'timestamp': timezone.now()
            }
            
            if 'progress' in test_job_data:
                status_data['progress'] = test_job_data['progress']
                
            JobStatus.objects.create(**status_data)
            
            if test_job_data['status'] in ['COMPLETED', 'FAILED', 'CANCELLED']:
                job.completed_at = timezone.now()
                job.save()

        total_created = len(created_jobs) + len(test_jobs)
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {total_created} test jobs')
        )
        
        # Print statistics
        status_counts = {}
        for status, _ in JobStatus.STATUS_CHOICES:
            count = Job.objects.filter(
                statuses__status_type=status,
                statuses__timestamp=Job.objects.filter(pk=job.pk).aggregate(
                    latest=models.Max('statuses__timestamp')
                )['latest']
            ).distinct().count()
            if count > 0:
                status_counts[status] = count
        
        self.stdout.write('\nStatus distribution:')
        for status, count in status_counts.items():
            self.stdout.write(f'  {status}: {count} jobs')


# Import models at the end to avoid circular import issues
from django.db import models