import { Job, JobCreate, JobStatusUpdate, JobsResponse } from '../../types/job';

const API_BASE_URL = 'http://localhost:8000/api';

export const jobsApi = {
  getJobs: async (page = 1): Promise<JobsResponse> => {
    const response = await fetch(`${API_BASE_URL}/jobs/?page=${page}`);
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