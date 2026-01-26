// Dummy data for all templates based on brand
export const brandDummyData: Record<string, any> = {
  BYD: {
    layout_dashboard: {
      chart: {
        chartType: 'line',
        data: [
          { name: 'Week 1', val: 4500, val2: 3200 },
          { name: 'Week 2', val: 5200, val2: 3800 },
          { name: 'Week 3', val: 4800, val2: 4100 },
          { name: 'Week 4', val: 6100, val2: 4500 },
        ],
      },
      insights: {
        content:
          '✨ Engagement increased 35% with electric vehicle launch campaign\n📊 Peak performance during weekend promotional posts\n🎯 Target audience: Tech-savvy millennials aged 25-40',
      },
      table: {
        tableType: 'performance',
        data: [
          ['Instagram', '45.2K', '2.8M', '5.2%', '+12%'],
          ['Facebook', '32.1K', '1.9M', '4.1%', '+8%'],
          ['TikTok', '28.5K', '2.1M', '6.8%', '+18%'],
        ],
      },
    },
    layout_comparison: {
      chart_a: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 3500 },
          { name: 'Feb', val: 4200 },
          { name: 'Mar', val: 3800 },
          { name: 'Apr', val: 5100 },
        ],
      },
      chart_b: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 2800 },
          { name: 'Feb', val: 3100 },
          { name: 'Mar', val: 2900 },
          { name: 'Apr', val: 3600 },
        ],
      },
    },
    layout_kpi: {
      metric_1: {
        id: 'reach',
        label: 'Total Reach',
        value: '2.4M',
        trend: 'up' as const,
        trendValue: '+18.5%',
      },
      metric_2: {
        id: 'er',
        label: 'Engagement Rate',
        value: '5.8%',
        trend: 'up' as const,
        trendValue: '+2.3%',
      },
      metric_3: {
        id: 'impressions',
        label: 'Impressions',
        value: '3.2M',
        trend: 'up' as const,
        trendValue: '+15%',
      },
      metric_4: {
        id: 'growth',
        label: 'Follower Growth',
        value: '+12.4%',
        trend: 'up' as const,
        trendValue: '+3.1%',
      },
      chart: {
        chartType: 'line',
        data: [
          { name: 'W1', val: 45000, val2: 32000 },
          { name: 'W2', val: 52000, val2: 38000 },
          { name: 'W3', val: 48000, val2: 41000 },
          { name: 'W4', val: 61000, val2: 45000 },
        ],
      },
      insights: {
        content:
          '🚗 BYD Seal campaign drove record engagement\n📈 Video content outperformed static posts by 2.5x\n💡 Peak activity hours: 7-9 PM',
      },
    },
    layout_content: {
      insights: {
        content:
          '📱 Top performing content: Electric SUV showcase video\n🎬 Average watch time: 45 seconds\n💬 Comments focused on pricing and features\n🔥 Viral potential detected in Gen Z audience',
      },
    },
  },
  Dior: {
    layout_dashboard: {
      chart: {
        chartType: 'line',
        data: [
          { name: 'Week 1', val: 125000, val2: 98000 },
          { name: 'Week 2', val: 142000, val2: 115000 },
          { name: 'Week 3', val: 138000, val2: 121000 },
          { name: 'Week 4', val: 165000, val2: 142000 },
        ],
      },
      insights: {
        content:
          '✨ Miss Dior fragrance launch exceeded engagement targets by 42%\n👗 Fashion Week coverage generated 3.2M impressions\n🌟 Influencer collaborations drove 65% of conversions',
      },
      table: {
        tableType: 'performance',
        data: [
          ['Instagram', '1.2M', '18.5M', '8.2%', '+25%'],
          ['Facebook', '850K', '12.3M', '6.8%', '+15%'],
          ['TikTok', '620K', '9.8M', '12.5%', '+35%'],
        ],
      },
    },
    layout_comparison: {
      chart_a: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 125000 },
          { name: 'Feb', val: 148000 },
          { name: 'Mar', val: 142000 },
          { name: 'Apr', val: 168000 },
        ],
      },
      chart_b: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 98000 },
          { name: 'Feb', val: 112000 },
          { name: 'Mar', val: 108000 },
          { name: 'Apr', val: 125000 },
        ],
      },
    },
    layout_kpi: {
      metric_1: {
        id: 'reach',
        label: 'Total Reach',
        value: '18.5M',
        trend: 'up' as const,
        trendValue: '+28%',
      },
      metric_2: {
        id: 'er',
        label: 'Engagement Rate',
        value: '8.2%',
        trend: 'up' as const,
        trendValue: '+3.5%',
      },
      metric_3: {
        id: 'impressions',
        label: 'Impressions',
        value: '24.8M',
        trend: 'up' as const,
        trendValue: '+32%',
      },
      metric_4: {
        id: 'growth',
        label: 'Follower Growth',
        value: '+22.8%',
        trend: 'up' as const,
        trendValue: '+8.2%',
      },
      chart: {
        chartType: 'line',
        data: [
          { name: 'W1', val: 125000, val2: 98000 },
          { name: 'W2', val: 148000, val2: 115000 },
          { name: 'W3', val: 142000, val2: 121000 },
          { name: 'W4', val: 168000, val2: 142000 },
        ],
      },
      insights: {
        content:
          '💎 Luxury collection posts achieved highest engagement ever\n📸 Carousel posts outperformed single images by 3.2x\n🌍 International audience growth: +45% in Asia Pacific',
      },
    },
    layout_content: {
      insights: {
        content:
          "👜 Best performing post: J'adore perfume campaign video\n🎭 Behind-the-scenes content received 2.8M views\n✨ UGC featuring Dior products increased 125%\n🏆 Brand sentiment: 94% positive",
      },
    },
  },
  Apple: {
    layout_dashboard: {
      chart: {
        chartType: 'line',
        data: [
          { name: 'Week 1', val: 850000, val2: 620000 },
          { name: 'Week 2', val: 920000, val2: 715000 },
          { name: 'Week 3', val: 1050000, val2: 820000 },
          { name: 'Week 4', val: 1280000, val2: 950000 },
        ],
      },
      insights: {
        content:
          '📱 iPhone 15 Pro launch campaign shattered all records\n🎬 Shot on iPhone campaign generated 45M organic impressions\n🌟 Vision Pro teasers achieved 92% positive sentiment',
      },
      table: {
        tableType: 'performance',
        data: [
          ['Instagram', '32.5M', '450M', '12.5%', '+42%'],
          ['YouTube', '28.2M', '520M', '8.8%', '+35%'],
          ['Twitter', '18.5M', '280M', '6.2%', '+28%'],
        ],
      },
    },
    layout_comparison: {
      chart_a: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 850000 },
          { name: 'Feb', val: 920000 },
          { name: 'Mar', val: 1050000 },
          { name: 'Apr', val: 1280000 },
        ],
      },
      chart_b: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 620000 },
          { name: 'Feb', val: 715000 },
          { name: 'Mar', val: 820000 },
          { name: 'Apr', val: 950000 },
        ],
      },
    },
    layout_kpi: {
      metric_1: {
        id: 'reach',
        label: 'Total Reach',
        value: '450M',
        trend: 'up' as const,
        trendValue: '+42%',
      },
      metric_2: {
        id: 'er',
        label: 'Engagement Rate',
        value: '12.5%',
        trend: 'up' as const,
        trendValue: '+5.2%',
      },
      metric_3: {
        id: 'impressions',
        label: 'Impressions',
        value: '520M',
        trend: 'up' as const,
        trendValue: '+38%',
      },
      metric_4: {
        id: 'growth',
        label: 'Follower Growth',
        value: '+18.5%',
        trend: 'up' as const,
        trendValue: '+4.8%',
      },
      chart: {
        chartType: 'line',
        data: [
          { name: 'W1', val: 850000, val2: 620000 },
          { name: 'W2', val: 920000, val2: 715000 },
          { name: 'W3', val: 1050000, val2: 820000 },
          { name: 'W4', val: 1280000, val2: 950000 },
        ],
      },
      insights: {
        content:
          '🍎 Product launch videos achieved record 95M views\n💻 MacBook Air campaign resonated with creative professionals\n🎯 Ad conversion rate: 8.2% (industry avg: 3.5%)',
      },
    },
    layout_content: {
      insights: {
        content:
          '📱 iPhone cinematography posts dominate engagement\n🎨 Creative community content shows 240% YoY growth\n⚡ AirPods Pro features most shared product content\n🏆 Apple Ecosystem messaging drives premium positioning',
      },
    },
  },
  Nestle: {
    layout_dashboard: {
      chart: {
        chartType: 'line',
        data: [
          { name: 'Week 1', val: 185000, val2: 142000 },
          { name: 'Week 2', val: 225000, val2: 168000 },
          { name: 'Week 3', val: 208000, val2: 185000 },
          { name: 'Week 4', val: 265000, val2: 212000 },
        ],
      },
      insights: {
        content:
          '🥛 Plant-based product line campaign exceeded targets by 58%\n👪 Family-focused content resonates with millennial parents\n🌱 Sustainability messaging drives 72% positive brand sentiment',
      },
      table: {
        tableType: 'performance',
        data: [
          ['Instagram', '2.8M', '35.5M', '7.2%', '+32%'],
          ['Facebook', '3.5M', '42.8M', '5.8%', '+22%'],
          ['YouTube', '1.8M', '28.5M', '9.5%', '+38%'],
        ],
      },
    },
    layout_comparison: {
      chart_a: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 185000 },
          { name: 'Feb', val: 225000 },
          { name: 'Mar', val: 208000 },
          { name: 'Apr', val: 265000 },
        ],
      },
      chart_b: {
        chartType: 'column',
        data: [
          { name: 'Jan', val: 142000 },
          { name: 'Feb', val: 168000 },
          { name: 'Mar', val: 185000 },
          { name: 'Apr', val: 212000 },
        ],
      },
    },
    layout_kpi: {
      metric_1: {
        id: 'reach',
        label: 'Total Reach',
        value: '35.5M',
        trend: 'up' as const,
        trendValue: '+32%',
      },
      metric_2: {
        id: 'er',
        label: 'Engagement Rate',
        value: '7.2%',
        trend: 'up' as const,
        trendValue: '+2.8%',
      },
      metric_3: {
        id: 'impressions',
        label: 'Impressions',
        value: '42.8M',
        trend: 'up' as const,
        trendValue: '+28%',
      },
      metric_4: {
        id: 'growth',
        label: 'Follower Growth',
        value: '+15.8%',
        trend: 'up' as const,
        trendValue: '+5.2%',
      },
      chart: {
        chartType: 'line',
        data: [
          { name: 'W1', val: 185000, val2: 142000 },
          { name: 'W2', val: 225000, val2: 168000 },
          { name: 'W3', val: 208000, val2: 185000 },
          { name: 'W4', val: 265000, val2: 212000 },
        ],
      },
      insights: {
        content:
          '☕ Nescafé summer campaign drove 2.5M+ interactions\n🍫 KitKat social media challenge went viral: 18M views\n👶 Baby nutrition content trusted by 85% of parents',
      },
    },
    layout_content: {
      insights: {
        content:
          '🎯 Recipe videos generate highest engagement (avg 450K views)\n👨‍👩‍👧 Family moments resonate strongest with core audience\n🌿 Eco-friendly packaging posts show 180% higher sharing\n💬 Community engagement rate 3x industry average',
      },
    },
  },
};

// Helper function to get dummy data for a brand and template type
export function getDummyDataForTemplate(brandName: string, templateType: string): any {
  return brandDummyData[brandName]?.[templateType] || {};
}
