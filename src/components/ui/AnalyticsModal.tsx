import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, PieChart, LineChart as LineChartIcon, MousePointer2, Smartphone, Globe } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, 
  BarChart, Bar, Legend 
} from 'recharts';
import { PremiumCard } from './PremiumCard';

interface AnalyticsData {
  dailyClicks: { date: string; clicks: number }[];
  devices: { name: string; value: number }[];
  referrers: { name: string; value: number }[];
  totalClicks: number;
}

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyticsData | null;
  linkTitle: string;
  loading: boolean;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export const AnalyticsModal = ({ isOpen, onClose, data, linkTitle, loading }: AnalyticsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl relative z-10"
      >
        <PremiumCard intensity="heavy" className="max-h-[90vh] overflow-hidden flex flex-col border-white/20">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Analytics do Link</h2>
                <p className="text-white/40 text-sm truncate max-w-[200px] md:max-w-md">{linkTitle}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-white/40 font-medium animate-pulse">Processando métricas...</p>
              </div>
            ) : data ? (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                      <MousePointer2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Total de Cliques</p>
                      <p className="text-2xl font-bold text-white">{data.totalClicks}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Top Dispositivo</p>
                      <p className="text-xl font-bold text-white">{data.devices[0]?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Principal Origem</p>
                      <p className="text-xl font-bold text-white">{data.referrers[0]?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Main Chart: Clicks Over Time */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-6">
                    <LineChartIcon className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white">Cliques nos últimos 7 dias</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyClicks}>
                        <defs>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#ffffff40" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff40" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="clicks" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#020617' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Secondary Charts: Devices and Referrers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Devices Pie Chart */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-6">
                      <PieChart className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white">Dispositivos</h3>
                    </div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={data.devices}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {data.devices.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px'
                            }}
                          />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Referrers Bar Chart */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-6">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-white">Top Origens</h3>
                    </div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.referrers} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#ffffff60" 
                            fontSize={12} 
                            width={100}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px'
                            }}
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                  <BarChart3 className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sem Dados Disponíveis</h3>
                <p className="text-white/40 max-w-xs">Ainda não há cliques registrados para este link. Compartilhe-o para começar a ver as estatísticas!</p>
              </div>
            )}
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
};
