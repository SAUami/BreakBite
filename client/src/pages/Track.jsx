import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  QrCode,
  MapPin,
  CheckCircle2,
  ChefHat,
  Receipt,
  Share2,
  RotateCcw,
} from 'lucide-react';
import api from '../api';
import StatusStepper from '../components/StatusStepper';
import LeaveNowNudge from '../components/LeaveNowNudge';
import { playSuccessChime } from '../components/AudioAlert';
import { useSocket } from '../hooks/useSocket';

export default function Track({ orderId, onBack, onReorder }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const { socket } = useSocket();

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success && res.data.order) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load order tracking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    if (socket && orderId) {
      socket.emit('join:order', orderId);

      const handleStatusUpdate = (updatedOrder) => {
        if (updatedOrder._id === orderId) {
          setOrder(updatedOrder);

          // If marked Ready, sound chime and confetti!
          if (updatedOrder.status === 'Ready') {
            playSuccessChime();
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.5 },
              colors: ['#ea580c', '#10b981', '#f59e0b'],
            });
          }
        }
      };

      socket.on('order:status_update', handleStatusUpdate);
      socket.on('order:user_update', handleStatusUpdate);

      return () => {
        socket.off('order:status_update', handleStatusUpdate);
        socket.off('order:user_update', handleStatusUpdate);
      };
    }
  }, [orderId, socket]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-bold">Connecting to Canteen Kitchen...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="font-bold text-slate-800 text-base">Order Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Please select an order from your history.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-6 py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-xs"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  const isBellSync = order.pickupMode === 'bell_sync';
  const pickupTimeFormatted = new Date(order.scheduledPickupTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const fireTimeFormatted = new Date(order.fireTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24 sm:pb-12">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>

        <span className="text-xs font-black text-slate-400">
          Order placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Signature Leave-Now Nudge Widget */}
      <LeaveNowNudge order={order} />

      {/* Main Order Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
        {/* Token Code & Status Pill */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Pickup Token Code
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                #{order.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="p-1.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 shadow-xs transition-colors"
                title="View Fullscreen Pickup QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                order.status === 'Ready'
                  ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400 animate-bounce'
                  : order.status === 'Preparing'
                  ? 'bg-amber-100 text-amber-800'
                  : order.status === 'Collected'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              ● {order.status}
            </span>
            <div className="text-[10px] text-slate-400 mt-1 font-semibold">
              {order.status === 'Ready' ? 'Counter 2 (Express Handover)' : 'Kitchen Queue'}
            </div>
          </div>
        </div>

        {/* Animated Stepper */}
        <StatusStepper currentStatus={order.status} history={order.statusHistory} />

        {/* Bell-Sync Schedule Diagnostics Box */}
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Bell-Sync™ Schedule Diagnostics</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
              {isBellSync ? 'Synchronized' : 'Express ASAP'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
              <span className="text-[10px] text-slate-500 font-semibold block">Pickup Target</span>
              <span className="font-extrabold text-slate-900 text-sm">{pickupTimeFormatted}</span>
              <span className="text-[9px] text-slate-400 block truncate">
                {order.pickupSlot?.slotLabel || 'Lecture Break'}
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
              <span className="text-[10px] text-slate-500 font-semibold block">Kitchen Fire Time</span>
              <span className="font-extrabold text-orange-600 text-sm">{fireTimeFormatted}</span>
              <span className="text-[9px] text-slate-400 block truncate">Cooking starts here</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-semibold block">Walking Buffer</span>
              <span className="font-extrabold text-slate-900 text-sm">{order.walkingMinutes || 4} mins</span>
              <span className="text-[9px] text-emerald-700 block font-semibold">Campus walk synced</span>
            </div>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span>Items in this Tray</span>
            </span>
            <span>{order.items.length} dishes</span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/40">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-2 px-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 border flex items-center justify-center shrink-0 ${
                      it.isVeg ? 'border-emerald-600' : 'border-red-600'
                    }`}
                  >
                    <div className={`w-1 h-1 rounded-full ${it.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                  </div>
                  <span className="font-bold text-slate-800">
                    {it.name} <span className="text-slate-400 font-normal">x{it.quantity}</span>
                  </span>
                </div>
                <span className="font-bold text-slate-900">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>

          {order.specialInstructions && (
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-600">
              <span className="font-bold text-slate-700">Note for Chef: </span>
              {order.specialInstructions}
            </div>
          )}

          {/* Pricing Total */}
          <div className="flex justify-between items-center pt-2 text-sm">
            <span className="font-extrabold text-slate-900">Total Paid</span>
            <span className="font-black text-lg text-slate-900">₹{order.total}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {showQRModal && (
        <div
          onClick={() => setShowQRModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4"
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Scan at Counter 2</span>
              <h3 className="text-2xl font-black text-slate-900">#{order.orderNumber}</h3>
            </div>

            <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl inline-block shadow-sm">
              <QRCodeSVG
                value={order.qrCodeValue || `BREAKBITE:${order.orderNumber}`}
                size={180}
                level="M"
              />
            </div>

            <p className="text-xs text-slate-500">
              Show this QR code or token <strong className="text-slate-800">#{order.orderNumber}</strong> to collect your food instantly.
            </p>

            <button
              type="button"
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
