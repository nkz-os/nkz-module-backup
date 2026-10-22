import React, { useState, useEffect } from 'react';
import { Card, Button } from '@nekazari/ui-kit';
import { useTranslation } from '@nekazari/sdk';
import { Save, Lock, Cloud, Server, Database } from 'lucide-react';
import { backupApi, BackupConfig, BackupSource } from '../services/backupApi';
import RetentionPolicy from './RetentionPolicy';

const BackupConfigForm: React.FC = () => {
    const { t } = useTranslation('backup');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    // Initial state
    const [config, setConfig] = useState<Partial<BackupConfig>>({
        enabled: false,
        schedule_cron: '0 3 * * *',
        retention_daily: 7,
        retention_weekly: 4,
        retention_monthly: 12,
        destination_type: 's3',
        destination_config: {},
        sources: [{ type: 'postgresql' }] // Default to object
    });

    useEffect(() => {
        backupApi.getConfig().then(setConfig).catch(() => { });
    }, []);

    const handleChange = (key: string, val: any) => {
        setConfig(prev => ({ ...prev, [key]: val }));
    };

    const handleDestConfigChange = (key: string, val: any) => {
        setConfig(prev => ({
            ...prev,
            destination_config: { ...prev.destination_config, [key]: val }
        }));
    };

    // Helper to manage sources
    const addSource = (type: string) => {
        const newSource = { type, connection_string: '' };
        setConfig(prev => ({
            ...prev,
            sources: [...(prev.sources || []), newSource] // Use object structure now
        }));
    };

    const removeSource = (index: number) => {
        setConfig(prev => ({
            ...prev,
            sources: prev.sources?.filter((_, i) => i !== index)
        }));
    };

    const updateSource = (index: number, key: string, val: string) => {
        setConfig(prev => {
            const currentSources = prev.sources || [];
            const newSources = [...currentSources];
            if (newSources[index]) {
                newSources[index] = { ...newSources[index], [key]: val };
            }
            return { ...prev, sources: newSources };
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await backupApi.updateConfig(config);
            alert(t('alerts.saved_ok'));
        } catch (e) {
            alert(t('alerts.saved_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            await backupApi.testConnection(config);
            alert(t('alerts.connection_ok'));
        } catch (e) {
            alert(t('alerts.connection_error'));
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Sources Configuration (Hermetic & Extensible) */}
            <Card padding="md">
                <div className="flex items-center space-x-2 mb-4">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-medium text-lg">{t('config.sources')}</h3>
                </div>

                <div className="space-y-4">
                    {(config.sources as any[])?.map((source, idx) => (
                        <div key={idx} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium text-sm uppercase">{source.type}</span>
                                    <button onClick={() => removeSource(idx)} className="text-red-500 text-xs hover:underline">
                                        {t('ui.remove')}
                                    </button>
                                </div>

                                {source.type === 'postgresql' && (
                                    <p className="text-xs text-gray-500">{t('ui.internal_db')}</p>
                                )}
                                {source.type === 'minio' && (
                                    <p className="text-xs text-gray-500">{t('ui.internal_files')}</p>
                                )}
                                {(source.type === 'odoo' || source.type === 'external-postgres') && (
                                    isPlatformAdmin ? (
                                        <input
                                            type="text"
                                            placeholder={t('ui.connection_string_placeholder')}
                                            className="w-full border-gray-300 rounded-md p-1 text-sm"
                                            value={source.connection_string || ''}
                                            onChange={(e) => updateSource(idx, 'connection_string', e.target.value)}
                                        />
                                    ) : (
                                        <p className="text-xs text-red-500">{t('ui.contact_admin')}</p>
                                    )
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => addSource('postgresql')}>{t('ui.add_postgres_internal')}</Button>
                        <Button size="sm" variant="outline" onClick={() => addSource('minio')}>{t('ui.add_minio_internal')}</Button>
                        <Button size="sm" variant="outline" onClick={() => addSource('odoo')}>{t('ui.add_odoo')}</Button>
                        <Button size="sm" variant="outline" onClick={() => addSource('external-postgres')}>{t('ui.add_external_db')}</Button>
                    </div>
                </div>
            </Card>

            {/* Destination Panel */}
            <Card padding="md">
                <div className="flex items-center space-x-2 mb-4">
                    <Cloud className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-medium text-lg">{t('config.destination_title')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('ui.provider_type')}</label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm"
                            value={config.destination_type}
                            onChange={(e) => handleChange('destination_type', e.target.value)}
                        >
                            <option value="s3">{t('destinations.s3')}</option>
                            <option value="sftp">{t('destinations.sftp')}</option>
                            <option value="webdav">{t('destinations.webdav')}</option>
                            <option value="drive">{t('destinations.drive')}</option>
                            <option value="dropbox">{t('destinations.dropbox')}</option>
                            <option value="onedrive">{t('destinations.onedrive')}</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{t('config.destination_desc')}</p>
                    </div>

                    {/* Dynamic Fields based on Type - Simplified for MVP */}
                    <div className="space-y-3">
                        {config.destination_type === 's3' && (
                            <>
                                <input placeholder={t('ui.bucket_name')} className="w-full border-gray-300 rounded-md p-2 text-sm"
                                    onChange={e => handleDestConfigChange('bucket', e.target.value)} />
                                <input placeholder={t('ui.endpoint_url')} className="w-full border-gray-300 rounded-md p-2 text-sm"
                                    onChange={e => handleDestConfigChange('endpoint', e.target.value)} />
                                <input placeholder={t('ui.access_key_id')} className="w-full border-gray-300 rounded-md p-2 text-sm"
                                    onChange={e => handleDestConfigChange('access_key_id', e.target.value)} />
                                <input type="password" placeholder={t('ui.secret_access_key')} className="w-full border-gray-300 rounded-md p-2 text-sm"
                                    onChange={e => handleDestConfigChange('secret_access_key', e.target.value)} />
                            </>
                        )}
                        {config.destination_type === 'sftp' && (
                            <>
                                <input placeholder={t('ui.host')} className="w-full border-gray-300 rounded-md p-2 text-sm"
                                    onChange={e => handleDestConfigChange('host', e.target.value)} />
                                <input placeholder={t('ui.user')} className="w-full border-gray-300 rounded-md p-2 text-sm"
                                    onChange={e => handleDestConfigChange('user', e.target.value)} />
                                <input type="password" placeholder={t('ui.password_or_key')} className="w-full border-gray-300 rounded-md p-2 text-sm"
                                    onChange={e => handleDestConfigChange('pass', e.target.value)} />
                            </>
                        )}
                        {/* Other types would have fields managed ideally via Rclone config flow wrapper */}
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                        {testing ? t('ui.testing') : t('config.test_connection')}
                    </Button>
                </div>
            </Card>

            {/* Retention Policy */}
            <RetentionPolicy
                daily={config.retention_daily!}
                weekly={config.retention_weekly!}
                monthly={config.retention_monthly!}
                onChange={handleChange}
            />

            {/* Encryption Key (Sovereignty) */}
            <Card padding="md" className="border-l-4 border-yellow-400">
                <div className="flex items-center space-x-2 mb-2">
                    <Lock className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-medium text-lg text-yellow-800">{t('config.encryption_title')}</h3>
                </div>
                <p className="text-sm text-yellow-700 mb-4">{t('config.encryption_desc')}</p>

                <input
                    type="password"
                    placeholder={t('config.encryption_placeholder')}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2"
                    onChange={(e) => handleChange('encryption_key', e.target.value)}
                />
            </Card>

            {/* Save Action */}
            <div className="flex justify-end pt-4">
                <Button variant="default" size="lg" onClick={handleSave} disabled={loading} className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? t('ui.saving') : t('config.save')}
                </Button>
            </div>
        </div>
    );
};

export default BackupConfigForm;
