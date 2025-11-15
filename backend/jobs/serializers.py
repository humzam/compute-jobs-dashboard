from rest_framework import serializers
from .models import Job, JobStatus


class JobStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobStatus
        fields = ['id', 'status_type', 'timestamp', 'message', 'progress']


class JobReadSerializer(serializers.ModelSerializer):
    latest_status = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'name', 'created_at', 'updated_at', 'latest_status',
            'description', 'priority', 'scheduled_at', 'completed_at',
            'error_message', 'result_data', 'resource_requirements'
        ]

    def get_latest_status(self, obj):
        latest = obj.latest_status
        if latest:
            return JobStatusSerializer(latest).data
        return None


class JobWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'name', 'description', 'priority', 'scheduled_at',
            'resource_requirements'
        ]

    def create(self, validated_data):
        job = super().create(validated_data)
        # Automatically create initial PENDING status
        JobStatus.objects.create(job=job, status_type='PENDING')
        return job


class JobStatusUpdateSerializer(serializers.Serializer):
    status_type = serializers.ChoiceField(choices=JobStatus.STATUS_CHOICES)
    message = serializers.CharField(required=False, allow_blank=True)
    progress = serializers.IntegerField(required=False, min_value=0, max_value=100)
    
    def validate_status_type(self, value):
        if value not in [choice[0] for choice in JobStatus.STATUS_CHOICES]:
            raise serializers.ValidationError("Invalid status type")
        return value