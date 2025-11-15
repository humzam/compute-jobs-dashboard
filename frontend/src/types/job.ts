export interface JobStatus {
  id: number;
  status_type: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  timestamp: string;
  message?: string;
  progress?: number;
}

export interface Job {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  latest_status: JobStatus | null;
  description?: string;
  priority: number;
  scheduled_at?: string;
  completed_at?: string;
  error_message?: string;
  result_data?: any;
  resource_requirements?: any;
}

export interface JobCreate {
  name: string;
  description?: string;
  priority?: number;
  scheduled_at?: string;
  resource_requirements?: any;
}

export interface JobStatusUpdate {
  status_type: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  message?: string;
  progress?: number;
}

export interface JobsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}