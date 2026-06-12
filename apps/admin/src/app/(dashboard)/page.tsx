'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Users, Film, FolderTree, PlayCircle, Eye, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await adminApi.dashboard()).data,
  });

  const cards = [
    {
      label: 'Total Users',
      value: stats?.users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      icon: Users,
      href: '/users'
    },
    {
      label: 'Movies & Series',
      value: stats?.content,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      icon: Film,
      href: '/content'
    },
    {
      label: 'Browse Genres',
      value: stats?.categories,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      icon: FolderTree,
      href: '/categories'
    },
    {
      label: 'Watch Sessions',
      value: stats?.watchHistory,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      icon: PlayCircle,
      href: '/content'
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Overview</h1>
        <p className="text-gray-400">Manage, scale, and analyze your V19+ OTT streaming platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-[#141414] rounded-2xl p-6 border ${card.borderColor} flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 relative group`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <Link
                  href={card.href}
                  className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  {isLoading ? (
                    <div className="w-16 h-8 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    card.value ?? 0
                  )}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#222] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Quick Administrative Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/content"
              className="flex flex-col justify-between p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#2d2d2d] rounded-xl group transition-all"
            >
              <div>
                <h3 className="font-semibold text-white group-hover:text-red-500 transition-colors">Add New Content</h3>
                <p className="text-xs text-gray-400 mt-1">Upload files and trigger HLS transcode.</p>
              </div>
              <span className="text-xs text-red-500 font-semibold mt-4 flex items-center gap-1">
                Go to Content Manager &rarr;
              </span>
            </Link>

            <Link
              href="/categories"
              className="flex flex-col justify-between p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#2d2d2d] rounded-xl group transition-all"
            >
              <div>
                <h3 className="font-semibold text-white group-hover:text-red-500 transition-colors">Manage Genres</h3>
                <p className="text-xs text-gray-400 mt-1">Create or reorder browse catalog categories.</p>
              </div>
              <span className="text-xs text-red-500 font-semibold mt-4 flex items-center gap-1">
                Go to Genres &rarr;
              </span>
            </Link>

            <Link
              href="/users"
              className="flex flex-col justify-between p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#2d2d2d] rounded-xl group transition-all"
            >
              <div>
                <h3 className="font-semibold text-white group-hover:text-red-500 transition-colors">User Profiles</h3>
                <p className="text-xs text-gray-400 mt-1">Audit active user subscriptions & access permissions.</p>
              </div>
              <span className="text-xs text-red-500 font-semibold mt-4 flex items-center gap-1">
                Go to Users &rarr;
              </span>
            </Link>

            <Link
              href="/settings"
              className="flex flex-col justify-between p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#2d2d2d] rounded-xl group transition-all"
            >
              <div>
                <h3 className="font-semibold text-white group-hover:text-red-500 transition-colors">Brand Settings</h3>
                <p className="text-xs text-gray-400 mt-1">Configure portal styling, logos, and headers.</p>
              </div>
              <span className="text-xs text-red-500 font-semibold mt-4 flex items-center gap-1">
                Configure Branding &rarr;
              </span>
            </Link>
          </div>
        </div>

        {/* Platform Status */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">System Health</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#222]">
                <span className="text-gray-400">Database Server</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#222]">
                <span className="text-gray-400">Redis Cache</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#222]">
                <span className="text-gray-400">Transcode Engine</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Ready (FFmpeg)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-1.5">
                <span className="text-gray-400">Storage CDN</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-[#222] mt-6">
            <p className="text-xs text-gray-500 text-center">
              V19+ Admin Control Panel &bull; v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
