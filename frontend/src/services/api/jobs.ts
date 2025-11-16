import { Job, JobCreate, JobStatusUpdate, JobsResponse } from '../../types/job';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const jobsApi = {
  getJobs: async (params: { page?: number; page_size?: number; search?: string; status?: string; priority?: string } = {}): Promise<JobsResponse> => {
    const urlParams = new URLSearchParams();
    if (params.page) urlParams.append('page', params.page.toString());
    if (params.page_size) urlParams.append('page_size', params.page_size.toString());
    if (params.search) urlParams.append('search', params.search);
    if (params.status) urlParams.append('status', params.status);
    if (params.priority) urlParams.append('priority', params.priority);
    
    const url = `${API_BASE_URL}/jobs/${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch jobs');
    }
    return response.json();
  },

  createJob: async (job: JobCreate): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });
    if (!response.ok) {
      throw new Error('Failed to create job');
    }
    return response.json();
  },

  updateJobStatus: async (jobId: number, statusUpdate: JobStatusUpdate): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusUpdate),
    });
    if (!response.ok) {
      throw new Error('Failed to update job status');
    }
    return response.json();
  },

  deleteJob: async (jobId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete job');
    }
  },

  getJob: async (jobId: number): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch job');
    }
    return response.json();
  },
};