import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { TiltCard } from '../components/ui/TiltCard';

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe, login, register, isAuthenticated } = useAuthStore();
  const handledRef = useRef(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const returnUrl = (history.state as { usr?: { returnUrl?: string } })?.usr?.returnUrl || '/';
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (handledRef.current) return;
    const google = searchParams.get('google');
    const error = searchParams.get('error');

    if (error) {
      handledRef.current = true;
      const msg =
        error === 'invalid_client'
          ? 'Invalid Google OAuth client.'
          : decodeURIComponent(error);
      toast.error(msg, { duration: 6000 });
      setSearchParams({}, { replace: true });
      return;
    }

    if (google === 'success') {
      handledRef.current = true;
      fetchMe().then((success) => {
        if (success) {
          toast.success('Uplink Established! 🎉');
          const returnUrl = (history.state as { usr?: { returnUrl?: string } })?.usr?.returnUrl || '/';
          navigate(returnUrl, { replace: true });
        } else {
          toast.error('Sign-in succeeded but session lost.');
          setSearchParams({}, { replace: true });
        }
      });
    }
  }, [searchParams, setSearchParams, fetchMe, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await register(email, password, name);
        toast.success('Node created and linked! 🎉');
      } else {
        await login(email, password);
        toast.success('Uplink Established! 🎉');
      }
      const returnUrl = (history.state as { usr?: { returnUrl?: string } })?.usr?.returnUrl || '/';
      navigate(returnUrl, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-v-black overflow-hidden relative perspective-1000">
      {/* ── 3D PARALLAX BACKGROUND ── */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop')`,
          transform: 'translateZ(-200px) scale(1.3)'
        }}
        animate={{ rotateZ: [0, -1, 0], scale: [1.3, 1.35, 1.3] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Floating Holographic Particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-v-orange opacity-40 shadow-[0_0_10px_rgba(255,92,0,0.8)]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -Math.random() * 200 - 100],
            x: [0, Math.random() * 100 - 50],
            opacity: [0, 0.8, 0],
            scale: [0, 2, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut'
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,8,6,0.95)_100%)] z-0" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="mb-12 group drop-shadow-glow">
          <img src="/logo.png" alt="V19+" className="h-12 object-contain filter drop-shadow-3d" />
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
          className="w-full max-w-[440px]"
        >
          <TiltCard depth={10}>
            <div className="bg-glass-gradient backdrop-blur-2xl border-2 border-white/10 rounded-[2.5rem] p-10 shadow-3d-lift relative overflow-hidden group">
              <div className="absolute inset-0 bg-v-orange-glow blur-[100px] opacity-0 group-hover:opacity-30 transition-opacity duration-700" />
              
              <div className="relative z-10 text-center mb-10">
                <h2 className="text-4xl font-display font-black text-v-text tracking-wider drop-shadow-md">
                  {isSignUp ? 'INITIALIZE NODE' : 'SYSTEM UPLINK'}
                </h2>
                <p className="text-v-muted mt-2 font-medium">
                  {isSignUp ? 'Create your spatial profile' : 'Authenticate to continue'}
                </p>
              </div>

              <div className="relative z-10">
                <GoogleSignInButton />
              </div>

              <div className="flex items-center gap-4 my-8 relative z-10">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-xs text-v-muted/50 font-bold tracking-widest uppercase">Manual Auth</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-5 relative z-10">
                {isSignUp && (
                  <div className="group/input">
                    <input
                      type="text"
                      required
                      placeholder="Alias (Name)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-v-black/50 border border-white/10 focus:border-v-orange rounded-xl px-5 py-4 text-v-text placeholder-v-muted/40 focus:outline-none transition-all focus:shadow-orange-edge"
                    />
                  </div>
                )}
                <div className="group/input">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-v-black/50 border border-white/10 focus:border-v-orange rounded-xl px-5 py-4 text-v-text placeholder-v-muted/40 focus:outline-none transition-all focus:shadow-orange-edge"
                  />
                </div>
                <div className="group/input">
                  <input
                    type="password"
                    required
                    placeholder="Security Key (Password)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-v-black/50 border border-white/10 focus:border-v-orange rounded-xl px-5 py-4 text-v-text placeholder-v-muted/40 focus:outline-none transition-all focus:shadow-orange-edge"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-v-orange hover:bg-v-orange-deep text-white text-lg font-bold py-4 px-6 rounded-xl transition-all shadow-orange-glow hover:shadow-[0_0_40px_rgba(255,92,0,0.8)] border border-white/20 active:scale-95 flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : isSignUp ? 'LINK NODE' : 'CONNECT'}
                </button>
              </form>

              <div className="mt-8 text-center relative z-10">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm font-semibold text-v-muted hover:text-v-orange transition-colors"
                >
                  {isSignUp ? '< Return to Uplink' : 'Initialize New Node >'}
                </button>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}
