import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Bell, User, LogOut, Utensils, Users, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadMeter from './LoadMeter';

export default function Navbar({ onNavigate, activeTab, activeOrder }) {
  const { user, logout, isCanteen, quickDemoLogin } = useAuth();
  const { cartCount, cartTotal, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate(isCanteen ? 'canteen' : 'menu')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl">🍱</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                Break<span className="text-orange-600">Bite</span>
              </span>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md">
                Bell-Sync™
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">GIIT Campus Canteen</p>
          </div>
        </div>

        {/* Center: Live Load Meter (Hidden on small mobile, visible on sm+) */}
        <div className="hidden md:block">
          <LoadMeter compact={true} />
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active order quick notification pill if any */}
          {activeOrder && !isCanteen && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('track', activeOrder._id)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm shadow-orange-400/30 animate-soft-pulse"
            >
              <Bell className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Active:</span>
              <span>#{activeOrder.orderNumber}</span>
            </motion.button>
          )}

          {/* Group Cart Button */}
          {!isCanteen && (
            <button
              type="button"
              onClick={() => onNavigate('group-cart')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'group-cart'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Squad Group Cart"
            >
              <Users className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">Squad Cart</span>
            </button>
          )}

          {/* Canteen View Toggle if staff */}
          {isCanteen && (
            <button
              type="button"
              onClick={() => onNavigate('canteen')}
              className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Kitchen Board</span>
            </button>
          )}

          {/* Cart Tray Button (for students) */}
          {!isCanteen && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Tray</span>
              {cartCount > 0 && (
                <span className="bg-white text-orange-700 w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] shadow-xs">
                  {cartCount}
                </span>
              )}
            </motion.button>
          )}

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user.name.split(' ')[0]}</div>
                <div className="text-[10px] text-orange-600 capitalize font-semibold">{user.role}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
