import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';

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
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/jobs/stats/');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle external refresh trigger (e.g., when new job is created)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchStats();
    }
  }, [refreshTrigger]);

  if (loading) {
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error loading stats: {error}</div>
        <button 
          onClick={fetchStats}
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