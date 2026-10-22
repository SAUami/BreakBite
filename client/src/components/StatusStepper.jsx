import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, ChefHat, Sparkles, PackageCheck, AlertCircle } from 'lucide-react';

const steps = [
  {
    key: 'Placed',
    label: 'Order Placed',
    sub: 'Received & Scheduled',
    icon: Clock,
  },
  {
    key: 'Preparing',
    label: 'In The Kitchen',
    sub: 'Hot on Tawa & Fryer',
    icon: ChefHat,
  },
  {
    key: 'Ready',
    label: 'Ready for Pickup',
    sub: 'Hot & Waiting at Counter',
    icon: Sparkles,
  },
  {
    key: 'Collected',
    label: 'Collected',
    sub: 'Enjoy your food!',
    icon: PackageCheck,
  },
];

export default function StatusStepper({ currentStatus = 'Placed', history = [] }) {
  if (currentStatus === 'Cancelled') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800">
        <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Order Cancelled</h4>
          <p className="text-xs text-rose-700">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="w-full py-2">
      <div className="relative flex items-center justify-between">
        {/* Background connector line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />

        {/* Animated active fill line */}
        <motion.div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-orange-500 to-amber-500 z-0"
          initial={{ width: 0 }}
          animate={{
            width: `${(activeIndex / (steps.length - 1)) * 88}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isPending = idx > activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : isCurrent
                    ? 'bg-orange-500 text-white ring-4 ring-orange-200/80 shadow-orange-300'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {isDone ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>

              <div className="text-center mt-2 w-20">
                <p
                  className={`text-[11px] font-bold leading-tight ${
                    isCurrent
                      ? 'text-orange-600 font-extrabold'
                      : isDone
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[9px] text-slate-400 hidden sm:block mt-0.5 leading-tight">
                  {step.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
