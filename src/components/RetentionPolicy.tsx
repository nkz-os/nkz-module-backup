import React from 'react';
import { Card } from '@nekazari/ui-kit';
import { useTranslation } from '@nekazari/sdk';

interface RetentionPolicyProps {
    daily: number;
    weekly: number;
    monthly: number;
    onChange: (key: string, val: number) => void;
}

const RetentionPolicy: React.FC<RetentionPolicyProps> = ({ daily, weekly, monthly, onChange }) => {
    const { t } = useTranslation('backup');

    const Slider = ({ label, value, min, max, onChange }: any) => (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">{label}</span>
                <span className="text-indigo-600 font-bold">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
        </div>
    );

    return (
        <Card padding="md" className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">{t('retention.title')}</h3>
            <p className="text-sm text-gray-500">{t('retention.explanation')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <Slider
                    label={t('retention.daily')}
                    value={daily}
                    min={1} max={60}
                    onChange={(v: number) => onChange('retention_daily', v)}
                />
                <Slider
                    label={t('retention.weekly')}
                    value={weekly}
                    min={1} max={52}
                    onChange={(v: number) => onChange('retention_weekly', v)}
                />
                <Slider
                    label={t('retention.monthly')}
                    value={monthly}
                    min={1} max={24}
                    onChange={(v: number) => onChange('retention_monthly', v)}
                />
            </div>
        </Card>
    );
};

export default RetentionPolicy;
