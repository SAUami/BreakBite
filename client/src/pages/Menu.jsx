import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Filter, Leaf, RefreshCw, Flame, Clock, Zap } from 'lucide-react';
import api from '../api';
import MenuCard from '../components/MenuCard';
import LoadMeter from '../components/LoadMeter';
import { useSocket } from '../hooks/useSocket';
import { defaultMenuItems } from '../data/defaultMenu';

const categories = ['All', 'Snacks', 'Beverages', 'Meals', 'Quick Bites', 'Desserts'];

export default function Menu() {
  // SWR Pattern: Load from localStorage first, then fallback to instant default items. 0ms initial buffering!
  const [items, setItems] = useState(() => {
    try {
      const cached = localStorage.getItem('breakbite_cached_menu');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore JSON parse error
    }
    return defaultMenuItems;
  });

  const [loading, setLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const { socket } = useSocket();

  const fetchMenu = async () => {
    // Show gentle waking indicator if network request takes longer than 2.5 seconds (Render cold start)
    const wakeupTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 2500);

    try {
      const res = await api.get('/menu');
      if (res.data.success && Array.isArray(res.data.items) && res.data.items.length > 0) {
        setItems(res.data.items);
        try {
          localStorage.setItem('breakbite_cached_menu', JSON.stringify(res.data.items));
        } catch (e) {
          // ignore quota error
        }
      }
    } catch (err) {
      console.warn('Live menu fetch failed, showing cached items:', err);
    } finally {
      clearTimeout(wakeupTimer);
      setIsWakingUp(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    if (socket) {
      // Listen for real-time stock toggles by canteen staff
      const handleStockToggle = ({ id, isAvailable }) => {
        setItems((prev) =>
          prev.map((it) => (it._id === id ? { ...it, isAvailable } : it))
        );
      };

      const handleItemAdded = (newItem) => {
        setItems((prev) => [newItem, ...prev]);
      };

      const handleItemUpdated = (updated) => {
        setItems((prev) =>
          prev.map((it) => (it._id === updated._id ? updated : it))
        );
      };

      socket.on('menu:stock_toggled', handleStockToggle);
      socket.on('menu:item_added', handleItemAdded);
      socket.on('menu:item_updated', handleItemUpdated);

      return () => {
        socket.off('menu:stock_toggled', handleStockToggle);
        socket.off('menu:item_added', handleItemAdded);
        socket.off('menu:item_updated', handleItemUpdated);
      };
    }
  }, [socket]);

  // Client-side quick filter
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVeg = !vegOnly || item.isVeg;
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesVeg && matchesSearch;
  });

  const popularItems = items.filter((i) => i.isPopular && i.isAvailable).slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-12">
      {/* Cloud Server Cold-Start Warmup Pill Banner */}
      <AnimatePresence>
        {isWakingUp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-500/10 border border-amber-500/30 text-amber-900 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-semibold backdrop-blur-xs shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span>
                <strong>Cloud Server Waking Up:</strong> Free-tier servers spin down after 15m. Connecting to live kitchen stream...
              </span>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-md hidden sm:inline">
              Instant Cache Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero & Bell-Sync Value Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>No More Waiting in Line at Canteen Counter</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Order now. Collect the second your lecture ends.
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 max-w-lg mt-2 leading-relaxed">
              Powered by <span className="font-extrabold text-white">Bell-Sync™</span>: we calculate kitchen prep speed and drop your order on the fire exactly so it's sizzling hot when you arrive.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-4 text-xs font-semibold text-orange-100">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-300" /> 5-Min Slot Capping
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-300" /> Always Hot Food
            </span>
            <span className="flex items-center gap-1.5">
              <span>🚶</span> 4-Min Campus Walk Nudge
            </span>
          </div>
        </div>

        {/* Live Kitchen Load Widget */}
        <div className="lg:col-span-1">
          <LoadMeter />
        </div>
      </div>

      {/* Search & Veg Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search samosa, kadak chai, maggi, thali..."
            className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500 placeholder:text-slate-400"
          />
        </div>

        {/* Veg Only Toggle */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <button
            type="button"
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
              vegOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 border-2 rounded-xs flex items-center justify-center ${
                vegOnly ? 'border-white' : 'border-emerald-600'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  vegOnly ? 'bg-white' : 'bg-emerald-600'
                }`}
              />
            </div>
            <span>Pure Veg Only</span>
          </button>

          <span className="text-xs text-slate-400 font-semibold sm:hidden">
            {filteredItems.length} items
          </span>
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Popular Today Row (when showing all categories) */}
      {selectedCategory === 'All' && !search && popularItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-700">
                <Flame className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-slate-900">Campus Bestsellers Right Now</h2>
            </div>
            <span className="text-xs text-amber-700 font-bold">Most Ordered Today</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularItems.map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            {selectedCategory === 'All' ? 'Full Canteen Menu' : `${selectedCategory}`}
          </h2>
          <span className="text-xs text-slate-400 font-bold">{filteredItems.length} dishes ready to cook</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-3 border border-slate-100 space-y-3 animate-pulse">
                <div className="w-full h-36 bg-slate-200 rounded-2xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-full" />
                <div className="h-8 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <span className="text-4xl">🔍</span>
            <h3 className="font-bold text-slate-800 text-base mt-2">No canteen items matched</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Try searching with another keyword or resetting your pure veg filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setVegOnly(false);
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
