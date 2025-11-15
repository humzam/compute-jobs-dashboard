export interface JobStatus {
  id: number;
  status_type: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  timestamp: string;
}

export interface Job {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  latest_status: JobStatus | null;
}

export interface JobCreate {
  name: string;
}

export interface JobStatusUpdate {
  status_type: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface JobsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}