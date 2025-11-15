import React from 'react';
import { Job } from '../../types/job';
import { StatusBadge } from '../common/StatusBadge';

interface JobRowProps {
  job: Job;
  onStatusUpdateClick: (job: Job) => void;
  onDeleteClick: (job: Job) => void;
}

export const JobRow: React.FC<JobRowProps> = React.memo(({ 
  job, 
  onStatusUpdateClick, 
  onDeleteClick 
}) => {
  const handleStatusUpdateClick = React.useCallback(() => {
    onStatusUpdateClick(job);
  }, [job, onStatusUpdateClick]);

  const handleDeleteClick = React.useCallback(() => {
    onDeleteClick(job);
  }, [job, onDeleteClick]);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {job.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{job.name}</div>
          {job.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">
              {job.description}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          job.priority >= 8 ? 'bg-red-100 text-red-800' :
          job.priority >= 5 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {job.priority}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {job.latest_status ? (
          <div>
            <StatusBadge status={job.latest_status.status_type} />
            {job.latest_status.message && (
              <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                {job.latest_status.message}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">No status</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {job.latest_status?.progress !== undefined ? (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${job.latest_status.progress}%` }}
            ></div>
            <div className="text-xs text-gray-500 mt-1">{job.latest_status.progress}%</div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(job.created_at).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
        <button
          onClick={handleStatusUpdateClick}
          className="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          Edit Status
        </button>
        <button
          onClick={handleDeleteClick}
          className="text-red-600 hover:text-red-800 text-xs underline"
        >
          Delete
        </button>
      </td>
    </tr>
  );
});

JobRow.displayName = 'JobRow';