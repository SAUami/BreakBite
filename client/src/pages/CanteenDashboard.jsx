import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Clock,
  Flame,
  Volume2,
  VolumeX,
  Plus,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  TrendingUp,
  BarChart3,
  Utensils,
  Search,
  Sparkles,
  RefreshCw,
  Bell,
  FileSpreadsheet,
  Download,
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  Check,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import api from '../api';
import LoadMeter from '../components/LoadMeter';
import { playOrderAlertSound, playSuccessChime } from '../components/AudioAlert';
import { useSocket } from '../hooks/useSocket';

export default function CanteenDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'analytics'
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  // Menu items state for stock management
  const [menuItems, setMenuItems] = useState([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    price: '',
    category: 'Snacks',
    prepTimeMinutes: 5,
    isVeg: true,
    description: '',
  });

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState('All');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [excelDownloading, setExcelDownloading] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  const { socket } = useSocket();

  // Fetch all canteen orders
  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/canteen/all');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.warn('Failed to fetch canteen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu for stock control
  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      if (res.data.success) {
        setMenuItems(res.data.items);
      }
    } catch (err) {
      console.warn('Failed to fetch menu:', err);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.warn('Failed to fetch analytics:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    fetchAnalytics();

    if (socket) {
      socket.emit('join:canteen');

      // Realtime listener for incoming orders
      const handleNewOrder = (order) => {
        setOrders((prev) => [order, ...prev]);
        setNewOrderAlert(`New Order #${order.orderNumber} arrived!`);

        if (soundEnabled) {
          playOrderAlertSound();
        }

        setTimeout(() => setNewOrderAlert(null), 6000);
        fetchAnalytics();
      };

      // Realtime listener for status changes
      const handleStatusChanged = (updatedOrder) => {
        setOrders((prev) =>
          prev.map((ord) => (ord._id === updatedOrder._id ? updatedOrder : ord))
        );
      };

      socket.on('order:new', handleNewOrder);
      socket.on('order:status_changed', handleStatusChanged);

      return () => {
        socket.off('order:new', handleNewOrder);
        socket.off('order:status_changed', handleStatusChanged);
      };
    }
  }, [socket, soundEnabled]);

  // Update order status with 1-click
  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((ord) => (ord._id === orderId ? res.data.order : ord))
        );
        if (newStatus === 'Ready') {
          playSuccessChime();
        }
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Toggle In Stock / Out of Stock
  const handleToggleStock = async (itemId) => {
    try {
      const res = await api.patch(`/menu/${itemId}/toggle-stock`);
      if (res.data.success) {
        setMenuItems((prev) =>
          prev.map((i) => (i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i))
        );
      }
    } catch (err) {
      console.error('Failed to toggle stock:', err);
    }
  };

  // Add new menu item
  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/menu', newItemForm);
      if (res.data.success && res.data.item) {
        setMenuItems((prev) => [res.data.item, ...prev]);
        setIsAddItemModalOpen(false);
        setNewItemForm({
          name: '',
          price: '',
          category: 'Snacks',
          prepTimeMinutes: 5,
          isVeg: true,
          description: '',
        });
      }
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  // 1-Click Excel / CSV Export with all student information & day-wise sales
  const handleDownloadExcel = () => {
    setExcelDownloading(true);

    try {
      const dataToExport = analytics?.detailedStudentOrders || [];
      if (dataToExport.length === 0) {
        alert('No order data available to export.');
        setExcelDownloading(false);
        return;
      }

      // Headers for Excel
      const headers = [
        'Order ID',
        'Date',
        'Time',
        'Student Name',
        'Roll / Student ID',
        'Email Address',
        'Phone Number',
        'Dishes Ordered',
        'Total Quantity',
        'Order Total (INR)',
        'Pickup Mode',
        'Pickup Slot',
        'Status',
      ];

      const escapeCell = (val) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = dataToExport.map((row) => [
        escapeCell(row.orderNumber),
        escapeCell(row.dateFormatted),
        escapeCell(row.timeFormatted),
        escapeCell(row.studentName),
        escapeCell(row.studentId),
        escapeCell(row.studentEmail),
        escapeCell(row.studentPhone),
        escapeCell(row.itemsSummary),
        row.totalQuantity,
        row.total,
        escapeCell(row.pickupMode),
        escapeCell(row.pickupSlot),
        escapeCell(row.status),
      ]);

      // UTF-8 BOM so Excel opens with proper Indian currency and text formatting
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `BreakBite_Canteen_Student_Sales_${new Date().toISOString().substring(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 4000);
    } catch (err) {
      console.error('Export error:', err);
      // Fallback to backend export endpoint
      window.open('/api/analytics/export-csv', '_blank');
    } finally {
      setExcelDownloading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'All') return true;
    return o.status === statusFilter;
  });

  // Filter detailed student orders for the analytics table
  const filteredStudentOrders = (analytics?.detailedStudentOrders || []).filter((ord) => {
    const matchesDate = analyticsDateFilter === 'All' || ord.dateKey === analyticsDateFilter;
    const query = analyticsSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ord.studentName.toLowerCase().includes(query) ||
      ord.studentId.toLowerCase().includes(query) ||
      ord.orderNumber.toLowerCase().includes(query) ||
      ord.itemsSummary.toLowerCase().includes(query) ||
      ord.studentEmail.toLowerCase().includes(query);

    return matchesDate && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* Canteen Top Command Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black">Canteen Kitchen Command</h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                LIVE TERMINAL
              </span>
            </div>
            <p className="text-xs text-slate-400">GIIT Central Campus Kitchen • Bell-Sync Load Dispatcher</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Audio alerts for new incoming orders"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Chime {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchOrders();
              fetchAnalytics();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh order board"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Order Realtime Toast Alert */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <Bell className="w-5 h-5 animate-bounce" />
              <span>{newOrderAlert}</span>
            </div>
            <span className="text-xs text-orange-200">Added to board</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Excel Download Success Toast */}
      <AnimatePresence>
        {downloadSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Report downloaded successfully! (Formatted with student details)</span>
            </div>
            <Check className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subnav Tabs: Orders Board, Stock Control, Analytics */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'orders'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Orders Queue ({orders.filter((o) => o.status !== 'Collected').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'menu'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Menu & Stock Toggle</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('analytics');
            fetchAnalytics();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'analytics'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Kitchen Analytics & Daily Reports</span>
        </button>
      </div>

      {/* TAB 1: ORDERS BOARD */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Top Kitchen Load Bar in Canteen */}
          <LoadMeter />

          {/* Filter Status Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', 'Placed', 'Preparing', 'Ready', 'Collected'].map((st) => {
              const count =
                st === 'All'
                  ? orders.length
                  : orders.filter((o) => o.status === st).length;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          {/* Orders Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-5 border border-slate-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <div className="text-3xl mb-2">🍽️</div>
              <h3 className="font-bold text-slate-800 text-base">No Orders in this Category</h3>
              <p className="text-xs text-slate-500 mt-1">Orders matching this status will show up here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const isBellSync = order.pickupMode === 'bell_sync';
                const pickupTime = new Date(order.scheduledPickupTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const fireTime = new Date(order.fireTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white rounded-3xl p-5 border flex flex-col justify-between shadow-sm transition-all ${
                      order.status === 'Ready'
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : order.status === 'Preparing'
                        ? 'border-amber-300 bg-amber-50/20'
                        : order.status === 'Collected'
                        ? 'border-slate-200 opacity-60'
                        : 'border-orange-300'
                    }`}
                  >
                    <div>
                      {/* Card Header: Token & Mode */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Student: <strong className="text-slate-800">{order.user?.name || 'Aarav'}</strong>
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              order.status === 'Ready'
                                ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400'
                                : order.status === 'Preparing'
                                ? 'bg-amber-100 text-amber-800'
                                : order.status === 'Collected'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            ● {order.status}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">
                            {isBellSync ? `Pickup: ${pickupTime}` : 'Immediate ASAP'}
                          </span>
                        </div>
                      </div>

                      {/* Bell-Sync Fire Timing Indicator */}
                      <div className="mt-2.5 p-2 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-600" /> Fire Target:
                        </span>
                        <span className="font-extrabold text-orange-600">{fireTime}</span>
                      </div>

                      {/* Item list */}
                      <div className="mt-3 space-y-1.5">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50"
                          >
                            <span className="font-extrabold text-slate-900">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ⏱️ {(it.prepTimeMinutes || 5) * it.quantity}m
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="mt-2 text-[11px] bg-amber-50 text-amber-900 border border-amber-200/60 p-2 rounded-xl">
                          <strong className="text-amber-950">Student Note: </strong>
                          {order.specialInstructions}
                        </div>
                      )}
                    </div>

                    {/* Status Advance Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      {order.status === 'Placed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order._id, 'Preparing')}
                          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5"
                        >
                          <Flame className="w-4 h-4" />
                          <span>Fire to Kitchen (Start Cooking)</span>
                        </button>
                      )}

                      {order.status === 'Preparing' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order._id, 'Ready')}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Food Ready at Counter 2</span>
                        </button>
                      )}

                      {order.status === 'Ready' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order._id, 'Collected')}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                        >
                          <PackageCheck className="w-4 h-4 text-emerald-400" />
                          <span>Student Collected / Handed Over</span>
                        </button>
                      )}

                      {order.status === 'Collected' && (
                        <div className="text-center text-xs text-slate-400 font-semibold py-1">
                          Completed & Fulfilled
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU & STOCK MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Canteen Dish Inventory</h2>
              <p className="text-xs text-slate-500">Toggle In Stock / Out of Stock instantly across all student screens</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddItemModalOpen(true)}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {menuItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-4 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{item.name}</h4>
                    <span className="text-xs text-slate-500 font-bold">₹{item.price} • {item.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStock(item._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    item.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {item.isAvailable ? 'In Stock' : 'Sold Out'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CANTEEN ANALYTICS WITH DAY-WISE MEAL TRENDS & EXCEL EXPORT */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Top Header with Excel Export Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Campus Sales & Student Orders Ledger</h2>
                  <p className="text-xs text-slate-500">Day-wise meal popularity analysis and downloadable spreadsheet</p>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={excelDownloading}
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{excelDownloading ? 'Generating Excel...' : 'Download Excel Sheet (.CSV)'}</span>
            </motion.button>
          </div>

          {/* Key Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Revenue Today</span>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{analytics.totalRevenue}</div>
              <span className="text-[10px] text-emerald-600 font-semibold">Real-time collections</span>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Orders Processed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{analytics.totalOrdersToday}</div>
              <span className="text-[10px] text-slate-500 font-semibold">{analytics.completedOrdersToday} collected</span>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Active Kitchen Orders</span>
              <div className="text-2xl font-black text-orange-600 mt-1">{analytics.activeOrdersNow}</div>
              <span className="text-[10px] text-orange-600 font-semibold">Cooking right now</span>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Average Tray Value</span>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{analytics.averageOrderValue}</div>
              <span className="text-[10px] text-slate-500 font-semibold">Per student order</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* FEATURE 1: KIS DIN KON SA MEAL JYADA SALE HO RAHA HAI */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                    <Flame className="w-4 h-4" />
                  </span>
                  <h3 className="font-black text-base text-slate-900">
                    Day-Wise Best Selling Meals (Kis Din Konsa Meal Top Par Hai)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track day-by-day consumer demand so chef can prep ingredients in advance!
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                {analytics.dailyMealTrends?.length || 0} Recorded Days
              </span>
            </div>

            {/* Daily Meal Trend Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {analytics.dailyMealTrends?.map((day, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 p-4 bg-gradient-to-b from-slate-50/50 to-white hover:border-orange-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-600" />
                        <span>{day.formattedDate}</span>
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {day.totalOrders} Orders
                      </span>
                    </div>

                    {/* Day's Top Meal Highlight */}
                    <div className="mt-3 p-3 rounded-xl bg-orange-50/70 border border-orange-200/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 flex items-center gap-1">
                        🏆 #1 Bestseller of the Day
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-0.5 line-clamp-1">
                        {day.topMeal?.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mt-1">
                        <span>{day.topMeal?.quantity} plates sold</span>
                        <span className="font-bold text-orange-700">₹{day.topMeal?.revenue}</span>
                      </div>
                    </div>

                    {/* Runner-up items */}
                    {day.top3Dishes && day.top3Dishes.length > 1 && (
                      <div className="mt-2.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Also Popular:
                        </span>
                        {day.top3Dishes.slice(1, 3).map((d, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-center justify-between text-[11px] text-slate-600"
                          >
                            <span className="truncate max-w-[130px] font-medium">
                              #{dIdx + 2} {d.name}
                            </span>
                            <span className="text-slate-400 font-semibold">{d.quantity} sold</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Day Turnover</span>
                    <span className="text-emerald-700 font-black">₹{day.totalRevenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================== */}
          {/* FEATURE 2: PER-DAY SALES TABLE WITH STUDENT DETAILS */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <h3 className="font-black text-base text-slate-900">
                    Per-Day Student Order Log & Contact Ledger
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete order history with student roll number, email, phone, dishes, and total amount
                </p>
              </div>

              {/* Filter Controls: Date Selector + Search Input */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Date Filter Dropdown */}
                <select
                  value={analyticsDateFilter}
                  onChange={(e) => setAnalyticsDateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="All">All Recorded Dates</option>
                  {analytics.dailyMealTrends?.map((day) => (
                    <option key={day.dateKey} value={day.dateKey}>
                      {day.formattedDate}
                    </option>
                  ))}
                </select>

                {/* Student / Order Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={analyticsSearchQuery}
                    onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                    placeholder="Search student or token..."
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-hidden w-48"
                  />
                </div>

                {/* Excel Download button in table header */}
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  title="Export this ledger to Excel spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Student Orders Table */}
            {filteredStudentOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-y border-slate-200">
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Token</th>
                      <th className="py-3 px-3">Student Name & ID</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Dishes Ordered</th>
                      <th className="py-3 px-3">Slot / Mode</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudentOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{ord.dateFormatted}</div>
                          <div className="text-[10px] text-slate-400">{ord.timeFormatted}</div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900">
                          #{ord.orderNumber}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{ord.studentName}</div>
                          <div className="text-[10px] font-semibold text-orange-600 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            <span>{ord.studentId}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500">
                          <div>{ord.studentEmail}</div>
                          <div className="text-slate-400 text-[10px]">{ord.studentPhone}</div>
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <span className="font-medium text-slate-800 line-clamp-2">
                            {ord.itemsSummary}
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{ord.pickupSlot}</div>
                          <div className="text-[10px] text-slate-400">{ord.pickupMode}</div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap text-right font-black text-slate-900">
                          ₹{ord.total}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              ord.status === 'Ready'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'Preparing'
                                ? 'bg-amber-100 text-amber-800'
                                : ord.status === 'Collected'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span>Showing {filteredStudentOrders.length} student orders</span>
              <span>All monetary totals in INR (₹)</span>
            </div>
          </div>

          {/* Peak Hours & Bestsellers Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Peak Hours Chart */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span>Peak Rush Hours (Today)</span>
              </h3>

              <div className="space-y-2 pt-2">
                {analytics.peakHoursChart?.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-16 font-bold text-slate-500">{p.hour}</span>
                    <div className="flex-1 bg-slate-100 h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (p.orders / 6) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-extrabold text-slate-800">{p.orders}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Items Today */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Top Selling Dishes (Today's Leaderboard)</span>
              </h3>

              <div className="divide-y divide-slate-100">
                {analytics.topItems?.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-800">
                        #{idx + 1} {it.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{it.quantity} plates served</span>
                    </div>
                    <span className="font-black text-slate-900">₹{it.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Dish Modal */}
      {isAddItemModalOpen && (
        <div
          onClick={() => setIsAddItemModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="font-black text-slate-900 text-lg">Add New Dish to Canteen</h3>

            <form onSubmit={handleCreateMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="e.g. Masala Dosa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newItemForm.price}
                    onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="60"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    required
                    value={newItemForm.prepTimeMinutes}
                    onChange={(e) => setNewItemForm({ ...newItemForm, prepTimeMinutes: e.target.value })}
                    placeholder="6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newItemForm.category}
                  onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Meals">Meals</option>
                  <option value="Quick Bites">Quick Bites</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vegCheck"
                  checked={newItemForm.isVeg}
                  onChange={(e) => setNewItemForm({ ...newItemForm, isVeg: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="vegCheck" className="font-bold text-slate-700">Pure Veg</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-bold"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
