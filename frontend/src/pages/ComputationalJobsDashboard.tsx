import React, { useState, useCallback } from 'react';
import { JobList } from '../components/jobs/JobList';
import { JobForm } from '../components/jobs/JobForm';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { Header } from '../components/common/Header';
import { Container } from '../components/common/Container';

export const ComputationalJobsDashboard: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleJobCreated = useCallback(() => {
    // Trigger refresh by updating the key
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        <Container>
          <div className="space-y-8">
            <DashboardStats refreshTrigger={refreshTrigger} />
            
            <JobForm onJobCreated={handleJobCreated} />
            
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Jobs</h2>
                <p className="text-gray-600 mt-1">View and manage your computational jobs</p>
              </div>
              
              <JobList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
};