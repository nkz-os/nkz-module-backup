import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@nekazari/ui-kit';
import { useTranslation } from '@nekazari/sdk';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { backupApi, BackupConfig } from '../services/backupApi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const BackupStatusWidget: React.FC = () => {
    const { t } = useTranslation('backup'); // Namespace 'backup'
    const [config, setConfig] = useState<BackupConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        backupApi.getConfig()
            .then(setConfig)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Card padding="md"><div className="animate-pulse h-20 bg-gray-100 rounded"></div></Card>;

    if (!config || !config.enabled) {
        return (
            <Card padding="md" className="flex flex-col items-center justify-center text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-500">{t('widget.not_configured')}</p>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/backup'}>
                    {t('widget.configure')}
                </Button>
            </Card>
        );
    }

    const isHealthy = config.last_backup_status === 'success';
    const lastBackupDate = config.last_backup_at ? new Date(config.last_backup_at) : null;

    return (
        <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className={`w-5 h-5 ${isHealthy ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="font-medium text-gray-700">{t('widget.title')}</span>
                </div>
                <Badge variant={isHealthy ? 'success' : 'destructive'}>
                    {isHealthy ? t('status.protected') : t('status.at_risk')}
                </Badge>
            </div>

            <div className="text-sm text-gray-600 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>
                    {lastBackupDate
                        ? t('widget.last_backup', { time: formatDistanceToNow(lastBackupDate, { addSuffix: true, locale: es }) })
                        : t('widget.never_backed_up')}
                </span>
            </div>
        </Card>
    );
};

export default BackupStatusWidget;
