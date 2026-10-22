import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('breakbite_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [walkingMinutes, setWalkingMinutes] = useState(4);
  const [selectedSlot, setSelectedSlot] = useState(null); // null means ASAP by default

  useEffect(() => {
    localStorage.setItem('breakbite_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i._id === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          _id: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          image: menuItem.image,
          isVeg: menuItem.isVeg,
          prepTimeMinutes: menuItem.prepTimeMinutes || 5,
        },
      ];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setItems((prev) => {
      return prev
        .map((i) => {
          if (i._id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (itemId) => {
    setItems((prev) => prev.filter((i) => i._id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
    setSpecialInstructions('');
    setSelectedSlot(null);
  };

  const cartCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const cartTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  // Approximate prep time calculation
  const totalPrepMinutes = items.length === 0 ? 0 : Math.min(
    25,
    Math.max(
      ...items.map((i) => i.prepTimeMinutes || 5),
      Math.round(
        Math.max(...items.map((i) => i.prepTimeMinutes || 5)) +
          (items.reduce((acc, i) => acc + (i.quantity - 1) * 0.5, 0))
      )
    )
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
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
        walkingMinutes,
        setWalkingMinutes,
        selectedSlot,
        setSelectedSlot,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
