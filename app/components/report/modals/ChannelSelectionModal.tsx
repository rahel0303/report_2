import React from 'react';
import { X, Instagram, Facebook, Twitter, Music2, Youtube } from 'lucide-react';

export type SocialChannel = 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'youtube';

interface ChannelOption {
  id: SocialChannel;
  name: string;
  icon: React.ElementType;
  description: string;
}

const CHANNELS: ChannelOption[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    description: 'Followers, Reach, Engagement, Saves',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    description: 'Followers, Reach, Reactions, Shares',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: Twitter,
    description: 'Followers, Impressions, Retweets, Replies',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music2,
    description: 'Followers, Views, Engagement, Shares',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    description: 'Subscribers, Views, Watch Time, Likes',
  },
];

interface ChannelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (channel: SocialChannel) => void;
}

export const ChannelSelectionModal: React.FC<ChannelSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Select Channel</h3>
            <p className="text-sm text-slate-500">Choose the social media platform for this slide</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CHANNELS.map((channel) => {
            const IconComponent = channel.icon;
            return (
              <button
                key={channel.id}
                onClick={() => onSelect(channel.id)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-800 rounded-xl flex items-center justify-center transition-colors">
                  <IconComponent size={24} className="text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">
                    {channel.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    {channel.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Utility function to get channel display name
export const getChannelDisplayName = (channel: SocialChannel): string => {
  const channelData = CHANNELS.find((c) => c.id === channel);
  return channelData?.name || channel;
};

// Utility function to get channel icon component
export const getChannelIconComponent = (channel: SocialChannel): React.ElementType => {
  const channelData = CHANNELS.find((c) => c.id === channel);
  return channelData?.icon || Instagram;
};

// Legacy function for backward compatibility
export const getChannelIcon = (channel: SocialChannel): string => {
  const iconMap: Record<SocialChannel, string> = {
    instagram: 'IG',
    facebook: 'FB',
    twitter: 'X',
    tiktok: 'TT',
    youtube: 'YT',
  };
  return iconMap[channel] || channel;
};

// Metric mapping for unified metrics
export const UNIFIED_METRICS: Record<string, Record<SocialChannel, string>> = {
  followers: {
    instagram: 'Followers',
    facebook: 'Followers',
    twitter: 'Followers',
    tiktok: 'Followers',
    youtube: 'Subscribers',
  },
  reach: {
    instagram: 'Reach',
    facebook: 'Reach',
    twitter: 'Impressions',
    tiktok: 'Views',
    youtube: 'Views',
  },
  engagement: {
    instagram: 'Engagement',
    facebook: 'Engagement',
    twitter: 'Engagement',
    tiktok: 'Engagement',
    youtube: 'Engagement',
  },
  likes: {
    instagram: 'Likes',
    facebook: 'Reactions',
    twitter: 'Likes',
    tiktok: 'Likes',
    youtube: 'Likes',
  },
  comments: {
    instagram: 'Comments',
    facebook: 'Comments',
    twitter: 'Replies',
    tiktok: 'Comments',
    youtube: 'Comments',
  },
  shares: {
    instagram: 'Shares',
    facebook: 'Shares',
    twitter: 'Retweets',
    tiktok: 'Shares',
    youtube: 'Shares',
  },
  saves: {
    instagram: 'Saves',
    facebook: 'Saves',
    twitter: 'Bookmarks',
    tiktok: 'Favorites',
    youtube: 'Saves',
  },
  er: {
    instagram: 'ER Reach',
    facebook: 'ER',
    twitter: 'ER',
    tiktok: 'ER',
    youtube: 'ER',
  },
};

// Get the channel-specific metric name
export const getChannelMetricName = (unifiedMetric: string, channel: SocialChannel): string => {
  return UNIFIED_METRICS[unifiedMetric.toLowerCase()]?.[channel] || unifiedMetric;
};
