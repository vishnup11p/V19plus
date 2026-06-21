import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi, Profile } from '../../api/user';
import { useAuthStore, ActiveProfile } from '../../store/authStore';

interface ProfilePickerProps {
  onSelect: () => void;
}

function PinModal({ profile, onConfirm, onCancel }: {
  profile: Profile;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (pin === (profile as any).pin) {
      onConfirm();
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-n-surface border border-n-divider rounded-2xl p-8 w-full max-w-sm text-center"
      >
        <div
          className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white"
          style={{ backgroundColor: profile.avatarColor }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-n-white mb-1">Profile Lock</h2>
        <p className="text-n-muted text-sm mb-6">Enter PIN for <span className="text-n-white font-semibold">{profile.name}</span></p>

        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
                pin.length > i ? 'border-n-red bg-n-red/20 text-n-red' : 'border-n-divider'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, i) => (
            <button
              key={i}
              onClick={() => {
                if (k === '⌫') {
                  setPin((p) => p.slice(0, -1));
                  setError('');
                } else if (k !== '' && pin.length < 4) {
                  const next = pin + String(k);
                  setPin(next);
                  if (next.length === 4) {
                    setTimeout(() => {
                      if (next === (profile as any).pin) {
                        onConfirm();
                      } else {
                        setError('Incorrect PIN. Try again.');
                        setPin('');
                      }
                    }, 150);
                  }
                }
              }}
              disabled={k === ''}
              className={`h-12 rounded-xl font-semibold text-lg transition-colors ${
                k === '' ? 'invisible' : 'bg-n-raised hover:bg-n-divider text-n-white active:scale-95'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm text-n-muted hover:text-n-white border border-n-divider rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-bold bg-n-red hover:bg-n-red-hover text-white rounded-xl transition-colors">
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProfilePicker({ onSelect }: ProfilePickerProps) {
  const { user, setActiveProfile } = useAuthStore();
  const [pinProfile, setPinProfile] = useState<Profile | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => (await userApi.listProfiles()).data,
  });

  const handleSelectProfile = (profile: Profile) => {
    if ((profile as any).pin) {
      setPinProfile(profile);
    } else {
      confirmSelect(profile);
    }
  };

  const confirmSelect = (profile: Profile) => {
    const active: ActiveProfile = {
      id: profile.id,
      name: profile.name,
      avatarColor: profile.avatarColor,
      isKids: profile.isKids,
    };
    setActiveProfile(active);
    setPinProfile(null);
    onSelect();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-n-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-n-divider border-t-n-red animate-spin" />
      </div>
    );
  }

  const hasProfiles = profiles && profiles.length > 0;

  return (
    <div className="min-h-screen bg-n-black flex flex-col items-center justify-center px-4 animate-fade-in">
      <AnimatePresence>
        {pinProfile && (
          <PinModal
            profile={pinProfile}
            onConfirm={() => confirmSelect(pinProfile)}
            onCancel={() => setPinProfile(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        {/* Logo */}
        <div className="mb-10">
          <img src="/logo.png" alt="V19+" className="h-10 mx-auto object-contain" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-n-white mb-2">Who's watching?</h1>
        <p className="text-n-muted mb-12">Choose your profile to continue</p>

        {hasProfiles ? (
          <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto mb-10">
            {profiles!.map((profile, i) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => handleSelectProfile(profile)}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <div
                  className="w-24 h-24 md:w-28 md:h-28 rounded-xl flex items-center justify-center text-4xl font-black text-white transition-all duration-200 group-hover:ring-4 group-hover:ring-white group-hover:scale-105 shadow-lg"
                  style={{ backgroundColor: profile.avatarColor }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-n-text font-medium group-hover:text-n-white transition-colors">{profile.name}</p>
                  {profile.isKids && (
                    <span className="text-2xs bg-n-red/20 text-n-red px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Kids</span>
                  )}
                  {(profile as any).pin && (
                    <span className="text-2xs text-n-muted">🔒 Locked</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-n-muted mb-2">No profiles yet</p>
            <p className="text-n-muted text-sm">Create profiles in Settings to get started</p>
          </div>
        )}

        {/* Manage / skip */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              // Use the account owner's profile as default
              if (user) {
                setActiveProfile({
                  id: 'default',
                  name: user.name,
                  avatarColor: '#E50914',
                  isKids: false,
                });
                onSelect();
              }
            }}
            className="px-6 py-2.5 border border-n-muted/50 text-n-muted hover:border-n-white hover:text-n-white rounded-xl text-sm font-medium transition-colors"
          >
            Continue as {user?.name?.split(' ')[0]}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
