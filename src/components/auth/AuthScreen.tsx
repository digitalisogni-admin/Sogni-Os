import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboardStore } from '../../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, LogIn, UserPlus, Fingerprint, Chrome, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function AuthScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithEmail, signupWithEmail, resetPassword } = useDashboardStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        toast.success(t('auth_success', 'Welcome back to Sogni OS'));
      } else if (mode === 'signup') {
        await signupWithEmail(email, password);
        toast.success(t('signup_success', 'Profile created successfully'));
      } else {
        await resetPassword(email);
        toast.success(t('reset_sent', 'Security reset link sent to your email'));
        setMode('login');
      }
    } catch (error: any) {
      toast.error(error.message || t('auth_failed', 'Authentication failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
      toast.success(t('auth_success', 'Welcome to Sogni OS'));
    } catch (error: any) {
      toast.error(t('google_failed', 'Cloud authentication failed'));
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden font-sans">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-center mb-12"
        >
          <div className="space-y-4">
            <motion.h1 
              className="text-7xl font-black tracking-[0.2em] text-white shimmer-text font-heading"
              animate={{ letterSpacing: ['0.1em', '0.2em', '0.1em'] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              SOGNI
            </motion.h1>
            <div className="flex flex-col items-center">
              <span className="text-primary font-bold uppercase tracking-[0.6em] text-[10px] opacity-80">
                Intelligence Digital OS
              </span>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-4" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 rounded-[2.5rem] relative overflow-hidden group"
        >
          {/* Internal Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-colors duration-700" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-left space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  {mode === 'login' ? <LogIn className="w-6 h-6 text-primary" /> : mode === 'signup' ? <UserPlus className="w-6 h-6 text-primary" /> : <ShieldCheck className="w-6 h-6 text-primary" />}
                  {mode === 'login' ? 'Nexus Authentication' : mode === 'signup' ? 'Create Agency Profile' : 'Security Protocol'}
                </h2>
                <p className="text-muted-foreground text-xs font-medium">
                  {mode === 'login' ? 'Access your digital intelligence ecosystem.' : mode === 'signup' ? 'Begin your journey into specialized automation.' : 'Reset your encrypted access credentials.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Universal Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="identity@sogni.cloud"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus:ring-primary/50 transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Encrypted Cipher</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus:ring-primary/50 transition-all placeholder:text-white/20"
                      />
                    </div>
                  </div>
                )}

                <Button
                  disabled={isLoading}
                  className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-bold text-base transition-all active:scale-[0.98] group/btn"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Initialize Interface' : mode === 'signup' ? 'Forge Identity' : 'Transmit Reset Code'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-[#121212] px-4 text-muted-foreground">Or Connect Via</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full h-14 border-white/10 hover:bg-white/5 rounded-2xl font-medium tracking-tight"
              >
                <Chrome className="w-5 h-5 mr-3 text-primary" />
                Google Cloud Identity
              </Button>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/5 pt-6">
            <div className="flex gap-4 text-xs font-medium">
              {mode === 'login' ? (
                <>
                  <button onClick={() => setMode('signup')} className="text-primary hover:text-primary/80 transition-colors">Generate Profile</button>
                  <span className="text-white/10">•</span>
                  <button onClick={() => setMode('reset')} className="text-muted-foreground hover:text-white transition-colors">Forgot Cipher?</button>
                </>
              ) : (
                <button onClick={() => setMode('login')} className="text-primary hover:text-primary/80 transition-colors">Return to Nexus</button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-white/30">
            <Fingerprint className="w-3 h-3" />
            Biometric-Ready Encryption
          </div>
          <p className="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
            Sogni Intelligence Network uses decentralized security protocols for all administrative data.
          </p>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-20 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black tracking-tighter text-white">GEN 3.0</span>
        </div>
      </div>
    </div>
  );
}
