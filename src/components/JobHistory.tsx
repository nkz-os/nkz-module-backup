import React, { useEffect, useState } from 'react';
import { Card, Badge } from '@nekazari/ui-kit';
import { useTranslation } from '@nekazari/sdk';
import { CheckCircle, XCircle, Clock, FileDigit } from 'lucide-react';
import { backupApi } from '../services/backupApi';
import { format } from 'date-fns';

const JobHistory: React.FC = () => {
    const { t } = useTranslation('backup');
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data for MVP visual validation
        const mockJobs = [
            { id: 1, type: 'backup', status: 'success', started_at: new Date().toISOString(), duration_seconds: 450, total_bytes: 45000000000, new_bytes: 200000000 },
            { id: 2, type: 'backup', status: 'failed', started_at: new Date(Date.now() - 86400000).toISOString(), duration_seconds: 120, error: 'Connection timeout' },
            { id: 3, type: 'restore', status: 'success', started_at: new Date(Date.now() - 172800000).toISOString(), duration_seconds: 900, total_bytes: 1000000000 },
        ];
        setJobs(mockJobs);
        setLoading(false);

        // Real call:
        // backupApi.getJobs().then(setJobs)...
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card padding="none">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (Dedup)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {jobs.map((job) => (
                            <tr key={job.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {format(new Date(job.started_at), 'MMM d, HH:mm')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                    {job.type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={job.status === 'success' ? 'success' : job.status === 'failed' ? 'destructive' : 'default'}>
                                        {job.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {Math.floor(job.duration_seconds / 60)}m {job.duration_seconds % 60}s
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {job.total_bytes ? formatBytes(job.total_bytes) : '-'}
                                    {job.new_bytes > 0 && <span className="text-xs text-gray-400 ml-1">({formatBytes(job.new_bytes)})</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default JobHistory;
