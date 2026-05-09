import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumCard } from '../components/ui/PremiumCard';
import { GlowButton } from '../components/ui/GlowButton';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isRegistering) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(t('login.error'));
    }
  };

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative min-h-screen overflow-hidden bg-[#020617]">
      {/* Background Blobs for Premium Feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      
      {/* Floating Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-8 w-full max-w-7xl px-8 flex justify-between items-center z-20"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">SenaiLinks.</span>
        </div>
        
        <div className="glass-panel px-4 py-2 rounded-full border border-white/10">
          <select 
            onChange={changeLanguage} 
            value={i18n.language}
            className="bg-transparent text-sm text-white/80 hover:text-white outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="pt" className="text-black">PT-BR</option>
            <option value="en" className="text-black">EN</option>
            <option value="es" className="text-black">ES</option>
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <PremiumCard intensity="heavy" className="p-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(139,92,246,0.4)] border border-white/20"
          >
            <Link2 className="w-10 h-10 text-white drop-shadow-md" />
          </motion.div>
          
          <h1 className="text-3xl font-bold mb-2 text-center text-white tracking-tight">
            {t('login.title')}
          </h1>
          <p className="text-white/50 text-center mb-8 text-sm">
            {isRegistering ? "Crie sua conta para começar" : "Acesse o seu dashboard premium"}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm text-center backdrop-blur-md"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            <div className="relative group">
              <input
                type="email"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all focus:bg-[#020617]/80"
                required
              />
            </div>
            <div className="relative group">
              <input
                type="password"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all focus:bg-[#020617]/80"
                required
              />
            </div>

            <GlowButton 
              type="submit"
              variant="primary"
              className="w-full py-4 mt-2 text-lg"
              isLoading={isLoading}
            >
              {isRegistering ? t('login.register') : t('login.submit')}
            </GlowButton>
          </form>

          <div className="w-full flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-xs text-white/30 font-medium uppercase tracking-wider">ou continue com</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          <GlowButton 
            onClick={handleGoogle}
            variant="secondary"
            className="w-full py-4 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </GlowButton>

          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="mt-8 text-sm text-white/50 hover:text-white transition-colors"
          >
            {isRegistering ? "Já tem uma conta? Entrar" : t('login.register')}
          </button>
        </PremiumCard>
      </motion.div>
    </div>
  );
}

