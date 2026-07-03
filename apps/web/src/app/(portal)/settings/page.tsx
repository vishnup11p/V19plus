'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type Profile } from '../../../api/user';
import { useAuthStore } from '../../../store/authStore';
import { loadPlaybackPrefs, savePlaybackPrefs, type PlaybackPrefs } from '../../../utils/playbackPrefs';
import toast from 'react-hot-toast';

type Tab = 'account' | 'profiles' | 'subscription' | 'playback';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'profiles', label: 'Profiles', icon: '👥' },
  { id: 'subscription', label: 'Subscription', icon: '⭐' },
  { id: 'playback', label: 'Playback', icon: '▶️' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-red-500' : 'bg-white/10'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, fetchMe, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('account');
  const [name, setName] = useState(user?.name || '');
  const [newProfileName, setNewProfileName] = useState('');
  const [playback, setPlayback] = useState<PlaybackPrefs>({ autoplayNext: true, defaultSpeed: 1, subtitles: false });

  useEffect(() => {
    setPlayback(loadPlaybackPrefs());
  }, []);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => (await userApi.listProfiles()).data,
  });

  const updateMutation = useMutation({
    mutationFn: () => userApi.updateProfile({ name }),
    onSuccess: () => { fetchMe(); toast.success('Account updated'); },
  });

  const createMutation = useMutation({
    mutationFn: () => userApi.createProfile({ name: newProfileName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setNewProfileName('');
      toast.success('Profile created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile removed');
    },
  });

  const handleSavePlayback = (next: PlaybackPrefs) => {
    setPlayback(next);
    savePlaybackPrefs(next);
    toast.success('Preferences saved');
  };

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-16 px-4 md:px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-1">Settings</h1>
          <p className="text-gray-400">Manage your account, profiles, and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <aside className="md:w-48 flex-shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-hide">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors w-full text-left ${
                    tab === t.id
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'account' && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white">Account Details</h2>

                {/* Avatar + info */}
                <div className="flex items-center gap-4 p-4 bg-[#252525] rounded-xl">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-red-500 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : user?.name?.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="font-bold text-white">{user?.name}</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{user?.role}</span>
                  </div>
                </div>

                {/* Name field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <div className="flex gap-3">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 px-4 py-3 bg-[#252525] border border-white/10 rounded-xl text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-white/40 transition-colors text-sm"
                    />
                    <button
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending}
                      className="px-6 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
                    >
                      {updateMutation.isPending ? '...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Sign out */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => logout()}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out of all devices
                  </button>
                </div>
              </div>
            )}

            {tab === 'profiles' && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-5">Viewing Profiles</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
                  {profiles?.map((p: Profile) => (
                    <div key={p.id} className="group text-center">
                      <div
                        className="w-16 h-16 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl font-bold text-white relative cursor-pointer"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <button onClick={() => deleteMutation.mutate(p.id)} className="text-white p-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 truncate">{p.name}</p>
                      {p.isKids && <p className="text-[10px] text-gray-500">Kids</p>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="New profile name"
                    className="flex-1 px-4 py-3 bg-[#252525] border border-white/10 rounded-xl text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-white/40 transition-colors text-sm"
                  />
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={!newProfileName.trim() || createMutation.isPending}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {tab === 'subscription' && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-5">Subscription</h2>
                {user?.subscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[#252525] rounded-xl">
                      <div>
                        <p className="text-sm text-gray-400">Current Plan</p>
                        <p className="font-bold text-red-500 text-lg">{user.subscription.plan}</p>
                      </div>
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                        user.subscription.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'
                      }`}>
                        {user.subscription.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Renews: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <Link
                      href="/subscription"
                      className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      Manage Subscription →
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-5 text-sm">No active subscription. Subscribe to unlock all content.</p>
                    <Link
                      href="/subscription"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                    >
                      View Plans →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {tab === 'playback' && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 space-y-5">
                <h2 className="text-lg font-bold text-white mb-2">Playback Preferences</h2>

                {[
                  { key: 'autoplayNext', label: 'Autoplay next episode', desc: 'Automatically play the next episode when one ends' },
                  { key: 'subtitles', label: 'Subtitles by default', desc: 'Show subtitles whenever available' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-300">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={playback[item.key as keyof PlaybackPrefs] as boolean}
                      onChange={(v) => handleSavePlayback({ ...playback, [item.key]: v })}
                    />
                  </div>
                ))}

                <div className="py-3">
                  <p className="text-sm font-medium text-gray-300 mb-3">Default playback speed</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSavePlayback({ ...playback, defaultSpeed: s })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          playback.defaultSpeed === s
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-[#252525] border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/30'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
