from django.contrib import admin
from .models import Job, JobStatus


class JobStatusInline(admin.TabularInline):
    model = JobStatus
    extra = 0
    readonly_fields = ['timestamp']


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'get_latest_status']
    list_filter = ['created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [JobStatusInline]

    def get_latest_status(self, obj):
        latest = obj.latest_status
        return latest.status_type if latest else 'No status'
    get_latest_status.short_description = 'Latest Status'


@admin.register(JobStatus)
class JobStatusAdmin(admin.ModelAdmin):
    list_display = ['job', 'status_type', 'timestamp']
    list_filter = ['status_type', 'timestamp']
    readonly_fields = ['timestamp']
