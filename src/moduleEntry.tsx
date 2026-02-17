import React from 'react';
import BackupApp from './App';
import BackupStatusWidget from './components/BackupStatusWidget';

// Module Provider (optional context if needed)
const BackupModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{ children } </>;
};

// Register module
if (window.__NKZ__) {
    window.__NKZ__.register({
        id: 'backup',
        provider: BackupModuleProvider,
        // Define where components render
        viewerSlots: {
            'dashboard-widget': [
                {
                    component: BackupStatusWidget,
                    props: {}
                }
            ],
            // Defines the main route component (handled by host routing to /backup)
            'route-component': [
                {
                    path: '/backup',
                    component: BackupApp
                }
            ]
        }
    });
}
