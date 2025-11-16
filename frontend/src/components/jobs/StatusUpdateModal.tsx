import React, { useState } from 'react';
import { Job, JobStatusUpdate } from '../../types/job';

interface StatusUpdateModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (statusUpdate: JobStatusUpdate) => void;
  isUpdating?: boolean;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdate,
  isUpdating = false
}) => {
  const [statusType, setStatusType] = useState<JobStatusUpdate['status_type']>('PENDING');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<number | ''>('');

  React.useEffect(() => {
    if (job && isOpen) {
      // Pre-populate with current status
      setStatusType(job.latest_status?.status_type || 'PENDING');
      setMessage(job.latest_status?.message || '');
      setProgress(job.latest_status?.progress ?? '');
    }
  }, [job, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const statusUpdate: JobStatusUpdate = {
      status_type: statusType,
      message: message.trim() || undefined,
      progress: progress === '' ? undefined : Number(progress),
    };
    
    onUpdate(statusUpdate);
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" data-testid="status-update-modal">
      <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Update Job Status</h3>
          <p className="text-sm text-gray-600 mt-1">Job: <span className="font-medium">{job.name}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              value={statusType}
              onChange={(e) => setStatusType(e.target.value as JobStatusUpdate['status_type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUpdating}
              required
            >
              <option value="PENDING">Pending</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Status Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional status description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUpdating}
            />
          </div>

          {statusType === 'RUNNING' && (
            <div>
              <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
                Progress (0-100)
              </label>
              <input
                type="number"
                id="progress"
                value={progress}
                onChange={(e) => setProgress(e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value))))}
                placeholder="Optional progress percentage"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUpdating}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};