import { Page } from '@playwright/test';

export interface MockJob {
  id: number;
  name: string;
  description: string;
  priority: number;
  created_at: string;
  updated_at: string;
  latest_status: {
    id: number;
    status_type: string;
    message: string;
    progress: number | null;
    created_at: string;
  };
}

export const mockJobs: MockJob[] = [
  {
    id: 1,
    name: "Data Processing Job",
    description: "Processing large dataset",
    priority: 5,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    latest_status: {
      id: 1,
      status_type: "PENDING",
      message: "Job queued for processing",
      progress: null,
      created_at: "2024-01-15T10:30:00Z"
    }
  },
  {
    id: 2,
    name: "ML Model Training",
    description: "Training machine learning model",
    priority: 8,
    created_at: "2024-01-15T09:15:00Z",
    updated_at: "2024-01-15T11:45:00Z",
    latest_status: {
      id: 2,
      status_type: "RUNNING",
      message: "Model training in progress",
      progress: 65,
      created_at: "2024-01-15T11:45:00Z"
    }
  }
];

export async function setupAPIMocks(page: Page) {

  // Mock GET /api/jobs/ - List jobs
  await page.route('**/api/jobs/**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: mockJobs.length,
          next: null,
          previous: null,
          results: mockJobs
        })
      });
    }
  });

  // Mock POST /api/jobs/ - Create job
  await page.route('**/api/jobs/', async (route) => {
    if (route.request().method() === 'POST') {
      const requestBody = route.request().postDataJSON();
      const newJob: MockJob = {
        id: mockJobs.length + 1,
        name: requestBody.name,
        description: requestBody.description || '',
        priority: requestBody.priority || 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        latest_status: {
          id: mockJobs.length + 1,
          status_type: "PENDING",
          message: "Job created successfully",
          progress: null,
          created_at: new Date().toISOString()
        }
      };
      
      mockJobs.push(newJob);
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newJob)
      });
    }
  });

  // Mock POST /api/jobs/{id}/status/ - Update job status  
  await page.route('**/api/jobs/*/status/**', async (route) => {
    if (route.request().method() === 'POST') {
      const url = route.request().url();
      const jobId = parseInt(url.split('/jobs/')[1].split('/')[0]);
      const requestBody = route.request().postDataJSON();
      
      const job = mockJobs.find(j => j.id === jobId);
      if (job) {
        job.latest_status = {
          id: Date.now(),
          status_type: requestBody.status_type,
          message: requestBody.message || '',
          progress: requestBody.progress !== undefined ? parseInt(requestBody.progress) : null,
          created_at: new Date().toISOString()
        };
        job.updated_at = new Date().toISOString();
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(job.latest_status)
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Job not found' })
        });
      }
    }
  });

  // Alternative pattern for status updates
  await page.route('**/api/jobs/*/status/', async (route) => {
    if (route.request().method() === 'POST') {
      const url = route.request().url();
      const jobId = parseInt(url.split('/jobs/')[1].split('/')[0]);
      const requestBody = route.request().postDataJSON();
      
      const job = mockJobs.find(j => j.id === jobId);
      if (job) {
        job.latest_status = {
          id: Date.now(),
          status_type: requestBody.status_type,
          message: requestBody.message || '',
          progress: requestBody.progress !== undefined ? parseInt(requestBody.progress) : null,
          created_at: new Date().toISOString()
        };
        job.updated_at = new Date().toISOString();
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(job.latest_status)
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Job not found' })
        });
      }
    }
  });

  // Mock DELETE /api/jobs/{id}/ - Delete job
  await page.route('**/api/jobs/*/', async (route) => {
    if (route.request().method() === 'DELETE') {
      const url = route.request().url();
      const jobId = parseInt(url.split('/jobs/')[1].split('/')[0]);
      
      const jobIndex = mockJobs.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        mockJobs.splice(jobIndex, 1);
        await route.fulfill({
          status: 204
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Job not found' })
        });
      }
    }
  });
}