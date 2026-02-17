import { NKZClient } from '@nekazari/sdk';

const client = new NKZClient({
    baseUrl: '/api/backup'
    // NKZClient handles auth token injection automatically
});

export interface BackupSource {
    type: string;
    connection_string?: string;
    [key: string]: any;
}

export interface BackupConfig {
    tenant_id: string;
    enabled: boolean;
    schedule_cron: string;
    retention_daily: number;
    retention_weekly: number;
    retention_monthly: number;
    sources: BackupSource[];
    destination_type: string;
    destination_config: Record<string, any>;
    encryption_key?: string; // Optional in response (redacted)
    last_backup_at?: string;
    last_backup_status?: string;
}

export const backupApi = {
    getConfig: async () => {
        return client.get<BackupConfig>('/config');
    },

    updateConfig: async (config: Partial<BackupConfig>) => {
        return client.put<BackupConfig>('/config', config);
    },

    testConnection: async (config: Partial<BackupConfig>) => {
        return client.post<{ status: string }>('/test-connection', config.destination_config);
    },

    triggerBackup: async () => {
        return client.post<{ job_id: string }>('/trigger', {});
    },

    getJobs: async () => {
        return client.get<any[]>('/jobs');
    },

    getSnapshots: async () => {
        return client.get<any[]>('/snapshots');
    },

    triggerRestore: async (snapshotId: string, type: 'full' | 'download', token?: string) => {
        return client.post<{ job_id: string }>('/restore', {
            snapshot_id: snapshotId,
            type,
            confirmation_token: token
        });
    }
};
