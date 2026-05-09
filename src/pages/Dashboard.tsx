import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDoc, serverTimestamp, orderBy, updateDoc, getDocs } from 'firebase/firestore';
import { LogOut, Link as LinkIcon, Copy, Trash2, ExternalLink, Activity, Plus, Edit, QrCode, Shield, Clock, BarChart3, Download, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumCard } from '../components/ui/PremiumCard';
import { GlowButton } from '../components/ui/GlowButton';
import { AnimatedInput } from '../components/ui/AnimatedInput';
import { Modal } from '../components/ui/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { AnalyticsModal } from '../components/ui/AnalyticsModal';
import { QRCodeModal } from '../components/ui/QRCodeModal';
import { parseDeviceType, getReferrerLabel } from '../utils/uaParser';

interface LinkItem {
  id: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: any;
  password?: string;
  expiresAt?: string;
  showInProfile?: boolean;
}

interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
} as const;

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [customSlug, setCustomSlug] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showInProfile, setShowInProfile] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Estados para edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editOriginalUrl, setEditOriginalUrl] = useState('');
  const [editShortCode, setEditShortCode] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editShowInProfile, setEditShowInProfile] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Estados para Perfil
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Estados para Analytics
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedLinkTitle, setSelectedLinkTitle] = useState('');

  // Estados para QR Code
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [selectedQRCodeLink, setSelectedQRCodeLink] = useState<{ shortCode: string; url: string } | null>(null);

  const handleOpenQRCode = (link: LinkItem) => {
    setSelectedQRCodeLink({ shortCode: link.shortCode, url: link.originalUrl });
    setIsQRCodeModalOpen(true);
  };

  useEffect(() => {
    console.log("Estado atual dos links:", links);
  }, [links]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'links'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData: LinkItem[] = [];
      snapshot.forEach((doc) => {
        linksData.push({ id: doc.id, ...doc.data() } as LinkItem);
      });
      setLinks(linksData);
    }, (error) => {
      console.error("Erro no Firestore:", error);
      if (error.code === 'failed-precondition') {
        toast.error("O índice do banco de dados ainda está sendo criado. Aguarde alguns minutos.");
      } else {
        toast.error("Erro ao carregar links. Verifique as permissões.");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Carregar dados do perfil do usuário
  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile(data);
          setProfileUsername(data.username || '');
          setProfileDisplayName(data.displayName || '');
          setProfileBio(data.bio || '');
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Efeito para validar disponibilidade do slug em tempo real
  useEffect(() => {
    if (!customSlug) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const isAvailable = await checkSlugAvailability(customSlug);
        setSlugAvailable(isAvailable);
      } catch (err) {
        console.error("Erro ao validar slug:", err);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customSlug]);

  // Efeito para validar disponibilidade do slug na edição
  useEffect(() => {
    if (!editShortCode || (editingLink && editShortCode === editingLink.shortCode)) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const isAvailable = await checkSlugAvailability(editShortCode);
        setSlugAvailable(isAvailable);
      } catch (err) {
        console.error("Erro ao validar slug na edição:", err);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [editShortCode, editingLink]);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const checkSlugAvailability = async (slug: string) => {
    const q = query(collection(db, 'links'), where('shortCode', '==', slug));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'http://' + finalUrl;
    }

    if (!user) {
      toast.error("Você precisa estar logado para encurtar links.");
      return;
    }

    setLoading(true);
    try {
      let shortCode = customSlug.trim() || generateCode();
      
      // Validar slug se for customizado
      if (customSlug.trim()) {
        const isAvailable = await checkSlugAvailability(shortCode);
        if (!isAvailable) {
          toast.error("Este slug já está em uso. Escolha outro!");
          setLoading(false);
          return;
        }
      }

      await addDoc(collection(db, 'links'), {
        originalUrl: finalUrl,
        shortCode,
        userId: user.uid,
        clicks: 0,
        createdAt: serverTimestamp(),
        password: password || null,
        expiresAt: expiresAt || null,
        showInProfile: showInProfile
      });
      
      setUrl('');
      setCustomSlug('');
      setPassword('');
      setExpiresAt('');
      setShowInProfile(false);
      setShowAdvanced(false);
      toast.success("Link encurtado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Falha ao encurtar o link: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'links', id));
      toast.success("Link excluído com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir link.");
    }
  };

  const handleEdit = (link: LinkItem) => {
    setEditingLink(link);
    setEditOriginalUrl(link.originalUrl);
    setEditShortCode(link.shortCode);
    setEditPassword(link.password || '');
    setEditExpiresAt(link.expiresAt || '');
    setEditShowInProfile(link.showInProfile || false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    setLoading(true);
    try {
      // Validar se o shortCode mudou e se está disponível
      if (editShortCode !== editingLink.shortCode) {
        const isAvailable = await checkSlugAvailability(editShortCode);
        if (!isAvailable) {
          toast.error("Este slug já está em uso!");
          setLoading(false);
          return;
        }
      }

      await updateDoc(doc(db, 'links', editingLink.id), {
        originalUrl: editOriginalUrl,
        shortCode: editShortCode,
        password: editPassword || null,
        expiresAt: editExpiresAt || null,
        showInProfile: editShowInProfile
      });
      setIsEditModalOpen(false);
      setEditingLink(null);
      toast.success("Link atualizado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Falha ao atualizar o link: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${editShortCode || 'link'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code exportado com sucesso!");
  };

  const handleViewAnalytics = async (link: LinkItem) => {
    setSelectedLinkTitle(`senai.link/${link.shortCode}`);
    setIsAnalyticsModalOpen(true);
    setAnalyticsLoading(true);
    setAnalyticsData(null);

    try {
      const q = query(
        collection(db, 'links', link.id, 'analytics'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      if (logs.length === 0) {
        setAnalyticsData(null);
        return;
      }

      // Processar Cliques Diários (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }).reverse();

      const dailyClicks = last7Days.map(date => {
        const count = logs.filter(log => {
          const logDate = (log as any).timestamp?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          return logDate === date;
        }).length;
        return { date, clicks: count };
      });

      // Processar Dispositivos
      const deviceCounts: Record<string, number> = {};
      logs.forEach(log => {
        const device = parseDeviceType((log as any).userAgent);
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });
      const devices = Object.entries(deviceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Processar Origens
      const referrerCounts: Record<string, number> = {};
      logs.forEach(log => {
        const label = getReferrerLabel((log as any).referrer);
        referrerCounts[label] = (referrerCounts[label] || 0) + 1;
      });
      const referrers = Object.entries(referrerCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setAnalyticsData({
        dailyClicks,
        devices,
        referrers,
        totalClicks: logs.length
      });
    } catch (err) {
      console.error("Erro ao buscar analytics:", err);
      toast.error("Erro ao carregar estatísticas.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCopy = (shortCode: string, id: string) => {
    const fullUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success(t('dashboard.copied') || 'Link copiado para a área de transferência!', {
      icon: <Copy className="w-4 h-4 text-purple-400" />
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    try {
      // Caso seja um FieldValue do Firestore (ainda não sincronizado)
      if (typeof timestamp.toDate !== 'function') {
        return 'Sincronizando...';
      }
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch (e) {
      return 'Data indisponível';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-[#020617]">
      {/* Dynamic Backgrounds */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 md:p-8 z-10">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="sticky top-4 z-50 mb-12"
        >
          <PremiumCard className="p-4 flex items-center justify-between shadow-2xl shadow-black/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">SenaiLinks</h1>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">Beta</span>
                </div>
                <p className="text-xs text-white/70 hidden sm:block">{t('dashboard.title')}</p>
              </div>
            </div>
            
              <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-white">{userProfile?.displayName || user?.displayName || 'Usuário'}</span>
                <span className="text-xs text-white/70">{userProfile?.username ? `@${userProfile.username}` : user?.email}</span>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white hover:text-emerald-400 group"
                title="Configurações de Perfil"
              >
                <Globe className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
              <button 
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white hover:text-red-400 group"
                title={t('dashboard.logout')}
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            </div>
          </PremiumCard>
        </motion.header>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <PremiumCard intensity="heavy" className="p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-1/2 bg-gradient-to-b from-purple-500/20 to-transparent blur-3xl rounded-full pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight text-glow">
              Encurte seus links.
              <br/>Expanda seu alcance.
            </h2>
            <p className="text-white/60 mb-10 text-lg max-w-xl mx-auto">
              Crie links curtos, rápidos e seguros.
            </p>

            <form onSubmit={handleShorten} className="flex flex-col gap-4 max-w-3xl mx-auto relative z-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-[3]">
                  <AnimatedInput 
                    type="text" 
                    placeholder={t('dashboard.placeholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    icon={<LinkIcon className="w-6 h-6" />}
                    required
                  />
                </div>
                <div className="flex-1">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors font-medium text-xs">
                      senai.link/
                    </div>
                    <input
                      type="text"
                      placeholder="slug-custom"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      className={`w-full bg-white/5 border rounded-2xl py-4 pl-24 pr-10 text-white focus:outline-none transition-all placeholder:text-white/10 text-sm font-medium ${
                        slugAvailable === true ? 'border-emerald-500/50 focus:ring-emerald-500/30' : 
                        slugAvailable === false ? 'border-red-500/50 focus:ring-red-500/30' : 
                        'border-white/10 focus:ring-purple-500/30 focus:border-purple-500/50'
                      }`}
                    />
                    {customSlug && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {isCheckingSlug ? (
                          <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        ) : slugAvailable === true ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        ) : slugAvailable === false ? (
                          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {slugAvailable === false && (
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-2 ml-2">Slug já está em uso</p>
                  )}
                  {slugAvailable === true && (
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-2 ml-2">Slug disponível</p>
                  )}
                </div>
              </div>
              <GlowButton 
                type="submit"
                isLoading={loading}
                className="py-4 px-8 text-lg w-full shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-5 h-5" />
                {t('dashboard.shorten_btn')}
              </GlowButton>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-white/40 hover:text-white/70 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all w-fit mx-auto"
              >
                <div className={`w-2 h-2 rounded-full transition-colors ${showAdvanced ? 'bg-purple-500' : 'bg-white/20'}`} />
                Configurações Avançadas
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Shield className="w-3 h-3 text-blue-400" />
                          Senha de Proteção
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Opcional"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3 h-3 text-orange-400" />
                          Expiração do Link
                        </label>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={showInProfile}
                            onChange={(e) => setShowInProfile(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/50"
                          />
                          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Mostrar este link na minha Bio Pública</span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </PremiumCard>
        </motion.div>

        {/* Links List */}
        <div className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-400" />
              {t('dashboard.my_links')}
            </h2>
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </div>
          </motion.div>
          
          {links.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <PremiumCard className="p-12 text-center border-dashed border-2 border-white/10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <LinkIcon className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-white/70 text-lg">Nenhum link criado ainda.<br/>Comece encurtando uma URL acima!</p>
              </PremiumCard>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4"
            >
              <AnimatePresence>
                {links.map(link => (
                  <motion.div 
                    key={link.id}
                    variants={itemVariants}
                    layout
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  >
                    <PremiumCard hoverEffect className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center gap-3 mb-2">
                          <a 
                            href={`/r/${link.shortCode}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-300 hover:to-blue-300 flex items-center gap-2 transition-all w-fit"
                          >
                            senai.link/{link.shortCode}
                            <ExternalLink className="w-4 h-4 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                        <p className="text-white/70 truncate max-w-2xl text-sm" title={link.originalUrl}>
                          {link.originalUrl}
                        </p>
                        
                        {/* Meta Data Row */}
                        <div className="flex items-center gap-4 mt-4 text-xs font-medium text-white/60">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
                            {formatDate(link.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            <Activity className="w-3.5 h-3.5" />
                            {link.clicks} cliques
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
                          <GlowButton
                            variant="secondary"
                            onClick={() => handleCopy(link.shortCode, link.id)}
                            className="flex-1 md:flex-none py-2.5 px-5 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            {copiedId === link.id ? t('dashboard.copied') : t('dashboard.copy')}
                          </GlowButton>
                          <button
                            onClick={() => handleOpenQRCode(link)}
                            className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors border border-purple-500/10"
                            title="Gerar QR Code"
                          >
                            <QrCode className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleViewAnalytics(link)}
                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border border-emerald-500/10"
                            title="Ver Estatísticas"
                          >
                            <BarChart3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors border border-blue-500/10"
                            title="Editar Link"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/10"
                          title={t('dashboard.delete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </PremiumCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Link Premium"
      >
        <form onSubmit={handleSaveEdit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">URL Original</label>
              <AnimatedInput
                type="text"
                value={editOriginalUrl}
                onChange={(e) => setEditOriginalUrl(e.target.value)}
                placeholder="https://exemplo.com"
                icon={<LinkIcon className="w-5 h-5" />}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">Link Customizado</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium text-sm">
                  senai.link/
                </div>
                <input
                  type="text"
                  value={editShortCode}
                  onChange={(e) => setEditShortCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  className={`w-full bg-white/5 border rounded-2xl py-4 pl-[90px] pr-10 text-white focus:outline-none transition-all font-medium ${
                    slugAvailable === true ? 'border-emerald-500/50 focus:ring-emerald-500/30' : 
                    slugAvailable === false ? 'border-red-500/50 focus:ring-red-500/30' : 
                    'border-white/10 focus:ring-purple-500/30 focus:border-purple-500/50'
                  }`}
                  placeholder="meu-link"
                  required
                />
                {editShortCode && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    {isCheckingSlug ? (
                      <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    ) : slugAvailable === true ? (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    ) : slugAvailable === false && editShortCode !== editingLink?.shortCode ? (
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    ) : null}
                  </div>
                )}
              </div>
              {slugAvailable === false && editShortCode !== editingLink?.shortCode && (
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-2 ml-2">Slug já está em uso</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Senha de Acesso (Opcional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                  placeholder="Deixe vazio para link público"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Data de Expiração
                </label>
                <input
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-medium"
                />
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Exibir no Perfil</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Torne este link público na sua Bio-Page</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={editShowInProfile}
                  onChange={(e) => setEditShowInProfile(e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/40 after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500/50"></div>
              </label>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-white font-medium mb-2">
              <QrCode className="w-5 h-5 text-purple-400" />
              QR Code do Link
            </div>
            <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-xl shadow-purple-500/10">
              <QRCodeCanvas 
                value={`${window.location.origin}/r/${editShortCode}`}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            <button
              type="button"
              onClick={downloadQRCode}
              className="flex items-center gap-2 text-[10px] text-purple-400 hover:text-purple-300 uppercase tracking-widest font-bold transition-colors"
            >
              <Download className="w-3 h-3" />
              Baixar em PNG
            </button>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Aponte a câmera para testar</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
            >
              Cancelar
            </button>
            <GlowButton
              type="submit"
              isLoading={loading}
              className="flex-[2] py-4 px-6"
            >
              Salvar Alterações
            </GlowButton>
          </div>
        </form>
      </Modal>

      <AnalyticsModal 
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        data={analyticsData}
        linkTitle={selectedLinkTitle}
        loading={analyticsLoading}
      />

      {/* Modal de Configurações de Perfil */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Configurações do Perfil"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">Username Único</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium text-sm">
                  @
                </div>
                <input
                  type="text"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                  placeholder="seu_username"
                />
              </div>
              <p className="text-[10px] text-white/30 mt-2 ml-1">Seu perfil será: senailinks.com/u/{profileUsername || '...'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">Nome de Exibição</label>
              <input
                type="text"
                value={profileDisplayName}
                onChange={(e) => setProfileDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                placeholder="Seu Nome Real ou Apelido"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">Bio</label>
              <textarea
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium resize-none"
                placeholder="Conte um pouco sobre você..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="flex-1 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
            >
              Cancelar
            </button>
            <GlowButton
              onClick={async () => {
                if (!user) return;
                setProfileLoading(true);
                try {
                  // Verificar se o username já existe para outro usuário
                  const q = query(collection(db, 'users'), where('username', '==', profileUsername.toLowerCase()));
                  const snapshot = await getDocs(q);
                  
                  if (!snapshot.empty && snapshot.docs[0].id !== user.uid) {
                    toast.error("Este username já está em uso!");
                    return;
                  }

                  const profileData = {
                    username: profileUsername.toLowerCase(),
                    displayName: profileDisplayName,
                    bio: profileBio,
                    updatedAt: serverTimestamp()
                  };

                  await updateDoc(doc(db, 'users', user.uid), profileData).catch(async () => {
                    // Se o documento não existir, criar (setDoc ou addDoc com ID fixo)
                    const { setDoc } = await import('firebase/firestore');
                    await setDoc(doc(db, 'users', user.uid), profileData);
                  });

                  setUserProfile(profileData as any);
                  setIsProfileModalOpen(false);
                  toast.success("Perfil atualizado com sucesso!");
                } catch (err) {
                  console.error(err);
                  toast.error("Erro ao salvar perfil.");
                } finally {
                  setProfileLoading(false);
                }
              }}
              isLoading={profileLoading}
              className="flex-[2] py-4 px-6"
            >
              Salvar Perfil
            </GlowButton>
          </div>
        </div>
      </Modal>

      {/* Modal de QR Code */}
      {selectedQRCodeLink && (
        <QRCodeModal
          isOpen={isQRCodeModalOpen}
          onClose={() => setIsQRCodeModalOpen(false)}
          shortCode={selectedQRCodeLink.shortCode}
        />
      )}
    </div>
  );
}
