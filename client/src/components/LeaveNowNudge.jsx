import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, Bell, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function LeaveNowNudge({ order }) {
  const [timeState, setTimeState] = useState({
    shouldLeaveNow: false,
    minsUntilLeave: 0,
    minsUntilReady: 0,
  });

  useEffect(() => {
    if (!order || ['Collected', 'Cancelled'].includes(order.status)) return;

    const checkTime = () => {
      const now = new Date().getTime();
      const readyTime = new Date(order.estimatedReadyTime || order.scheduledPickupTime).getTime();
      const walkMins = order.walkingMinutes || 4;
      const leaveTime = readyTime - walkMins * 60 * 1000;

      const diffLeaveMs = leaveTime - now;
      const diffReadyMs = readyTime - now;

      const minsUntilLeave = Math.ceil(diffLeaveMs / (60 * 1000));
      const minsUntilReady = Math.ceil(diffReadyMs / (60 * 1000));

      const shouldLeave = diffLeaveMs <= 0 || order.status === 'Ready';

      setTimeState({
        shouldLeaveNow: shouldLeave,
        minsUntilLeave,
        minsUntilReady,
      });
    };

    checkTime();
    const interval = setInterval(checkTime, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [order]);

  if (!order || ['Collected', 'Cancelled'].includes(order.status)) return null;

  return (
    <AnimatePresence>
      {timeState.shouldLeaveNow ? (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-4 shadow-lg shadow-orange-500/25 border border-orange-400 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
              <Footprints className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="bg-white text-orange-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Bell-Sync Nudge
                </span>
                <span className="text-orange-100 text-xs font-semibold">
                  Token #{order.orderNumber}
                </span>
              </div>

              <h4 className="text-base font-black tracking-tight mt-0.5">
                Ab nikal jao! Only {order.walkingMinutes || 4} min walk hai
              </h4>

              <p className="text-xs text-orange-100 mt-0.5 leading-snug">
                {order.status === 'Ready'
                  ? 'Your food is steaming at Counter 2. Grab it fresh!'
                  : 'Kitchen has dropped your food on pan — it will be ready just as you arrive!'}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl bg-slate-900 text-slate-100 p-3.5 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                Relax in class! Bell-Sync is timing your order
              </div>
              <div className="text-[11px] text-slate-400">
                "Leave Now" alert in ~<span className="text-orange-400 font-bold">{Math.max(1, timeState.minsUntilLeave)} mins</span> ({order.walkingMinutes || 4}m walk saved)
              </div>
            </div>
          </div>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-medium">
            Slot: {order.pickupSlot?.slotLabel || 'Express'}
          </span>
        </div>
      )}
    </AnimatePresence>
  );
}
