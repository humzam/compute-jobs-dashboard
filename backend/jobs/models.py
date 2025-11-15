from django.db import models


class Job(models.Model):
    # Basic fields
    name = models.CharField(max_length=255, help_text="Human-readable job name")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Extended fields for production use
    description = models.TextField(blank=True, help_text="Optional job details")
    priority = models.IntegerField(default=5, help_text="Job priority (1-10, higher is more important)")
    scheduled_at = models.DateTimeField(null=True, blank=True, help_text="When to run the job")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="When job finished")
    error_message = models.TextField(blank=True, help_text="Error details if job failed")
    result_data = models.JSONField(null=True, blank=True, help_text="Job output data")
    resource_requirements = models.JSONField(null=True, blank=True, help_text="CPU/Memory requirements")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['priority']),
            models.Index(fields=['priority', 'created_at']),
        ]

    def __str__(self):
        return self.name

    @property
    def latest_status(self):
        """Get the most recent status for this job"""
        return self.statuses.first()


class JobStatus(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'), 
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='statuses')
    status_type = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Optional fields
    message = models.TextField(blank=True, help_text="Status details or notes")
    progress = models.IntegerField(null=True, blank=True, help_text="Progress percentage (0-100)")

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['job', 'timestamp']),
            models.Index(fields=['status_type']),
        ]

    def __str__(self):
        return f"{self.job.name} - {self.status_type} at {self.timestamp}"
