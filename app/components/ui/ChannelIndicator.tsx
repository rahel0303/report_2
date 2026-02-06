import React from 'react';
import { Instagram, Facebook, Twitter, Music2, Youtube } from 'lucide-react';
import type { SocialChannel } from '@/app/components/report/modals';

interface ChannelIndicatorProps {
  channel?: SocialChannel | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const CHANNEL_CONFIG: Record<SocialChannel, { icon: React.ElementType; label: string; shortLabel: string }> = {
  instagram: { icon: Instagram, label: 'Instagram', shortLabel: 'IG' },
  facebook: { icon: Facebook, label: 'Facebook', shortLabel: 'FB' },
  twitter: { icon: Twitter, label: 'Twitter/X', shortLabel: 'X' },
  tiktok: { icon: Music2, label: 'TikTok', shortLabel: 'TT' },
  youtube: { icon: Youtube, label: 'YouTube', shortLabel: 'YT' },
};

const SIZE_CONFIG = {
  sm: { icon: 14, text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1' },
  md: { icon: 16, text: 'text-sm', padding: 'px-3 py-1.5', gap: 'gap-1.5' },
  lg: { icon: 20, text: 'text-base', padding: 'px-4 py-2', gap: 'gap-2' },
};

export const ChannelIndicator: React.FC<ChannelIndicatorProps> = ({
  channel,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  if (!channel) return null;

  const channelData = CHANNEL_CONFIG[channel];
  const sizeData = SIZE_CONFIG[size];
  const IconComponent = channelData.icon;

  return (
    <div
      className={`inline-flex items-center ${sizeData.gap} ${sizeData.padding} bg-slate-100 rounded-lg border border-slate-200 ${className}`}
    >
      <IconComponent size={sizeData.icon} className="text-slate-600" />
      {showLabel && (
        <span className={`font-semibold text-slate-700 ${sizeData.text}`}>
          {channelData.label}
        </span>
      )}
    </div>
  );
};

// Large version for slide corner
export const ChannelBadge: React.FC<{
  channel?: SocialChannel | null;
  isDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  channel,
  isDark = false,
  size = 'lg',
}) => {
  if (!channel) return null;

  const channelData = CHANNEL_CONFIG[channel];
  const IconComponent = channelData.icon;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shadow-md ${
        isDark
          ? 'bg-white/10 text-white border border-white/20'
          : 'bg-slate-800 text-white'
      }`}
      title={channelData.label}
    >
      <IconComponent size={iconSizes[size]} />
    </div>
  );
};
