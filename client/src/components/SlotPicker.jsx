import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock, Zap, MapPin, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';

export default function SlotPicker() {
  const { items, selectedSlot, setSelectedSlot, walkingMinutes, setWalkingMinutes, totalPrepMinutes } = useCart();
  const [pickupMode, setPickupMode] = useState(selectedSlot ? 'bell_sync' : 'asap');
  const [slotData, setSlotData] = useState(null);
  const [loading, setLoading] = useState(true);

  const walkingLocations = [
    { name: 'Academic Block A', mins: 3 },
    { name: 'Library / Reading Room', mins: 4 },
    { name: 'Hostels (H1-H4)', mins: 6 },
    { name: 'Sports Complex / Ground', mins: 7 },
  ];

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const res = await api.post('/orders/slots', { items });
        if (res.data.success) {
          setSlotData(res.data.data);
          // If in bell_sync and no slot selected, preselect first available
          if (pickupMode === 'bell_sync' && !selectedSlot && res.data.data.slots.length > 0) {
            const firstAvailable = res.data.data.slots.find((s) => s.available);
            if (firstAvailable) {
              setSelectedSlot(firstAvailable);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching slots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [items, pickupMode]);

  const handleModeChange = (mode) => {
    setPickupMode(mode);
    if (mode === 'asap') {
      setSelectedSlot(null);
    } else if (slotData?.slots?.length > 0) {
      const firstAvailable = slotData.slots.find((s) => s.available);
      setSelectedSlot(firstAvailable || null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pickup Mode Switcher: ASAP vs Bell-Sync */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => handleModeChange('asap')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            pickupMode === 'asap'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 fill-orange-500" />
          <span>Immediate (ASAP)</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('bell_sync')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            pickupMode === 'bell_sync'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 fill-white" />
          <span>Bell-Sync (Scheduled)</span>
        </button>
      </div>

      {pickupMode === 'bell_sync' ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Bell-Sync Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-300/60 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-amber-900">Bell-Sync™ Just-in-Time Guarantee</p>
              <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
                Order now, pick up when your lecture ends. We delay kitchen firing until {totalPrepMinutes}m before your slot so your food is sizzling hot right when you arrive!
              </p>
            </div>
          </div>

          {/* Slot Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Your Pickup Slot (5-min intervals)
            </label>

            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-12 bg-slate-200 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                {slotData?.slots?.map((slot) => {
                  const isSelected = selectedSlot?.isoTime === slot.isoTime;

                  return (
                    <button
                      key={slot.isoTime}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        !slot.available
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-400/30 font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{slot.timeFormatted}</span>
                        {slot.isBellSyncPreset && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-bold">
                            Bell 🔔
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {slot.label}
                      </div>

                      <div className="text-[9px] mt-1 font-semibold flex items-center justify-between">
                        {slot.available ? (
                          <span className="text-emerald-700">{slot.remainingCapacity} slots left</span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 inline" /> Full
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3 text-xs text-orange-950 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600 shrink-0" />
          <div>
            <span className="font-bold">Fastest Express: </span>
            Kitchen fires immediately. Ready in approx <span className="font-extrabold text-orange-600">{totalPrepMinutes} minutes</span>.
          </div>
        </div>
      )}

      {/* Campus Walking Distance / Location Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Where are you ordering from?</span>
          </div>
          <span className="text-xs font-extrabold text-orange-600">{walkingMinutes} mins walk</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {walkingLocations.map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => setWalkingMinutes(loc.mins)}
              className={`text-left p-2 rounded-xl text-xs transition-all border ${
                walkingMinutes === loc.mins
                  ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold shadow-xs'
                  : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="truncate font-semibold">{loc.name}</div>
              <div className="text-[10px] text-slate-500">{loc.mins} min walk to canteen</div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 italic">
          💡 We calculate your personal "Leave Now" nudge based on this walk time!
        </p>
      </div>
    </div>
  );
}
