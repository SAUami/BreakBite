# 🍱 BreakBite — Digital Canteen with Bell-Sync™

> Built for **CodeQuest Hackathon (GIIT)** — Challenge: *"Digital Canteen Ordering"*.
> Solving the root cause of campus lunch spikes with **Just-in-Time Kitchen Scheduling**.

---

## ⚡ The Core Problem & Our Signature Solution

### The Rush-Spike Problem
Normal canteen apps only offer **"Order now and wait in line"**. When 300 students finish class at 1:10 PM, everyone rushes to the counter at the exact same moment. The kitchen gets clogged with 40-minute wait times, cold samosas, and chaotic crowds.

### The Solution: Bell-Sync™ (Just-in-Time Ordering)
**BreakBite** eliminates rush spikes through time-slotted kitchen dispatching:
1. **Student chooses class-end slot** (e.g., *"1:10 PM — Recess Bell"*).
2. **Server-side `slotEngine.js`** computes prep times, caps orders to **max 5 per 5-minute window**, and delays kitchen firing until the exact required moment:
   $$\text{FireTime} = \text{PickupTime} - \text{TotalPrepTime}$$
3. **Food is ready the second the student steps up to Counter 2** — no cold food, no counter crowds.
4. **"Leave Now" Nudge**: Real-time push alert calculated from campus walking distance (e.g. 4 mins from Library): *"Ab nikal jao! Food is hot on the pan."*
5. **Kitchen Load Meter**: Live Low / Medium / High counter pacing meter powered by active cooking minutes.
6. **Squad Group Cart**: Friends order together under one tray link, with automatic bill-splitting breakdown.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 (Vite) + Tailwind CSS v4 + Framer Motion |
| **Icons & Visuals** | Lucide React + Canvas Confetti + QRCode.react |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas (Mongoose) + Zero-Config In-Memory Fallback |
| **Realtime Sockets** | Socket.io (Events: `order:new`, `order:status_update`, `load:update`, `menu:stock_toggled`) |
| **Authentication** | JWT (JSON Web Tokens) + Bcrypt with 2 roles (`student` & `canteen`) |
| **Audio Synthesis** | Built-in Web Audio API tone chimes (100% offline, zero audio asset lag) |
| **Deployment** | Vercel (Frontend SPA) + Render (Backend Node/Express) |

---

## 🔑 Pre-Seeded Demo Accounts (For Judges)

The app comes pre-seeded with 16 realistic Indian canteen menu items, 2 demo accounts, and active orders. You can also use the **1-Click Judge Fast-Pass buttons** on the `/login` screen:

| Role | Email | Password | What to Test |
|---|---|---|---|
| **Student** | `student@demo.com` | `password123` | Browse Indian menu, Bell-Sync slot picker, tray checkout, live tracking stepper, Leave Now nudge, QR pickup token, squad group cart. |
| **Canteen Admin** | `canteen@demo.com` | `password123` | Live incoming order board with chime alerts, 1-click status advancement (Fire ➡️ Ready ➡️ Collected), instant In-Stock/Out-of-Stock toggles, kitchen analytics & peak hours chart. |

---

## 📂 Project Structure

```
BreakBite/
├── client/
│   ├── src/
│   │   ├── api/             # Axios instance with JWT interceptors
│   │   ├── components/      # MenuCard, CartDrawer, SlotPicker, StatusStepper, LoadMeter, LeaveNowNudge, Navbar, BottomNav, AudioAlert
│   │   ├── context/         # AuthContext, CartContext
│   │   ├── hooks/           # useSocket, useOrders
│   │   ├── pages/           # Login, Menu, Track, Orders, CanteenDashboard, GroupCart
│   │   ├── App.jsx          # Root view orchestrator & role routing
│   │   ├── main.jsx         # Vite entrypoint
│   │   └── index.css        # Tailwind CSS v4 setup & typography
│   ├── package.json
│   └── vite.config.js       # Vite configuration with proxy & tailwindcss
├── server/
│   ├── controllers/         # authController, menuController, orderController, groupCartController, analyticsController
│   ├── middleware/          # auth.js (JWT protect), role.js (authorize)
│   ├── models/              # User, MenuItem, Order, GroupCart
│   ├── routes/              # auth, menu, orders, groupCart, analytics
│   ├── utils/
│   │   ├── slotEngine.js    # Bell-Sync algorithm, prep calculation, load meter & slot capacity
│   │   └── seed.js          # 16 authentic Indian canteen dishes, demo users, initial orders
│   ├── server.js            # Express app + HTTP server + Socket.io server
│   └── package.json
├── .env.example             # Environment variable template
└── README.md                # Documentation & Architecture
```

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start Backend Server
```bash
cd server
npm install
npm run seed     # (Optional: server automatically auto-seeds if empty!)
npm start
```
*Note: If no local MongoDB is installed, BreakBite automatically boots a high-speed In-Memory MongoDB server for zero-friction hackathon evaluation!*

