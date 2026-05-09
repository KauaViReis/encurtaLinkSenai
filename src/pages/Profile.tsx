import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ExternalLink, Globe, Instagram, Twitter, Github, Linkedin, Share2, AlertCircle } from 'lucide-react';
import { PremiumCard } from '../components/ui/PremiumCard';
import { GlowButton } from '../components/ui/GlowButton';

interface UserProfile {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

interface Link {
  id: string;
  title: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;

      try {
        setLoading(true);
        // 1. Buscar usuário pelo username
        const userQuery = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          setError(true);
          setLoading(false);
          return;
        }

        const userData = userSnapshot.docs[0].data() as UserProfile;
        const userId = userSnapshot.docs[0].id;
        setProfile(userData);

        // 2. Buscar links públicos do usuário
        const linksQuery = query(
          collection(db, 'links'),
          where('userId', '==', userId),
          where('showInProfile', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const linksSnapshot = await getDocs(linksQuery);
        const fetchedLinks = linksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Link[];

        setLinks(fetchedLinks);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Links de ${profile?.displayName || username}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link do perfil copiado!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 text-center">
        <PremiumCard className="p-8 max-w-sm border-red-500/20">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Perfil não encontrado</h1>
          <p className="text-white/40 mb-6">O usuário "{username}" não existe ou o perfil é privado.</p>
          <GlowButton onClick={() => window.location.href = '/'}>Voltar ao Início</GlowButton>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-x-hidden selection:bg-emerald-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-16 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-500 to-blue-500 animate-spin-slow">
              <div className="w-full h-full rounded-full bg-[#020617] p-1">
                <div className="w-full h-full rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <Globe className="w-12 h-12 text-emerald-400" />
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={handleShare}
              className="absolute bottom-0 right-0 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all shadow-lg"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {profile.displayName}
          </h1>
          <p className="text-emerald-400 font-medium mb-4">@{username}</p>
          <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
            {profile.bio || "Este usuário ainda não definiu uma bio."}
          </p>

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {profile.socials?.instagram && (
              <a href={`https://instagram.com/${profile.socials.instagram}`} target="_blank" rel="noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {profile.socials?.twitter && (
              <a href={`https://twitter.com/${profile.socials.twitter}`} target="_blank" rel="noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {profile.socials?.github && (
              <a href={`https://github.com/${profile.socials.github}`} target="_blank" rel="noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                <Github className="w-5 h-5" />
              </a>
            )}
            {profile.socials?.linkedin && (
              <a href={`https://linkedin.com/in/${profile.socials.linkedin}`} target="_blank" rel="noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
            )}
          </div>
        </motion.div>

        {/* Links List */}
        <div className="space-y-4">
          {links.length > 0 ? (
            links.map((link, index) => (
              <motion.a
                key={link.id}
                href={`${window.location.origin}/r/${link.shortCode}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="block group"
              >
                <PremiumCard 
                  intensity="light" 
                  className="p-5 flex items-center justify-between group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 group-hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-emerald-500/20 transition-colors">
                      <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{link.title}</h3>
                      <p className="text-white/20 text-xs truncate max-w-[200px] md:max-w-xs">{link.originalUrl}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover:translate-x-1 transition-transform">
                    <ExternalLink className="w-4 h-4 text-white/40" />
                  </div>
                </PremiumCard>
              </motion.a>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-white/20 italic">Nenhum link público disponível.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-widest text-white/40 hover:text-white hover:border-emerald-500/30 transition-all uppercase"
          >
            Criado com SenaiLinks Pro
          </a>
        </footer>
      </div>
    </div>
  );
}
