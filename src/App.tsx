import React, { useState } from 'react';
import { useTranslation } from '@nekazari/sdk';
import { Card } from '@nekazari/ui-kit';
import { Settings, History, RotateCcw } from 'lucide-react';
import BackupConfigForm from './components/BackupConfigForm';
import JobHistory from './components/JobHistory';
import SnapshotTimeline from './components/SnapshotTimeline';
import './i18n';

const BackupApp: React.FC = () => {
    const { t } = useTranslation('backup');
    const [activeTab, setActiveTab] = useState<'config' | 'history' | 'restore'>('config');

    const tabs = [
        { id: 'config', label: t('tabs.config'), icon: Settings },
        { id: 'history', label: t('tabs.history'), icon: History },
        { id: 'restore', label: t('tabs.restore'), icon: RotateCcw },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'config' && <BackupConfigForm />}
                {activeTab === 'history' && <JobHistory />}
                {activeTab === 'restore' && <SnapshotTimeline />}
            </div>
        </div>
    );
};

export default BackupApp;