Backend will be running on **`http://localhost:5000`**.

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
```

Frontend will open at **`http://localhost:5173`**.

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student or canteen staff
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated user profile
- `GET /api/auth/demo-credentials` — Quick demo account credentials

### 🍲 Menu (`/api/menu`)
- `GET /api/menu` — Fetch all menu items (Supports `?category=`, `?search=`, `?vegOnly=true`)
- `GET /api/menu/:id` — Single menu item details
- `POST /api/menu` — Add new dish (*Canteen only*)
- `PATCH /api/menu/:id/toggle-stock` — Toggle In-Stock / Out-of-Stock (*Broadcasts via Sockets*)
- `DELETE /api/menu/:id` — Remove dish (*Canteen only*)

### 📦 Orders & Bell-Sync (`/api/orders`)
- `GET /api/orders/kitchen/load` — Live kitchen load percentage, active prep minutes & status
- `POST /api/orders/slots` — Generate available 5-minute slots with bell preset badges & remaining capacity
- `POST /api/orders` — Place order with Bell-Sync calculations
- `GET /api/orders/my-orders` — Current user's order history
- `GET /api/orders/:id` — Single order tracking details with token & QR data
- `GET /api/orders/canteen/all` — Canteen live order queue (*Sorted by fire time*)
- `PATCH /api/orders/:id/status` — Advance status: `Placed` ➡️ `Preparing` ➡️ `Ready` ➡️ `Collected`

### 👥 Squad Group Cart (`/api/group-cart`)
- `POST /api/group-cart` — Create new group cart with 6-char share code
- `GET /api/group-cart/:code` — View live cart, member dishes, and bill-split breakdown
- `POST /api/group-cart/:code/join` — Join a friend's squad cart
- `POST /api/group-cart/:code/items` — Add dish to squad tray
- `DELETE /api/group-cart/:code/items/:itemId` — Remove dish

### 📊 Kitchen Analytics (`/api/analytics`)
- `GET /api/analytics` — Today's revenue, active orders, completed count, peak hours chart, top dishes

---

## ⚡ Real-Time Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `join:canteen` | Client ➡️ Server | Kitchen operator joins canteen room |
| `join:order` | Client ➡️ Server | Student joins tracking room for a specific order |
| `join:group_cart` | Client ➡️ Server | Friends join collaborative squad room |
| `order:new` | Server ➡️ Canteen | New order arrived; triggers audio chime & board update |
| `order:status_update` | Server ➡️ Student | Real-time status advancement; triggers ready chime & confetti |
| `load:update` | Server ➡️ All | Live Kitchen Load percentage changes dynamically |
| `menu:stock_toggled` | Server ➡️ All | Dish sold-out badge updates across all user screens |
| `group:cart_updated` | Server ➡️ Squad | Real-time updates as friends add or remove dishes |

---

## ☁️ Deployment Guide

### Deploying Backend to Render
1. Push code to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), create a **New Web Service**.
3. Set **Root Directory** to `server`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables:
   - `PORT`: `5000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Random secure string
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://breakbite.vercel.app`)

### Deploying Frontend to Vercel
1. In [Vercel Dashboard](https://vercel.com), import the Git repository.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Add Environment Variables:
   - `VITE_API_URL`: Your Render backend URL + `/api` (e.g. `https://breakbite-api.onrender.com/api`)
   - `VITE_SOCKET_URL`: Your Render backend URL (e.g. `https://breakbite-api.onrender.com`)
5. Deploy!

 