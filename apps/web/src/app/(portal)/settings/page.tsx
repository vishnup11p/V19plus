'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type Profile } from '../../../api/user';
import { useAuthStore } from '../../../store/authStore';
import { loadPlaybackPrefs, savePlaybackPrefs, type PlaybackPrefs } from '../../../utils/playbackPrefs';
import toast from 'react-hot-toast';
import { 
  User as UserIcon, 
  Users as UsersIcon, 
  CreditCard, 
  Play, 
  Trash2, 
  Laptop, 
  Smartphone, 
  ShieldAlert,
  Check, 
  Calendar, 
  LogOut,
  Settings as SettingsIcon,
  Info
} from 'lucide-react';

type Tab = 'account' | 'profiles' | 'subscription' | 'playback';

const TABS = [
  { id: 'account' as Tab, label: 'Account', icon: UserIcon },
  { id: 'profiles' as Tab, label: 'Profiles', icon: UsersIcon },
  { id: 'subscription' as Tab, label: 'Subscription', icon: CreditCard },
  { id: 'playback' as Tab, label: 'Playback', icon: Play },
];

const AVATAR_COLORS = [
  '#E50914', '#b44be1', '#2172d4', '#37a9ad',
  '#e3a21a', '#00a8e1', '#57b560', '#e55b2d',
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#FF5C00]' : 'bg-white/10'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
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
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [playback, setPlayback] = useState<PlaybackPrefs>({ autoplayNext: true, defaultSpeed: 1, subtitles: false });

  useEffect(() => {
    setPlayback(loadPlaybackPrefs());
  }, []);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  // Load profiles
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => (await userApi.listProfiles()).data,
  });

  // Load active devices (Netflix device management feature)
  const { data: devices, refetch: refetchDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => (await userApi.listDevices()).data,
    enabled: tab === 'account',
  });

  const updateMutation = useMutation({
    mutationFn: () => userApi.updateProfile({ name }),
    onSuccess: () => { 
      fetchMe(); 
      toast.success('Account updated successfully! ✨'); 
    },
  });

  const createMutation = useMutation({
    mutationFn: () => userApi.createProfile({ name: newProfileName, avatarColor: selectedColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setNewProfileName('');
      toast.success('Profile created successfully! 🎉');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create profile');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile deleted successfully');
    },
  });

  const revokeDeviceMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteDevice(id),
    onSuccess: () => {
      refetchDevices();
      toast.success('Device signed out successfully');
    },
  });

  const handleSavePlayback = (next: PlaybackPrefs) => {
    setPlayback(next);
    savePlaybackPrefs(next);
    toast.success('Playback preferences updated');
  };

  return (
    <div className="min-h-screen bg-[#0A0806] pt-28 pb-20 px-4 md:px-8 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-n-red/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF5C00]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF5C00]">
            <SettingsIcon className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Settings</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manage your accounts, active streaming profiles, and playback options</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Navigation Tabs */}
          <aside className="lg:w-60 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible scrollbar-hide pb-2 lg:pb-0">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap w-full text-left border ${
                      isActive
                        ? 'bg-white/5 border-white/15 text-white shadow-lg shadow-black/30'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF5C00]' : 'text-gray-400'}`} />
                    {t.label}
                    {isActive && (
                      <span className="w-1.5 h-4 rounded-full bg-[#FF5C00] ml-auto hidden lg:inline-block" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            
            {/* 👤 ACCOUNT TAB */}
            {tab === 'account' && (
              <div className="space-y-6">
                {/* Account card */}
                <div className="bg-[#12100E] border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-[#FF5C00]" />
                    Account details
                  </h2>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-4 bg-white/5 border border-white/5 rounded-xl mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FF5C00] flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-lg shadow-[#FF5C00]/25">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user?.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-base">{user?.name}</p>
                        <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                        <span className="inline-block text-[9px] uppercase tracking-wider text-[#FF5C00] font-black bg-[#FF5C00]/10 border border-[#FF5C00]/20 px-2 py-0.5 rounded-full mt-1.5">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Display Name</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#FF5C00]/50 focus:ring-1 focus:ring-[#FF5C00]/25 transition-all text-sm"
                        placeholder="Your display name"
                      />
                      <button
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending || !name.trim()}
                        className="px-6 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 💻 DEVICE MANAGEMENT (Netflix feature) */}
                <div className="bg-[#12100E] border border-white/10 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-[#FF5C00]" />
                    Registered Devices & Sessions
                  </h2>
                  <p className="text-xs text-gray-400 mb-6">These devices are currently logged in to your account. You can log out individual devices here.</p>

                  <div className="space-y-3">
                    {devices && devices.length > 0 ? (
                      devices.map((dev: any) => {
                        const isMobile = dev.deviceType?.toLowerCase().includes('mobile') || dev.userAgent?.toLowerCase().includes('android') || dev.userAgent?.toLowerCase().includes('iphone');
                        return (
                          <div key={dev.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-300 flex-shrink-0">
                                {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{dev.deviceName || 'Web Device'}</p>
                                <p className="text-xs text-gray-400 truncate">IP: {dev.ipAddress || 'Unknown'} · Last active {dev.lastActiveAt ? new Date(dev.lastActiveAt).toLocaleDateString('en-IN') : 'recently'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => revokeDeviceMutation.mutate(dev.id)}
                              disabled={revokeDeviceMutation.isPending}
                              className="w-8 h-8 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"
                              title="Sign out this device"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 py-3 text-center">No other devices found</p>
                    )}
                  </div>

                  <div className="pt-5 mt-5 border-t border-white/5">
                    <button
                      onClick={() => logout()}
                      className="text-sm text-red-500 hover:text-red-400 font-bold transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out of all sessions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 👥 PROFILES TAB */}
            {tab === 'profiles' && (
              <div className="bg-[#12100E] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-[#FF5C00]" />
                  Manage Profiles
                </h2>
                <p className="text-xs text-gray-400 mb-6">Profiles allow family members to have their own watchlists, suggestions, and watch history.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {profiles?.map((p: Profile) => (
                    <div key={p.id} className="group relative bg-white/5 border border-white/5 rounded-2xl p-4 text-center hover:border-white/15 transition-all">
                      <div
                        className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white relative shadow-lg"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-bold text-white truncate px-1">{p.name}</p>
                      {p.isKids && (
                        <span className="inline-block text-[9px] uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded-md mt-1 font-bold">
                          Kids
                        </span>
                      )}

                      {/* Delete profile overlay button */}
                      <button 
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-500 border border-white/5 hover:border-red-600 flex items-center justify-center text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <h3 className="text-sm font-bold text-white">Create New Profile</h3>
                  
                  <div className="flex gap-2.5 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-7 h-7 rounded-lg transition-all ${selectedColor === c ? 'ring-2 ring-[#FF5C00] ring-offset-2 ring-offset-[#12100E] scale-110' : 'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Enter profile name"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#FF5C00]/50 transition-all text-sm"
                    />
                    <button
                      onClick={() => createMutation.mutate()}
                      disabled={!newProfileName.trim() || createMutation.isPending}
                      className="px-6 py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/85 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
                    >
                      {createMutation.isPending ? '...' : 'Add Profile'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ⭐ SUBSCRIPTION TAB */}
            {tab === 'subscription' && (
              <div className="bg-[#12100E] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#FF5C00]" />
                  Subscription Plan
                </h2>
                
                <div className="space-y-4">
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/20 px-2 py-0.5 rounded-full">
                        ACTIVE PLAN
                      </span>
                      <h3 className="font-extrabold text-white text-xl mt-2">V19 Premium Membership</h3>
                      <p className="text-sm text-gray-400">Stream unlimited premium video, movies, and TV shows in Full HD.</p>
                    </div>
                    <span className="text-sm font-bold text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/20 px-4 py-2 rounded-xl">
                      FREE TIER
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 p-3 bg-white/5 rounded-xl border border-white/5">
                    <Info className="w-4 h-4 text-[#FF5C00] flex-shrink-0" />
                    <span>Subscriptions pricing cards are currently commented out to offer access free of cost. Enjoy streaming!</span>
                  </div>
                </div>
              </div>
            )}

            {/* ▶️ PLAYBACK PREFERENCES */}
            {tab === 'playback' && (
              <div className="bg-[#12100E] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Play className="w-5 h-5 text-[#FF5C00]" />
                  Playback Preferences
                </h2>

                <div className="divide-y divide-white/5">
                  {[
                    { key: 'autoplayNext', label: 'Autoplay next episode', desc: 'Automatically play the next episode when one ends' },
                    { key: 'subtitles', label: 'Subtitles by default', desc: 'Show subtitles whenever available' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-gray-300">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={playback[item.key as keyof PlaybackPrefs] as boolean}
                        onChange={(v) => handleSavePlayback({ ...playback, [item.key]: v })}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-sm font-bold text-gray-300 mb-3">Default Playback Speed</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSavePlayback({ ...playback, defaultSpeed: s })}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                          playback.defaultSpeed === s
                            ? 'bg-[#FF5C00] border-[#FF5C00] text-white shadow-lg shadow-[#FF5C00]/25'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10'
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
