import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, ArrowRight, CheckCircle2, ChevronRight, Package, Utensils } from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';

export default function Orders({ onSelectOrder, onNavigateMenu }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, setIsCartOpen } = useCart();

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReorder = (order) => {
    for (const it of order.items) {
      const menuItem = it.menuItem || {
        _id: it._id,
        name: it.name,
        price: it.price,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        isVeg: it.isVeg,
        prepTimeMinutes: it.prepTimeMinutes || 5,
      };
      for (let i = 0; i < (it.quantity || 1); i++) {
        addToCart(menuItem);
      }
    }
    setIsCartOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-bold">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24 sm:pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Your Campus Orders</h1>
          <p className="text-xs text-slate-500">Track active deliveries & one-tap reorder your favorites</p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
          {orders.length} total
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3 text-2xl">
            🍱
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">No Orders Yet!</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            Your canteen orders will show up here. Place your first order with Bell-Sync to skip the counter queue!
          </p>
          <button
            type="button"
            onClick={onNavigateMenu}
            className="mt-5 px-6 py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20"
          >
            Explore Menu Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isActive = ['Placed', 'Preparing', 'Ready'].includes(order.status);
            const pickupTime = new Date(order.scheduledPickupTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <motion.div
                key={order._id}
                whileHover={{ y: -1 }}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all shadow-xs hover:shadow-md ${
                  isActive ? 'border-orange-300 ring-2 ring-orange-400/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'Ready'
                            ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400 animate-pulse'
                            : order.status === 'Preparing'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === 'Collected'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        ● {order.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      <span className="font-bold text-slate-600">
                        {order.pickupMode === 'bell_sync' ? `Slot: ${pickupTime}` : 'Express ASAP'}
                      </span>
                    </div>
                  </div>

                  <span className="text-base font-black text-slate-900">₹{order.total}</span>
                </div>

                {/* Items summary */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-xs">
                  {order.items.map((it, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 text-slate-700 px-2 py-1 rounded-lg text-[11px] font-medium"
                    >
                      <span className="font-bold">{it.quantity}x</span> {it.name}
                    </span>
                  ))}
                </div>

                {/* Actions footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectOrder(order._id)}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                    <span>{isActive ? 'Track Live Status' : 'View Receipt'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReorder(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder Tray</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
