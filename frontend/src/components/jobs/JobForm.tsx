import React, { useState } from 'react';
import { JobCreate } from '../../types/job';
import { useCreateJob } from '../../hooks/useJobs';
import { useToast } from '../../contexts/ToastContext';

interface JobFormProps {
  onJobCreated?: () => void;
}

export const JobForm: React.FC<JobFormProps> = ({ onJobCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(5);
  
  const createJobMutation = useCreateJob();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    const jobData: JobCreate = { 
      name: name.trim(),
      description: description.trim() || undefined,
      priority: priority
    };
    
    createJobMutation.mutate(jobData, {
      onSuccess: () => {
        setName('');
        setDescription('');
        setPriority(5);
        showToast('Job created successfully!', 'success');
        onJobCreated?.();
      },
      onError: (error) => {
        showToast(error.message || 'Failed to create job', 'error');
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="job-form">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Computational Job</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jobName" className="block text-sm font-medium text-gray-700 mb-1">
            Job Name *
          </label>
          <input
            type="text"
            id="jobName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter job name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={createJobMutation.isPending}
          />
        </div>

        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="jobDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter job description..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={createJobMutation.isPending}
          />
        </div>

        <div>
          <label htmlFor="jobPriority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority (1-10)
          </label>
          <select
            id="jobPriority"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={createJobMutation.isPending}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
              <option key={p} value={p}>
                {p} {p <= 3 ? '(Low)' : p <= 7 ? '(Medium)' : '(High)'}
              </option>
            ))}
          </select>
        </div>

        {createJobMutation.isError && (
          <div className="text-red-600 text-sm">
            {createJobMutation.error?.message || 'Failed to create job'}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createJobMutation.isPending || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};