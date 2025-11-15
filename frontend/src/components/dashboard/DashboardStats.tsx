import React from 'react';
import { StatsCard } from './StatsCard';
import { useJobStats } from '../../hooks/useJobs';

interface JobStats {
  total_jobs: number;
  status_counts: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  priority_distribution: Record<string, number>;
  recent_jobs: number;
}

interface DashboardStatsProps {
  refreshTrigger?: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ refreshTrigger }) => {
  const { data: stats, isLoading, error, isError } = useJobStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error loading stats: {error?.message || 'Failed to fetch stats'}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const highPriorityJobs = Object.entries(stats.priority_distribution)
    .filter(([priority]) => parseInt(priority) >= 8)
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Jobs"
          value={stats.total_jobs}
          icon="📊"
          color="blue"
        />
        
        <StatsCard
          title="Running Jobs"
          value={stats.status_counts.running}
          icon="⚡"
          color="blue"
          subtitle="Currently processing"
        />
        
        <StatsCard
          title="Completed Jobs"
          value={stats.status_counts.completed}
          icon="✅"
          color="green"
        />
        
        <StatsCard
          title="Recent Jobs"
          value={stats.recent_jobs}
          icon="📅"
          color="gray"
          subtitle="Last 24 hours"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pending Jobs"
          value={stats.status_counts.pending}
          icon="⏳"
          color="yellow"
        />
        
        <StatsCard
          title="Failed Jobs"
          value={stats.status_counts.failed}
          icon="❌"
          color="red"
        />
        
        <StatsCard
          title="Cancelled Jobs"
          value={stats.status_counts.cancelled}
          icon="🚫"
          color="gray"
        />
        
        <StatsCard
          title="High Priority"
          value={highPriorityJobs}
          icon="🔥"
          color="red"
          subtitle="Priority 8-10"
        />
      </div>
    </div>
  );
};