import BackupStatusWidget from '../components/BackupStatusWidget';

const MODULE_ID = 'backup';

export const moduleSlots = {
  'dashboard-widget': [
    {
      id: 'backup-status',
      moduleId: MODULE_ID,
      component: 'BackupStatusWidget',
      localComponent: BackupStatusWidget,
      priority: 10,
    },
  ],
};
