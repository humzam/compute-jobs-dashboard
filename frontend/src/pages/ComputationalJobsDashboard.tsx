import React, { useRef } from 'react';
import { JobList } from '../components/jobs/JobList';
import { JobForm } from '../components/jobs/JobForm';

export const ComputationalJobsDashboard: React.FC = () => {
  const jobListRef = useRef<{ refreshJobs: () => void }>();

  const handleJobCreated = () => {
    // Force refresh of job list
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Computational Jobs Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your computational tasks</p>
        </div>

        <div className="space-y-8">
          <JobForm onJobCreated={handleJobCreated} />
          
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Jobs</h2>
            </div>
            <div className="p-6">
              <JobList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};