import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../services/api/jobs';
import { JobStatusUpdate } from '../types/job';

interface UseJobsOptions {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  page_size?: number;
}

// Query keys
export const jobsKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobsKeys.all, 'list'] as const,
  list: (filters: UseJobsOptions) => [...jobsKeys.lists(), filters] as const,
  stats: () => [...jobsKeys.all, 'stats'] as const,
};

// Custom hook for fetching jobs
export const useJobs = (options: UseJobsOptions = {}) => {
  const { search, status, priority, page = 1, page_size = 20 } = options;
  
  const queryResult = useQuery({
    queryKey: jobsKeys.list({ search, status, priority, page, page_size }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      params.append('page', page.toString());
      params.append('page_size', page_size.toString());
      
      const url = `http://localhost:8000/api/jobs/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds - jobs data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes - cache job lists for 5 minutes
    refetchOnWindowFocus: true,
  });

  // Check if there are any RUNNING jobs and enable polling
  const hasRunningJobs = queryResult.data?.results?.some(
    (job: any) => job.latest_status?.status_type === 'RUNNING'
  );

  // Enable polling if there are running jobs
  React.useEffect(() => {
    if (hasRunningJobs && !status) { // Only poll when not filtering by status
      const interval = setInterval(() => {
        queryResult.refetch();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [hasRunningJobs, status, queryResult]);

  return queryResult;
};

// Custom hook for fetching stats
export const useJobStats = () => {
  return useQuery({
    queryKey: jobsKeys.stats(),
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/jobs/stats/');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds for stats
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
};

// Mutation hook for creating jobs
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: jobsApi.createJob,
    onSuccess: () => {
      // Invalidate and refetch jobs queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.stats() });
    },
  });
};

// Mutation hook for updating job status
export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, statusUpdate }: { jobId: number; statusUpdate: JobStatusUpdate }) =>
      jobsApi.updateJobStatus(jobId, statusUpdate),
    // Optimistic updates
    onMutate: async ({ jobId, statusUpdate }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: jobsKeys.lists() });

      // Snapshot the previous value
      const previousJobs = queryClient.getQueriesData({ queryKey: jobsKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: jobsKeys.lists() }, (old: any) => {
        if (!old?.results) return old;
        
        return {
          ...old,
          results: old.results.map((job: any) =>
            job.id === jobId
              ? {
                  ...job,
                  latest_status: {
                    ...job.latest_status,
                    status_type: statusUpdate.status_type,
                    message: statusUpdate.message || job.latest_status?.message || '',
                    progress: statusUpdate.progress ?? job.latest_status?.progress,
                    timestamp: new Date().toISOString(),
                  },
                }
              : job
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousJobs };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newJob, context) => {
      if (context?.previousJobs) {
        context.previousJobs.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.stats() });
    },
  });
};

// Mutation hook for deleting jobs
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: jobsApi.deleteJob,
    onSuccess: () => {
      // Invalidate and refetch jobs queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.stats() });
    },
  });
};

// Mutation hook for bulk status updates
export const useBulkStatusUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ jobIds, status }: { jobIds: number[]; status: JobStatusUpdate }) => {
      const response = await fetch('http://localhost:8000/api/jobs/bulk_status_update/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_ids: jobIds, status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to bulk update jobs');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch jobs queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.stats() });
    },
  });
};