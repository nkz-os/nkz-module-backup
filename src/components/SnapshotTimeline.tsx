import React, { useState } from 'react';
import { Card, Button } from '@nekazari/ui-kit';
import { useTranslation } from '@nekazari/sdk';
import RestoreDialog from './RestoreDialog';
import { Calendar, HardDrive } from 'lucide-react';

const SnapshotTimeline: React.FC = () => {
    const { t } = useTranslation('backup');
    const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

    // Mock Snapshots
    const snapshots = [
        { id: 'a1b2c3d4', time: new Date().toISOString(), tags: ['daily'], size: '45GB' },
        { id: 'e5f6g7h8', time: new Date(Date.now() - 86400000).toISOString(), tags: ['daily'], size: '44.8GB' },
        { id: 'i9j0k1l2', time: new Date(Date.now() - 172800000).toISOString(), tags: ['daily', 'weekly'], size: '44.2GB' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {snapshots.map(snap => (
                    <Card key={snap.id} padding="md" className="cursor-pointer hover:border-indigo-500 transition-colors" onClick={() => setSelectedSnapshot(snap)}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-indigo-100 p-2 rounded-lg">
                                    <HardDrive className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">
                                        {new Date(snap.time).toLocaleDateString()}
                                    </h4>
                                    <p className="text-xs text-gray-500">{new Date(snap.time).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            {snap.tags.includes('weekly') && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                    {t('retention.weekly')}
                                </span>
                            )}
                        </div>
                        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                            <span>{t('snapshot.id')}: {snap.id.substring(0, 8)}</span>
                            <span>{snap.size}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {selectedSnapshot && (
                <RestoreDialog
                    isOpen={!!selectedSnapshot}
                    onClose={() => setSelectedSnapshot(null)}
                    snapshot={selectedSnapshot}
                />
            )}
        </div>
    );
};

export default SnapshotTimeline;
