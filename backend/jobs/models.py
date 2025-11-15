from django.db import models


class Job(models.Model):
    name = models.CharField(max_length=255, help_text="Human-readable job name")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

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
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='statuses')
    status_type = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.job.name} - {self.status_type} at {self.timestamp}"
