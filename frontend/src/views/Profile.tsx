import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type Profile as ProfileType } from '../api/user';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  '#E50914', '#b44be1', '#2172d4', '#37a9ad',
  '#e3a21a', '#00a8e1', '#57b560', '#e55b2d',
];

export function Profile() {
  const { user, fetchMe } = useAuthStore();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name || '');
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => (await userApi.listProfiles()).data,
  });

  const updateMutation = useMutation({
    mutationFn: () => userApi.updateProfile({ name }),
    onSuccess: () => { fetchMe(); toast.success('Profile updated'); },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Failed to update profile';
      toast.error(msg);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => userApi.createProfile({ name: newProfileName, avatarColor: selectedColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setNewProfileName('');
      toast.success('Profile created');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Failed to create profile';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile deleted');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Failed to delete profile';
      toast.error(msg);
    },
  });

  return (
    <div className="min-h-screen bg-n-bg pt-24 pb-16 px-4 md:px-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-n-white mb-2">My Profile</h1>
          <p className="text-n-muted">Manage your account and viewing profiles</p>
        </div>

        {/* Account section */}
        <div className="bg-n-surface border border-n-divider rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-n-white mb-5">Account</h2>

          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-n-red flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <p className="font-bold text-n-white text-lg">{user?.name}</p>
              <p className="text-n-muted text-sm">{user?.email}</p>
              {user?.subscription && (
                <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-n-red/20 border border-n-red/30 text-n-red rounded-full font-medium">
                  {user.subscription.plan} · {user.subscription.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              className="flex-1 px-4 py-3 bg-n-raised border border-n-divider rounded-xl text-n-text placeholder:text-n-muted focus:outline-none focus:border-n-white/40 transition-colors text-sm"
            />
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !name.trim()}
              className="px-6 py-3 bg-n-white hover:bg-n-white/80 text-black font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>

          {!user?.subscription && (
            <div className="mt-5 pt-5 border-t border-n-divider">
              <p className="text-n-muted text-sm mb-3">Unlock all content with a subscription</p>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-n-red hover:bg-n-red-hover text-white font-semibold rounded-lg text-sm transition-colors"
              >
                View Plans →
              </Link>
            </div>
          )}
        </div>

        {/* Profiles section */}
        <div className="bg-n-surface border border-n-divider rounded-2xl p-6">
          <h2 className="text-lg font-bold text-n-white mb-5">Viewing Profiles</h2>

          {profiles && profiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
              {profiles.map((p: ProfileType) => (
                <div key={p.id} className="group text-center">
                  <div
                    className="w-16 h-16 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl font-black text-white relative overflow-hidden cursor-pointer"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="text-white"
                        aria-label="Remove profile"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-n-text truncate">{p.name}</p>
                  {p.isKids && <p className="text-2xs text-n-muted">Kids</p>}
                </div>
              ))}
            </div>
          )}

          {/* Add profile */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-n-text">Add Profile</p>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((c: any) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${selectedColor === c ? 'ring-2 ring-n-white ring-offset-2 ring-offset-n-surface scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={newProfileName}
                onChange={(e: any) => setNewProfileName(e.target.value)}
                placeholder="Profile name"
                className="flex-1 px-4 py-3 bg-n-raised border border-n-divider rounded-xl text-n-text placeholder:text-n-muted focus:outline-none focus:border-n-white/40 transition-colors text-sm"
              />
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newProfileName.trim() || createMutation.isPending}
                className="px-6 py-3 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
