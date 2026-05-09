import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, updateDoc, increment, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, ArrowRight, Clock, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { PremiumCard } from '../components/ui/PremiumCard';
import { GlowButton } from '../components/ui/GlowButton';
import { toast } from 'sonner';

export default function Redirect() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [targetData, setTargetData] = useState<{ url: string; id: string; password?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processRedirect = async () => {
      if (!code) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'links'), where('shortCode', '==', code));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError(true);
          setLoading(false);
          return;
        }

        const linkDoc = snapshot.docs[0];
        const data = linkDoc.data();

        // 1. Verificar Expiração
        if (data.expiresAt) {
          const expirationDate = new Date(data.expiresAt);
          if (new Date() > expirationDate) {
            setExpired(true);
            setLoading(false);
            return;
          }
        }

        // 2. Verificar Senha
        if (data.password && !isAuthorized) {
          setTargetData({ url: data.originalUrl, id: linkDoc.id, password: data.password });
          setRequiresPassword(true);
          setLoading(false);
          return;
        }

        // 3. Registrar Analytics
        try {
          await addDoc(collection(db, 'links', linkDoc.id, 'analytics'), {
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direto'
          });
        } catch (analyticsErr) {
          console.error("Analytics fail:", analyticsErr);
        }

        // 4. Incrementa o contador de cliques
        try {
          await updateDoc(doc(db, 'links', linkDoc.id), {
            clicks: increment(1)
          });
        } catch (clicksErr) {
          console.error("Clicks update fail:", clicksErr);
        }

        // 5. Redireciona com um pequeno delay para a animação brilhar
        setTimeout(() => {
          window.location.replace(data.originalUrl);
        }, 2000);
      } catch (err) {
        console.error("Redirect fatal error:", err);
        setError(true);
        setLoading(false);
      }
    };

    processRedirect();
  }, [code, isAuthorized]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetData && passwordInput === targetData.password) {
      setIsAuthorized(true);
      setRequiresPassword(false);
    } else {
      toast.error("Senha incorreta!");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-emerald-600/10 blur-[150px] rounded-full"
        />
      </div>

      <AnimatePresence mode="wait">
        {loading && !error && !expired && !requiresPassword && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center relative z-10"
          >
            <div className="relative w-32 h-32 mx-auto mb-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-purple-500/20 rounded-[2.5rem]"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-2 border-emerald-500/20 rounded-[2rem]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-10 h-10 text-purple-400" />
                </motion.div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tighter">SenaiLinks</h2>
              <div className="flex items-center justify-center gap-3 text-white/50 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="tracking-wide">Validando acesso seguro...</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {requiresPassword && (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="w-full max-w-md relative z-10"
          >
            <PremiumCard intensity="heavy" className="p-10 border-white/10 backdrop-blur-3xl">
              <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-2xl shadow-blue-500/20">
                <Shield className="w-10 h-10" />
              </div>
              
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Segurança Ativa</h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  Este destino está protegido por criptografia de ponta. <br/>
                  Por favor, insira a chave de acesso.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Senha de acesso"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all placeholder:text-white/10"
                    autoFocus
                  />
                </div>
                
                <GlowButton type="submit" className="w-full py-5 text-lg font-bold">
                  Autenticar e Seguir
                  <ArrowRight className="w-5 h-5 ml-2" />
                </GlowButton>
              </form>

              <div className="mt-10 pt-8 border-t border-white/5 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold">Encrypted Link System</span>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10"
          >
            <PremiumCard className="p-12 text-center border-red-500/20 bg-red-500/[0.02]">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-2xl shadow-red-500/20">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-white tracking-tight">Destino Inválido</h1>
              <p className="text-white/50 mb-10 leading-relaxed text-sm">
                O link solicitado não foi encontrado ou foi desativado. Verifique a URL e tente novamente.
              </p>
              <a href="/" className="block">
                <GlowButton className="w-full py-4 bg-white/5 border-white/10 hover:bg-white/10">
                  Voltar ao Dashboard
                </GlowButton>
              </a>
            </PremiumCard>
          </motion.div>
        )}

        {expired && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10"
          >
            <PremiumCard className="p-12 text-center border-orange-500/20 bg-orange-500/[0.02]">
              <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-orange-500/20 shadow-2xl shadow-orange-500/20">
                <Clock className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-white tracking-tight">Tempo Esgotado</h1>
              <p className="text-white/50 mb-10 leading-relaxed text-sm">
                Este link possuía uma data de validade que já expirou. Contate o administrador do link.
              </p>
              <a href="/" className="block">
                <GlowButton className="w-full py-4 bg-white/5 border-white/10 hover:bg-white/10">
                  Voltar ao Dashboard
                </GlowButton>
              </a>
            </PremiumCard>
          </motion.div>
        )}

        {!loading && !error && !expired && !requiresPassword && isAuthorized && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative z-10"
          >
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ArrowRight className="w-12 h-12" />
              </motion.div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2 tracking-tighter">Pronto!</h2>
            <p className="text-emerald-400/70 font-medium animate-pulse">Redirecionando você agora...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold">
          Powered by SenaiLinks Secure Gateway
        </p>
      </motion.div>
    </div>
  );
}

