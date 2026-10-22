import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight, Sparkles, MessageSquare, Plus, Minus, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SlotPicker from './SlotPicker';
import api from '../api';

export default function CartDrawer({ onOrderSuccess }) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    totalPrepMinutes,
    isCartOpen,
    setIsCartOpen,
    specialInstructions,
    setSpecialInstructions,
    selectedSlot,
    walkingMinutes,
  } = useCart();

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        items,
        pickupMode: selectedSlot ? 'bell_sync' : 'asap',
        requestedPickupTime: selectedSlot?.isoTime || null,
        walkingMinutes,
        specialInstructions,
      };

      const res = await api.post('/orders', payload);
      if (res.data.success && res.data.order) {
        // Fire celebration confetti!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#f59e0b', '#10b981'],
        });

        const createdOrder = res.data.order;
        clearCart();
        setIsCartOpen(false);

        if (onOrderSuccess) {
          onOrderSuccess(createdOrder);
        }
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setErrorMessage(
        err.response?.data?.message || 'Could not place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        />

        {/* Bottom Sheet on Mobile / Slide Drawer on Desktop */}
        <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto sm:inset-y-0 sm:right-0 sm:left-auto sm:max-w-md w-full flex">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-full bg-white rounded-t-3xl sm:rounded-l-3xl sm:rounded-t-none shadow-2xl flex flex-col max-h-[92vh] sm:max-h-screen overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-amber-50/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-800 text-base">Your Canteen Tray</h2>
                  <span className="text-xs text-slate-500">{cartCount} items selected</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50"
                  >
                    Clear Tray
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Content Body */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-amber-100/70 text-amber-700 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Your Tray is Empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Craving hot samosa pav or adrak masala chai? Add items from the canteen menu to experience Bell-Sync.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20"
                >
                  Browse Campus Menu
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Item list */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Items</h3>
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-800 line-clamp-1">{item.name}</div>
                          <div className="text-[11px] text-slate-500">₹{item.price} each</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item._id, -1)}
                            className="text-slate-500 hover:text-slate-800 p-0.5"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-slate-800 w-3.5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item._id, 1)}
                            className="text-slate-500 hover:text-slate-800 p-0.5"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 w-12 text-right">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Instructions Note */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Special Instructions for Canteen Chef</span>
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Extra green chutney, double toasted, less sugar..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Signature Feature: Bell-Sync Slot Picker */}
                <div className="pt-2">
                  <SlotPicker />
                </div>
              </div>
            )}

            {/* Footer Summary & Place Order Button */}
            {items.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="flex items-center gap-1">
                      Campus Student Fee <Sparkles className="w-3 h-3 text-emerald-600" />
                    </span>
                    <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                    <span>Grand Total</span>
                    <span>₹{cartTotal}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        Place Order • ₹{cartTotal} (
                        {selectedSlot ? `Bell-Sync: ${selectedSlot.timeFormatted}` : 'Express ASAP'}
                        )
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
