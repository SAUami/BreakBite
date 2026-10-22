import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock, Star, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MenuCard({ item }) {
  const { items, addToCart, updateQuantity } = useCart();

  const cartItem = items.find((i) => i._id === item._id);
  const qty = cartItem ? cartItem.quantity : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={`bg-white rounded-3xl p-3.5 border transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:shadow-md ${
        !item.isAvailable ? 'opacity-60 border-slate-200' : 'border-slate-100'
      }`}
    >
      {/* Popular badge */}
      {item.isPopular && (
        <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <Flame className="w-3 h-3 fill-white" />
          <span>Campus Star</span>
        </div>
      )}

      {/* Image container */}
      <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-100 mb-3">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />

        {/* Veg / Non-veg indicator top-right */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs p-1 rounded-md shadow-xs">
          <div
            className={`w-3.5 h-3.5 border-2 flex items-center justify-center ${
              item.isVeg ? 'border-emerald-600' : 'border-red-600'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            />
          </div>
        </div>

        {/* Prep Time pill */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{item.prepTimeMinutes || 5}m prep</span>
        </div>

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Item info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-extrabold text-sm text-slate-800 line-clamp-1">
              {item.name}
            </h3>
            {item.rating && (
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{item.rating}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 2).map((t, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Cart Action */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <div>
            <span className="text-base font-black text-slate-900">₹{item.price}</span>
            <span className="text-[10px] text-slate-400 block -mt-1">canteen special</span>
          </div>

          {item.isAvailable ? (
            qty === 0 ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => addToCart(item)}
                className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm shadow-orange-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => updateQuantity(item._id, -1)}
                  className="w-6 h-6 rounded-lg bg-white shadow-xs text-orange-700 flex items-center justify-center hover:bg-orange-100 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-black text-orange-950 w-4 text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item._id, 1)}
                  className="w-6 h-6 rounded-lg bg-orange-600 shadow-xs text-white flex items-center justify-center hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )
          ) : (
            <span className="text-[11px] font-bold text-slate-400">Unavailable</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
