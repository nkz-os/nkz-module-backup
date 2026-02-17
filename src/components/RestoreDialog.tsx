import React, { useState } from 'react';
import { Button, Card } from '@nekazari/ui-kit';
import { useTranslation } from '@nekazari/sdk';
import { AlertTriangle, Download, HardDrive, RotateCcw } from 'lucide-react';
import { backupApi } from '../services/backupApi';

interface RestoreDialogProps {
    isOpen: boolean;
    onClose: () => void;
    snapshot: any;
}

const RestoreDialog: React.FC<RestoreDialogProps> = ({ isOpen, onClose, snapshot }) => {
    const { t } = useTranslation('backup');
    const [confirmInput, setConfirmInput] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleRestore = async (type: 'full' | 'download' | 'mount') => {
        setLoading(true);
        try {
            await backupApi.triggerRestore(snapshot.id, type, confirmInput);
            alert('Restore started!'); // Replace with toast
            onClose();
        } catch (e) {
            alert('Error starting restore');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card padding="lg" className="w-full max-w-lg bg-white relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <RotateCcw className="w-6 h-6 mr-2 text-indigo-600" />
                    {t('restore.title')}
                </h2>

                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Snapshot ID: <span className="font-mono">{snapshot.id}</span></p>
                    <p className="text-sm text-gray-600">Date: {new Date(snapshot.time).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Size: {snapshot.size}</p>
                </div>

                <div className="space-y-4">
                    {/* Full Restore Zone */}
                    <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                        <h3 className="font-medium text-red-800 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {t('restore.full_restore')}
                        </h3>
                        <p className="text-sm text-red-600 mt-1 mb-3">{t('restore.warning')}</p>

                        <input
                            type="text"
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 mb-2"
                            placeholder={t('restore.confirm_token')}
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                        />
                        <Button
                            variant="destructive"
                            className="w-full"
                            disabled={confirmInput !== 'RESTORE' || loading}
                            onClick={() => handleRestore('full')}
                        >
                            {loading ? 'Processing...' : 'CONFIRM FULL RESTORE'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => handleRestore('download')} className="flex items-center justify-center">
                            <Download className="w-4 h-4 mr-2" />
                            {t('restore.download')}
                        </Button>
                        <Button variant="outline" onClick={() => handleRestore('mount')} className="flex items-center justify-center">
                            <HardDrive className="w-4 h-4 mr-2" />
                            {t('restore.mount')}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RestoreDialog;
