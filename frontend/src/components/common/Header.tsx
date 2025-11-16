import React from 'react';
import { useJobStats } from '../../hooks/useJobs';

interface HeaderProps {
  title?: string;
  showStats?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Computational Jobs Dashboard", 
  showStats = true 
}) => {
  const { data: stats, isLoading: statsLoading } = useJobStats();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and monitor your computational jobs
            </p>
          </div>
          
          {showStats && (
            <div className="flex space-x-8">
              {statsLoading ? (
                <div className="text-sm text-gray-500">Loading stats...</div>
              ) : stats ? (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.total_jobs || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Jobs</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.pending_jobs || 0}
                    </div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.running_jobs || 0}
                    </div>
                    <div className="text-sm text-gray-500">Running</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.completed_jobs || 0}
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.failed_jobs || 0}
                    </div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};