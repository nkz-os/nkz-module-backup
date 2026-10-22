import { i18n } from '@nekazari/sdk';
import en from './locales/en.json';
import es from './locales/es.json';

const BACKUP_NAMESPACE = 'backup';

export function registerBackupTranslations(): void {
  if (!i18n || typeof (i18n as any).addResourceBundle !== 'function') return;
  i18n.addResourceBundle('en', BACKUP_NAMESPACE, en, true, true);
  i18n.addResourceBundle('es', BACKUP_NAMESPACE, es, true, true);
}

registerBackupTranslations();

