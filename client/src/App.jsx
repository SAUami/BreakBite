import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CartDrawer from './components/CartDrawer';
import Menu from './pages/Menu';
import Track from './pages/Track';
import Orders from './pages/Orders';
import CanteenDashboard from './pages/CanteenDashboard';
import GroupCart from './pages/GroupCart';
import Login from './pages/Login';
import api from './api';

function MainApp() {
  const { user, isCanteen } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();

  const [activeTab, setActiveTab] = useState('menu');
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  // Set default view based on role
  useEffect(() => {
    if (isCanteen) {
      setActiveTab('canteen');
    } else if (activeTab === 'canteen') {
      setActiveTab('menu');
    }
  }, [isCanteen]);

  // Fetch student's most recent active order to display persistent status pill
  useEffect(() => {
    if (!user || isCanteen) return;

    const checkActiveOrder = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.data.success && res.data.orders.length > 0) {
          const ongoing = res.data.orders.find((o) =>
            ['Placed', 'Preparing', 'Ready'].includes(o.status)
          );
          setActiveOrder(ongoing || null);
          if (ongoing && !trackingOrderId && activeTab === 'track') {
            setTrackingOrderId(ongoing._id);
          }
        }
      } catch (err) {
        // silent
      }
    };

    checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 15000);
    return () => clearInterval(interval);
  }, [user, isCanteen, activeTab, trackingOrderId]);

  const handleNavigate = (tab, payload) => {
    if (tab === 'track' && payload) {
      setTrackingOrderId(payload);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order) => {
    setActiveOrder(order);
    setTrackingOrderId(order._id);
    setActiveTab('track');
  };

  const handleCheckoutGroupCart = (groupCart) => {
    // Add group items to main cart tray
    for (const it of groupCart.items) {
      for (let i = 0; i < (it.quantity || 1); i++) {
        addToCart({
          _id: it.menuItem,
          name: it.name,
          price: it.price,
          isVeg: it.isVeg,
          prepTimeMinutes: it.prepTimeMinutes,
        });
      }
    }
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <Navbar
        onNavigate={handleNavigate}
        activeTab={activeTab}
        activeOrder={activeOrder}
      />

      <main className="flex-1">
        {activeTab === 'login' && <Login onSuccess={() => setActiveTab(isCanteen ? 'canteen' : 'menu')} />}
        {activeTab === 'menu' && <Menu />}
        {activeTab === 'track' && (
          <Track
            orderId={trackingOrderId || activeOrder?._id}
            onBack={() => setActiveTab('menu')}
          />
        )}
        {activeTab === 'orders' && (
          <Orders
            onSelectOrder={(id) => handleNavigate('track', id)}
            onNavigateMenu={() => setActiveTab('menu')}
          />
        )}
        {activeTab === 'group-cart' && (
          <GroupCart
            onCheckoutGroupCart={handleCheckoutGroupCart}
            onNavigateMenu={() => setActiveTab('menu')}
          />
        )}
        {activeTab === 'canteen' && <CanteenDashboard />}
      </main>

      {/* Cart Drawer Bottom Sheet */}
      <CartDrawer onOrderSuccess={handleOrderSuccess} />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
