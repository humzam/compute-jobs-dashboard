import React, { useState } from 'react';
import { Job, JobStatusUpdate } from '../../types/job';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { StatusUpdateModal } from './StatusUpdateModal';
import { JobFilters } from './JobFilters';
import { useJobs, useUpdateJobStatus, useDeleteJob } from '../../hooks/useJobs';
import { useToast } from '../../contexts/ToastContext';

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface JobListProps {
  refreshTrigger?: number;
}

export const JobList: React.FC<JobListProps> = ({ refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ jobId: number; jobName: string } | null>(null);
  const [statusUpdateJob, setStatusUpdateJob] = useState<Job | null>(null);
  
  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // React Query hooks
  const { data, isLoading, error, isError } = useJobs({
    search: debouncedSearchTerm,
    status: statusFilter,
    priority: priorityFilter,
  });

  const updateJobStatusMutation = useUpdateJobStatus();
  const deleteJobMutation = useDeleteJob();
  const { showToast } = useToast();

  const jobs = data?.results || [];

  const handleStatusUpdateClick = (job: Job) => {
    setStatusUpdateJob(job);
  };

  const handleStatusUpdate = (statusUpdate: JobStatusUpdate) => {
    if (!statusUpdateJob) return;
    
    updateJobStatusMutation.mutate({ 
      jobId: statusUpdateJob.id, 
      statusUpdate 
    }, {
      onSuccess: () => {
        showToast(`Job status updated to ${statusUpdate.status_type.toLowerCase()}`, 'success');
        setStatusUpdateJob(null);
      },
      onError: (error) => {
        showToast(error.message || 'Failed to update job status', 'error');
      }
    });
  };

  const handleDeleteClick = (job: Job) => {
    setDeleteConfirm({ jobId: job.id, jobName: job.name });
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    
    deleteJobMutation.mutate(deleteConfirm.jobId, {
      onSuccess: () => {
        showToast('Job deleted successfully', 'success');
      },
      onError: (error) => {
        showToast(error.message || 'Failed to delete job', 'error');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading jobs...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error?.message || 'Failed to fetch jobs'}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No computational jobs found.</div>
        <div className="text-sm text-gray-400 mt-1">Create your first job to get started.</div>
      </div>
    );
  }

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  return (
    <div className="space-y-6">
      <JobFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        onClearFilters={handleClearFilters}
      />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Progress
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {job.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{job.name}</div>
                  {job.description && (
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {job.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  job.priority >= 8 ? 'bg-red-100 text-red-800' :
                  job.priority >= 5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {job.priority}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {job.latest_status ? (
                  <div>
                    <StatusBadge status={job.latest_status.status_type} />
                    {job.latest_status.message && (
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {job.latest_status.message}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">No status</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {job.latest_status?.progress !== undefined ? (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${job.latest_status.progress}%` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1">{job.latest_status.progress}%</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(job.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button
                  onClick={() => handleStatusUpdateClick(job)}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Edit Status
                </button>
                <button
                  onClick={() => handleDeleteClick(job)}
                  className="text-red-600 hover:text-red-800 text-xs underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
        </div>
      </div>
      
      <StatusUpdateModal
        job={statusUpdateJob}
        isOpen={statusUpdateJob !== null}
        onClose={() => setStatusUpdateJob(null)}
        onUpdate={handleStatusUpdate}
        isUpdating={updateJobStatusMutation.isPending}
      />
      
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Job"
        message={`Are you sure you want to delete "${deleteConfirm?.jobName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};