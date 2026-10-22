import React from 'react';
import { Utensils, Clock, Users, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activeTab, onNavigate }) {
  const { cartCount, setIsCartOpen } = useCart();
  const { isCanteen } = useAuth();

  if (isCanteen) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 sm:hidden px-4 py-2 flex items-center justify-around shadow-lg">
      <button
        type="button"
        onClick={() => onNavigate('menu')}
        className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
          activeTab === 'menu' ? 'text-orange-600' : 'text-slate-400'
        }`}
      >
        <Utensils className="w-5 h-5" />
        <span>Menu</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('orders')}
        className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
          activeTab === 'orders' || activeTab === 'track' ? 'text-orange-600' : 'text-slate-400'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span>My Orders</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('group-cart')}
        className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
          activeTab === 'group-cart' ? 'text-orange-600' : 'text-slate-400'
        }`}
      >
        <Users className="w-5 h-5" />
        <span>Squad Cart</span>
      </button>

      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center gap-0.5 text-[11px] font-bold text-slate-700 relative"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-orange-600" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-orange-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">
              {cartCount}
            </span>
          )}
        </div>
        <span>Tray</span>
      </button>
    </div>
  );
}
