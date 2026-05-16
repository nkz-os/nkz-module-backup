import { defineModule } from '@nekazari/module-kit';
import { lazy } from 'react';
import './i18n';
import { moduleSlots } from './slots';
import pkg from '../package.json';

const MainPage = lazy(() => import('./App'));

export default defineModule({
  id: 'backup',
  displayName: 'Backup',
  version: pkg.version,
  hostApiVersion: '^2.0.0',
  description: 'Tenant data backup and restore — Nekazari Platform Module',
  accent: { base: '#475569', soft: '#F1F5F9', strong: '#1E293B' },
  icon: 'database-backup',
  main: MainPage,
  route: '/backup',
  slots: moduleSlots as never,
});
