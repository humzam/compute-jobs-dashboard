# Migration to create materialized view for job statistics

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0002_add_performance_indexes'),
    ]

    operations = [
        # Create materialized view for job statistics
        migrations.RunSQL(
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS job_stats_view AS
            WITH latest_statuses AS (
                SELECT DISTINCT ON (job_id) 
                    job_id, 
                    status_type, 
                    timestamp
                FROM jobs_jobstatus 
                ORDER BY job_id, timestamp DESC
            )
            SELECT 
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN ls.status_type = 'PENDING' THEN 1 END) as pending_jobs,
                COUNT(CASE WHEN ls.status_type = 'RUNNING' THEN 1 END) as running_jobs,
                COUNT(CASE WHEN ls.status_type = 'COMPLETED' THEN 1 END) as completed_jobs,
                COUNT(CASE WHEN ls.status_type = 'FAILED' THEN 1 END) as failed_jobs,
                COUNT(CASE WHEN ls.status_type = 'CANCELLED' THEN 1 END) as cancelled_jobs,
                COUNT(CASE WHEN j.priority >= 8 THEN 1 END) as high_priority_jobs,
                COUNT(CASE WHEN j.priority BETWEEN 4 AND 7 THEN 1 END) as medium_priority_jobs,
                COUNT(CASE WHEN j.priority <= 3 THEN 1 END) as low_priority_jobs,
                COUNT(CASE WHEN j.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_jobs,
                AVG(CASE WHEN j.completed_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (j.completed_at - j.created_at))/60 
                    END) as avg_completion_time_minutes,
                NOW() as last_updated
            FROM jobs_job j
            LEFT JOIN latest_statuses ls ON j.id = ls.job_id;
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS job_stats_view;"
        ),
        
        # Create index on the materialized view
        migrations.RunSQL(
            "CREATE UNIQUE INDEX IF NOT EXISTS job_stats_view_idx ON job_stats_view (last_updated);",
            reverse_sql="DROP INDEX IF EXISTS job_stats_view_idx;"
        ),
        
        # Create function to refresh the materialized view
        migrations.RunSQL(
            """
            CREATE OR REPLACE FUNCTION refresh_job_stats()
            RETURNS void AS $$
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY job_stats_view;
            END;
            $$ LANGUAGE plpgsql;
            """,
            reverse_sql="DROP FUNCTION IF EXISTS refresh_job_stats();"
        ),
    ]