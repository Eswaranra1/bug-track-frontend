<h1 align="center">🐛 BugTrack — Frontend</h1>

<p align="center">
  A modern, full-featured bug tracking web application built with <strong>React 19</strong> + <strong>Vite</strong>.
  <br/>
  Dark / Light theme · JWT authentication · Real-time filtering · Inline editing
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-1.x-5A29E4?logo=axios&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | Register, Login, Reset Password (via email token) |
| 🛡️ **Protected Routes** | Dashboard access requires a valid JWT token |
| 🐛 **Bug Reporting** | Create bugs with title, description, and priority |
| ✏️ **Inline Editing** | Edit title, description, priority & status directly on a card |
| 🗑️ **Delete Bugs** | Remove bugs with a single click |
| 🔍 **Search** | Live text search across bug titles and descriptions |
| 🏷️ **Filter by Priority** | All · High · Medium · Low |
| 📊 **Filter by Status** | All · Open · In Progress · Resolved |
| 📈 **Stats Strip** | Real-time counts for Open / In Progress / Resolved / Total |
| 🌙 **Dark / Light Theme** | Toggle persisted in `localStorage` |
| 🔄 **Auto Logout** | Expired / invalid JWT triggers automatic redirect to login |

---

## 📁 Project Structure

```
bugtrack/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── BugCard.jsx      # Bug display card with inline edit & delete
│   │   ├── BugForm.jsx      # Form to create a new bug report
│   │   └── ProtectedRoute.jsx  # HOC — redirects unauthenticated users
│   ├── pages/
│   │   ├── Login.jsx        # Login page
│   │   ├── Register.jsx     # Registration page
│   │   ├── Dashboard.jsx    # Main dashboard (bugs, filters, stats)
│   │   └── ResetPassword.jsx  # Password reset via token link
│   ├── services/
│   │   └── api.js           # Axios instance + JWT interceptors
│   ├── utils/
│   │   ├── auth.js          # Token helpers (save / get / logout / isAuthenticated)
│   │   └── theme.jsx        # ThemeContext + ThemeProvider (dark/light)
│   ├── App.jsx              # Root component — router & routes
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles & design tokens
├── index.html
├── vite.config.js
└── package.json
```

---

## 🗺️ Routes

| Path | Component | Auth Required |
|---|---|---|
| `/` | `Login` | No |
| `/register` | `Register` | No |
| `/reset-password/:token` | `ResetPassword` | No |
| `/dashboard` | `Dashboard` | ✅ Yes |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x — [Download](https://nodejs.org)
- **npm** ≥ 9.x (comes with Node)
- A running **BugTrack Backend** API on `http://localhost:5000` — see backend repo for setup

### 1 · Clone the repository

```bash
git clone https://github.com/<your-username>/bug-track-frontend.git
cd bug-track-frontend/bugtrack
```

### 2 · Install dependencies

```bash
npm install
```

### 3 · Configure the API base URL

The frontend talks to the backend at `http://localhost:5000/api` by default (configured in `src/services/api.js`).

If your backend runs on a different host or port, open `src/services/api.js` and update `baseURL`:

```js
// src/services/api.js
const API = axios.create({
  baseURL: "http://localhost:5000/api",   // ← change if needed
});
```

### 4 · Start the development server

```bash
npm run dev
```

Open your browser at **http://localhost:5173** 🎉

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with Hot Module Replacement |
| `npm run build` | Build optimised production bundle into `dist/` |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Run ESLint over the entire codebase |

---

## 🔌 Backend API Expectations

This frontend communicates with a REST API. The expected routes are:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Login and receive a JWT token |
| `POST` | `/api/auth/forgot-password` | Request a password reset email |
| `POST` | `/api/auth/reset-password/:token` | Reset password using the token |
| `GET` | `/api/bugs` | Fetch all bugs for the logged-in user |
| `POST` | `/api/bugs` | Create a new bug |
| `PUT` | `/api/bugs/:id` | Update an existing bug |
| `DELETE` | `/api/bugs/:id` | Delete a bug |

> **JWT** — The token is stored in `localStorage` and sent as the `Authorization` header on every request. A `401` response automatically logs the user out.

---

## 🎨 Theme System

BugTrack supports **dark** (default) and **light** themes, toggled from the navbar. The chosen theme is persisted in `localStorage` across sessions.

The `ThemeProvider` in `src/utils/theme.jsx` sets a `data-theme` attribute on `<html>`, which drives CSS custom properties defined in `index.css`.

```jsx
import { useTheme } from "./utils/theme";

const { theme, toggleTheme } = useTheme();
```

---

## 🧩 Key Components

### `BugCard`
Displays a single bug. Provides **inline editing** (title, description, priority, status) and **delete** functionality. Edit mode is toggled with the *Edit* button and committed with *Save*.

### `BugForm`
Collapsible form panel for **reporting new bugs**. Fields: Title (required), Description (optional), Priority (Low / Medium / High).

### `ProtectedRoute`
Wraps the `/dashboard` route. If `isAuthenticated()` returns `false`, the user is immediately redirected to `/` (Login).

### `api.js`
Centralised Axios instance with two interceptors:
- **Request** — attaches the JWT token from `localStorage`.
- **Response** — catches `401` errors, calls `logout()`, and redirects to `/`.

---

## 🏗️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Vite | 8.x | Dev server & bundler |
| ESLint | 9.x | Code linting |
| Vanilla CSS | — | All styling (no UI library) |

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Commit your changes: `git commit -m "feat: add my feature"`
3. Push to the branch: `git push origin feat/my-feature`
4. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
