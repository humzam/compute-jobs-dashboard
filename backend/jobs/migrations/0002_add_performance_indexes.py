# Generated migration for performance indexes

from django.db import migrations, models
import django.db.models.indexes


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0001_initial'),
    ]

    operations = [
        # Add partial indexes for common query patterns
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_job_active_priority_idx ON jobs_job (priority DESC, created_at DESC) WHERE completed_at IS NULL;",
            reverse_sql="DROP INDEX IF EXISTS jobs_job_active_priority_idx;"
        ),
        
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_job_completed_recent_idx ON jobs_job (completed_at DESC) WHERE completed_at IS NOT NULL AND completed_at >= NOW() - INTERVAL '7 days';",
            reverse_sql="DROP INDEX IF EXISTS jobs_job_completed_recent_idx;"
        ),
        
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_job_search_name_idx ON jobs_job USING gin(to_tsvector('english', name)) WHERE name IS NOT NULL;",
            reverse_sql="DROP INDEX IF EXISTS jobs_job_search_name_idx;"
        ),
        
        # Composite index for status filtering
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_jobstatus_job_timestamp_idx ON jobs_jobstatus (job_id, timestamp DESC);",
            reverse_sql="DROP INDEX IF EXISTS jobs_jobstatus_job_timestamp_idx;"
        ),
        
        # Partial index for running jobs (for polling queries)
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_jobstatus_running_jobs_idx ON jobs_jobstatus (job_id, timestamp DESC) WHERE status_type = 'RUNNING';",
            reverse_sql="DROP INDEX IF EXISTS jobs_jobstatus_running_jobs_idx;"
        ),
        
        # Index for stats queries
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_jobstatus_latest_status_idx ON jobs_jobstatus (status_type, timestamp DESC);",
            reverse_sql="DROP INDEX IF EXISTS jobs_jobstatus_latest_status_idx;"
        ),
    ]