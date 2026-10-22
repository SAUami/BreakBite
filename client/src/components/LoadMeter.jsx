import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';
import { useSocket } from '../hooks/useSocket';

export default function LoadMeter({ compact = false }) {
  const [load, setLoad] = useState({
    percentage: 25,
    level: 'Low',
    message: 'Kitchen operating smoothly. Quick turnaround.',
    activeOrdersCount: 2,
    activePrepMinutes: 12,
  });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchLoad = async () => {
    try {
      const res = await api.get('/orders/kitchen/load');
      if (res.data.success && res.data.load) {
        setLoad(res.data.load);
      }
    } catch (err) {
      console.warn('Failed to fetch kitchen load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoad();

    if (socket) {
      const handleLoadUpdate = (newLoad) => {
        setLoad(newLoad);
      };
      socket.on('load:update', handleLoadUpdate);
      return () => socket.off('load:update', handleLoadUpdate);
    }
  }, [socket]);

  const getTheme = () => {
    switch (load.level) {
      case 'High':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          bar: 'bg-rose-500',
          dot: 'bg-rose-500 ring-rose-300',
          badge: 'bg-rose-100 text-rose-700',
          label: 'Rush Spike',
          icon: AlertCircle,
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          bar: 'bg-amber-500',
          dot: 'bg-amber-500 ring-amber-300',
          badge: 'bg-amber-100 text-amber-700',
          label: 'Moderate Rush',
          icon: Flame,
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          bar: 'bg-emerald-500',
          dot: 'bg-emerald-500 ring-emerald-300',
          badge: 'bg-emerald-100 text-emerald-700',
          label: 'Kitchen Flow: Smooth',
          icon: ShieldCheck,
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${theme.bg}`}>
        <span className={`w-2 h-2 rounded-full animate-ping ${theme.dot}`} />
        <span className="truncate">{load.level} Kitchen Load ({load.percentage}%)</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all duration-300 ${theme.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/80 shadow-xs">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Kitchen Load Meter</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold">{theme.label}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${theme.badge}`}>
                {load.percentage}% Load
              </span>
            </div>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="font-bold text-slate-700">{load.activeOrdersCount} active orders</div>
          <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3 inline" /> ~{Math.max(5, Math.round(load.activePrepMinutes / 2))}m avg wait
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden p-0.5">
        <motion.div
          className={`h-full rounded-full ${theme.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(8, load.percentage)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
        <span>{load.message}</span>
        <span className="text-slate-400 font-medium">Bell-Sync active</span>
      </div>
    </div>
  );
}
