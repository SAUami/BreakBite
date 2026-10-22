import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Share2,
  Copy,
  Plus,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

export default function GroupCart({ onCheckoutGroupCart, onNavigateMenu }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeCart, setActiveCart] = useState(null);
  const [cartCodeInput, setCartCodeInput] = useState('');
  const [newCartTitle, setNewCartTitle] = useState('Campus Squad Lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Quick menu items for adding to squad cart
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');

  useEffect(() => {
    // Load some menu items for quick add
    api.get('/menu')
      .then((res) => {
        if (res.data.success) {
          setMenuItems(res.data.items.filter((i) => i.isAvailable));
          if (res.data.items.length > 0) {
            setSelectedMenuItem(res.data.items[0]._id);
          }
        }
      })
      .catch(console.warn);
  }, []);

  // Listen to live socket updates for this group cart room
  useEffect(() => {
    if (socket && activeCart?.code) {
      socket.emit('join:group_cart', activeCart.code);

      const handleCartUpdate = (updatedCart) => {
        setActiveCart(updatedCart);
      };

      socket.on('group:cart_updated', handleCartUpdate);
      return () => socket.off('group:cart_updated', handleCartUpdate);
    }
  }, [socket, activeCart?.code]);

  const handleCreateCart = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/group-cart', { title: newCartTitle });
      if (res.data.success) {
        setActiveCart(res.data.cart);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group cart');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCart = async () => {
    if (!cartCodeInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const cleanCode = cartCodeInput.trim().toUpperCase();
      const res = await api.post(`/group-cart/${cleanCode}/join`);
      if (res.data.success) {
        // Fetch full cart
        const fullRes = await api.get(`/group-cart/${cleanCode}`);
        setActiveCart(fullRes.data.cart);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not find group cart with this code');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedMenuItem || !activeCart) return;
    try {
      const res = await api.post(`/group-cart/${activeCart.code}/items`, {
        menuItemId: selectedMenuItem,
        quantity: 1,
      });
      if (res.data.success) {
        setActiveCart(res.data.cart);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!activeCart) return;
    try {
      const res = await api.delete(`/group-cart/${activeCart.code}/items/${itemId}`);
      if (res.data.success) {
        setActiveCart(res.data.cart);
      }
    } catch (err) {
      console.warn('Remove failed:', err);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/?group=${activeCart?.code}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Compute bill per member for split preview
  const memberSplits = {};
  let squadTotal = 0;

  if (activeCart?.items) {
    for (const it of activeCart.items) {
      const person = it.userName || 'Friend';
      const cost = it.price * it.quantity;
      squadTotal += cost;
      if (!memberSplits[person]) {
        memberSplits[person] = { name: person, amount: 0, itemsCount: 0 };
      }
      memberSplits[person].amount += cost;
      memberSplits[person].itemsCount += it.quantity;
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-12">
      {/* Group Cart Hero */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">
          <Users className="w-4 h-4" />
          <span>BreakBite Squad Feature</span>
        </div>
        <h1 className="text-2xl font-black">Group Tray Sharing</h1>
        <p className="text-xs text-orange-100 max-w-md mt-1 leading-relaxed">
          Order together with your hostel squad or project group! Everyone adds their food to a single tray, split the bill automatically, and pick up in one go.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!activeCart ? (
        /* Create or Join Box */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Create New Cart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Start a Squad Cart</h3>
              <p className="text-xs text-slate-500 mt-0.5">Generate a shareable code for your group</p>
            </div>

            <input
              type="text"
              value={newCartTitle}
              onChange={(e) => setNewCartTitle(e.target.value)}
              placeholder="e.g. Mech Boys Lunch / CS-301"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
            />

            <button
              type="button"
              disabled={loading}
              onClick={handleCreateCart}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-colors"
            >
              Create Squad Tray
            </button>
          </div>

          {/* Join Existing Cart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Join Friend's Tray</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enter the 6-character code your friend shared</p>
            </div>

            <input
              type="text"
              value={cartCodeInput}
              onChange={(e) => setCartCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. BB-9K2F"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono uppercase"
            />

            <button
              type="button"
              disabled={loading}
              onClick={handleJoinCart}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Join Squad
            </button>
          </div>
        </div>
      ) : (
        /* Active Squad Cart View */
        <div className="space-y-4">
          {/* Cart Header Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                  Live Squad Cart
                </span>
                <h2 className="text-lg font-black text-slate-900">{activeCart.title}</h2>
                <span className="text-xs text-slate-500">
                  Host: <strong className="text-slate-800">{activeCart.hostName}</strong> • {activeCart.members?.length || 1} members connected
                </span>
              </div>

              {/* Share Code Pill */}
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-2xl">
                <span className="font-mono font-black text-orange-950 text-sm">{activeCart.code}</span>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="p-1 rounded-lg bg-white shadow-xs text-orange-700 hover:bg-orange-100"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Add item to squad cart */}
            <div className="mt-4 pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Add an item to the squad tray:
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedMenuItem}
                  onChange={(e) => setSelectedMenuItem(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  {menuItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} — ₹{item.price}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-xs"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Items in Squad Cart */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
              <span>Squad Tray Items ({activeCart.items?.length || 0})</span>
              <span className="text-orange-600 font-black">₹{squadTotal}</span>
            </h3>

            {activeCart.items?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No items added yet. Select an item above or share code with friends!
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeCart.items?.map((it) => (
                  <div key={it._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">
                        {it.quantity}x {it.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Added by <strong className="text-slate-600">{it.userName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900">₹{it.price * it.quantity}</span>
                      {(it.user === user?._id || it.user === user?.id || activeCart.host === user?._id) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it._id)}
                          className="text-slate-300 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Who Owes What (Split Calculator) */}
          {Object.keys(memberSplits).length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-3xl p-5 space-y-2">
              <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-orange-600" />
                <span>Split Bill Breakdown</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {Object.values(memberSplits).map((split, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-200/50">
                    <span className="text-slate-600 font-semibold truncate block">{split.name}</span>
                    <span className="text-sm font-black text-slate-900">₹{split.amount}</span>
                    <span className="text-[10px] text-slate-400 block">{split.itemsCount} dishes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Place Squad Order CTA (Host only or any member) */}
          {activeCart.items?.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (onCheckoutGroupCart) {
                  onCheckoutGroupCart(activeCart);
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
            >
              <span>Transfer Squad Tray to Checkout (₹{squadTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
