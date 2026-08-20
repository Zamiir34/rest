# Restaurant QR Ordering & POS Management System

A production-ready **MERN Stack** application for restaurant QR table ordering, kitchen display, POS payments, and full back-office management.

## Features

- **QR Table Ordering** — Customers scan QR, browse menu, order without login
- **Live Order Tracking** — Real-time status updates via Socket.IO
- **Kitchen Display System (KDS)** — Chef dashboard with status workflow
- **POS System** — Cashier payments, discounts, multiple payment methods
- **Admin Dashboard** — Analytics, charts, sales metrics
- **RBAC** — Super Admin, Restaurant Admin, Manager, Cashier, Chef, Waiter
- **Food & Category Management** — CRUD with Cloudinary image uploads
- **Table Management** — Auto-generated downloadable QR codes
- **Reservations, Inventory, Employees, Customers, Reports**
- **Dark/Light Mode** — Modern responsive UI

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Redux Toolkit, Socket.IO Client, Chart.js, Framer Motion |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO, Cloudinary |
| Database | MongoDB Atlas |
| Deployment | Vercel (frontend), Render (backend), Cloudinary (images) |

## Project Structure

```
├── backend/
│   ├── config/          # DB, Cloudinary, Swagger
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation, upload
│   ├── models/          # Mongoose schemas
│   ├── routes/          # REST API routes
│   ├── services/        # Business logic
│   ├── socket/          # Socket.IO handlers
│   └── utils/           # Helpers, seed data
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI
│       ├── pages/       # Route pages
│       ├── layouts/     # App layouts
│       ├── redux/       # State management
│       └── services/    # API & Socket clients
└── docs/                # ER diagram, API docs, Postman
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (optional, for image uploads)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run seed    # Seed demo data
npm run dev     # Start on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # Start on http://localhost:5173
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |
| Chef | chef@restaurant.com | chef123 |
| Cashier | cashier@restaurant.com | cashier123 |
| Waiter | waiter@restaurant.com | waiter123 |

## QR Ordering Flow

1. Admin creates tables → QR codes auto-generated
2. Customer scans QR → `https://yoursite.com/menu/table/T01`
3. Browse menu, add to cart, enter name
4. Place order → Live tracking page opens
5. Kitchen receives order instantly via Socket.IO

## API Documentation

- **Swagger UI**: `http://localhost:5000/api/docs`
- **OpenAPI JSON**: `http://localhost:5000/api/docs.json`
- **Postman Collection**: `docs/postman_collection.json`

## Deployment

### Backend (Render)

1. Connect GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables from `.env.example`

### Frontend (Vercel)

1. Import repo, set root to `frontend`
2. Add `VITE_API_URL` and `VITE_SOCKET_URL` env vars
3. Deploy

### MongoDB Atlas

1. Create cluster → Get connection string
2. Add to `MONGODB_URI` in backend env

## Security

- JWT + Refresh Token authentication
- bcrypt password hashing
- Helmet, CORS, rate limiting
- Role-based access control (RBAC)
- Input validation with express-validator

## License

ISC
