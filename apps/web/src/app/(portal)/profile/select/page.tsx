'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Check, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { userApi } from '../../../../api/user';
import { useAuthStore } from '../../../../store/authStore';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  '#E50914', '#b44be1', '#2172d4', '#37a9ad',
  '#e3a21a', '#00a8e1', '#57b560', '#e55b2d',
];

export default function ProfileSelectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [isKids, setIsKids] = useState(false);
  const [profilePin, setProfilePin] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => (await userApi.listProfiles()).data,
  });

  const createProfileMutation = useMutation({
    mutationFn: () => userApi.createProfile({
      name: newProfileName,
      avatarColor,
      isKids,
      pin: profilePin.trim() || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setAddModalOpen(false);
      setNewProfileName('');
      setProfilePin('');
      setIsKids(false);
      toast.success('Profile created successfully! 🎉');
    },
    onError: () => {
      toast.error('Failed to create profile. Try again.');
    }
  });

  // Select a profile
  const handleSelectProfile = (profile: any) => {
    if (profile.pin) {
      setSelectedProfile(profile);
      setPinCode('');
      setPinError(false);
      setPinModalOpen(true);
    } else {
      confirmProfile(profile);
    }
  };

  const confirmProfile = (profile: any) => {
    sessionStorage.setItem('v19_active_profile', JSON.stringify(profile));
    toast.success(`Switched to profile: ${profile.name} 👋`);
    router.replace('/');
  };

  // Submit PIN
  const handlePinSubmit = () => {
    if (pinCode === selectedProfile.pin) {
      setPinModalOpen(false);
      confirmProfile(selectedProfile);
    } else {
      setPinError(true);
      setPinCode('');
      toast.error('Incorrect PIN. Please try again.');
      setTimeout(() => setPinError(false), 500);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pinCode.length < 4) {
      setPinCode((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  // Auto-submit when 4 digits are typed
  useEffect(() => {
    if (pinCode.length === 4 && selectedProfile) {
      handlePinSubmit();
    }
  }, [pinCode]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden select-none">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-n-red/5 blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative z-10 w-full max-w-4xl"
      >
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">Who's watching?</h1>
        <p className="text-gray-400 text-sm sm:text-base mb-12">Welcome! Select your profile to step back into your personal cinematic universe.</p>

        {/* Profile Card list */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-2xl mx-auto mb-16">
          {isLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {profiles?.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p)}
                  className="group cursor-pointer text-center relative w-24 sm:w-28 md:w-32"
                >
                  {/* Card Avatar */}
                  <div
                    className="aspect-square rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl sm:text-5xl font-black text-white border-2 border-transparent transition-all group-hover:scale-105 group-hover:border-white group-hover:shadow-lg group-hover:shadow-red-500/20 duration-300 relative overflow-hidden"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.charAt(0).toUpperCase()}

                    {/* PIN lock overlay badge */}
                    {p.pin && (
                      <div className="absolute bottom-2 right-2 bg-black/60 border border-white/10 rounded-full p-1 text-white">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors truncate px-0.5">{p.name}</p>
                  {p.isKids && (
                    <span className="text-[10px] bg-n-red/10 border border-n-red/25 text-n-red font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block">
                      Kids
                    </span>
                  )}
                </div>
              ))}

              {/* Add Profile card */}
              <div
                onClick={() => setAddModalOpen(true)}
                className="group cursor-pointer text-center w-24 sm:w-28 md:w-32"
              >
                <div className="aspect-square rounded-2xl mx-auto mb-3 flex items-center justify-center text-gray-500 bg-white/5 border border-white/10 border-dashed transition-all group-hover:scale-105 group-hover:border-n-red group-hover:text-n-red duration-300">
                  <Plus className="w-10 h-10" />
                </div>
                <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">Add Profile</p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ── PIN Verification Modal ── */}
      <AnimatePresence>
        {pinModalOpen && selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className={`w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-6 text-center space-y-6 ${
                pinError ? 'animate-shake' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="w-6" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile Lock</span>
                <button onClick={() => setPinModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black text-white"
                  style={{ backgroundColor: selectedProfile.avatarColor }}
                >
                  {selectedProfile.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-white">Enter PIN for {selectedProfile.name}</h3>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-4 py-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinCode.length > idx
                        ? 'bg-n-red border-n-red scale-110 shadow-lg shadow-red-500/30'
                        : 'border-white/20 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeypadPress(num)}
                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xl flex items-center justify-center transition-colors active:scale-90"
                  >
                    {num}
                  </button>
                ))}
                <div className="w-14 h-14" />
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xl flex items-center justify-center transition-colors active:scale-90"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center transition-colors active:scale-90"
                >
                  DEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Profile Modal ── */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Create Profile</h3>
                <button onClick={() => setAddModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Profile Name</label>
                  <input
                    type="text"
                    required
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Enter profile name"
                    className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm"
                  />
                </div>

                {/* Avatar color chooser */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Avatar Color</label>
                  <div className="flex gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`w-8 h-8 rounded-full border transition-all ${
                          avatarColor === c ? 'ring-2 ring-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Pin lock config */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Profile PIN Lock (Optional)</label>
                  <input
                    type="text"
                    value={profilePin}
                    onChange={(e) => setProfilePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4-digit PIN (e.g. 1234)"
                    className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm font-mono tracking-widest text-center"
                  />
                </div>

                {/* Kids mode checkbox */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="isKids"
                    checked={isKids}
                    onChange={(e) => setIsKids(e.target.checked)}
                    className="w-4 h-4 rounded accent-n-red focus:outline-none"
                  />
                  <label htmlFor="isKids" className="text-sm font-semibold text-gray-300 cursor-pointer">
                    Kids Profile (Filters and restricts mature titles)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-md text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => createProfileMutation.mutate()}
                  disabled={!newProfileName.trim() || createProfileMutation.isPending}
                  className="flex-[2] py-3.5 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-md text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 hover:scale-102"
                >
                  Create Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
