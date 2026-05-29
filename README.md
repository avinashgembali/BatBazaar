# BatBazaar 🏏

A full-stack e-commerce platform for buying premium cricket bats. Customers can browse, filter, and purchase bats online. Admins can manage inventory, view orders, and track sales — all from a dedicated admin dashboard.

**Live Demo:** [https://batbazaar-1.onrender.com/](https://batbazaar-1.onrender.com/)

---

## What This Project Does

| Feature | Details |
|---|---|
| **Product Catalog** | Browse cricket bats with brand, type, rating, and price |
| **Filtering & Search** | Filter by brand, price range, and minimum rating; sort low→high / high→low |
| **Pagination** | 10 bats per page with smart page number controls |
| **AI Chatbot** | Ask the Gemini-powered assistant to recommend bats or apply filters |
| **Cart** | Add to cart, adjust quantity via stepper, remove items — all synced to the database |
| **Inventory Management** | Real-time stock tracking; sold-out badge when stock hits 0 |
| **Payments** | Razorpay payment gateway integration (test mode) |
| **Orders** | Order history with a visual status stepper (Placed → Processing → Delivered) |
| **Authentication** | JWT-based login/register; role-based access (customer vs admin) |
| **Admin Dashboard** | Add/delete bats, update stock, view all orders, mark as delivered |

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Zustand (global state — cart, auth)
- React Router v6
- React Toastify (notifications)
- React Icons

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Razorpay SDK
- Cloudinary (image uploads)
- Multer (multipart form handling)
- bcrypt (password hashing)

---

## Project Structure

```
BatBazaar/
├── backend/
│   ├── models/          # Mongoose schemas (Bat, Cart, Order, User, SoldBat)
│   ├── routes/          # Express route handlers
│   ├── middleware/       # auth.js, adminOnly.js
│   ├── scripts/         # seedStock.js — assign initial stock to bats
│   ├── index.js         # Express app entry point
│   └── .env             # Environment variables (not committed)
└── store/               # React frontend
    ├── src/
    │   ├── components/  # Page + UI components
    │   ├── styles/      # Per-component CSS files
    │   ├── api.js       # authFetch wrapper
    │   └── useAuthStore.js  # Zustand store
    └── .env             # Frontend environment variables (not committed)
```

---

## Prerequisites

Make sure you have these installed before setting up:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) — local install **or** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- A [Razorpay](https://razorpay.com/) account (free test mode)
- A [Cloudinary](https://cloudinary.com/) account (free tier)
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini (chatbot)

---

## Setup — Step by Step

### 1. Clone the repository

```bash
git clone https://github.com/your-username/BatBazaar.git
cd BatBazaar
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```env
# MongoDB connection string (Atlas or local)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/batbazaar

# JWT secret — any long random string
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay credentials (get from Razorpay Dashboard → API Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary credentials (get from Cloudinary Dashboard)
CLOUD_NAME=your_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

Start the backend server:

```bash
node index.js
# Server runs at http://localhost:8000
```

### 3. Set up the Frontend

Open a new terminal:

```bash
cd store
npm install
```

Create a `.env` file inside the `store/` folder:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000/api

# Razorpay public key (same Key ID as backend, NOT the secret)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Gemini API key for the AI chatbot
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Start the frontend dev server:

```bash
npm run dev
# App runs at http://localhost:5173
```

### 4. Create an Admin account

Register normally through the UI, then manually update the user's role in MongoDB:

```js
// In MongoDB shell or Atlas UI
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

Admins see a dashboard instead of the shop. They can add/delete bats, manage stock, view all orders, and mark orders as delivered.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret |
| `CLOUD_NAME` | Cloudinary cloud name |
| `API_KEY` | Cloudinary API key |
| `API_SECRET` | Cloudinary API secret |

### Frontend (`store/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full URL to backend API (e.g. `http://localhost:8000/api`) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public Key ID (shown on checkout popup) |
| `VITE_GEMINI_API_KEY` | Google Gemini API key for the AI chatbot |

---

## Testing Payments (Razorpay Test Mode)

Use these Razorpay test card details to simulate a payment:

| Field | Value |
|---|---|
| Card Number | `4111 1111 1111 1111` |
| Expiry | Any future date |
| CVV | Any 3 digits |
| OTP | `1234` |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login, returns JWT token |
| GET | `/api/bats/stats` | Get brand list + price range for filters |
| GET | `/api/bats/bat` | Get filtered/sorted/paginated bats |
| GET | `/api/cart/:email` | Get cart items (auth required) |
| POST | `/api/cart/:email` | Add item to cart (validates stock) |
| PATCH | `/api/cart/:email/:productId` | Update item quantity |
| DELETE | `/api/cart/:email/:productId` | Remove item from cart |
| POST | `/api/orders/create-razorpay-order` | Create Razorpay order |
| POST | `/api/orders/place` | Verify payment + deduct stock + save order |
| GET | `/api/orders/user/:email` | Get orders for a user |
| POST | `/api/admin/bat` | Add a new bat (admin only) |
| DELETE | `/api/admin/bat/:id` | Delete a bat (admin only) |
| PATCH | `/api/admin/bat/:id/stock` | Update stock quantity (admin only) |
| GET | `/api/admin/orders` | View all orders (admin only) |
| PUT | `/api/admin/orders/:id/deliver` | Mark order as delivered (admin only) |
