# Imdad ul Madaris

Full-stack donation platform for madrasas.

| Part | Folder | Deploy |
|------|--------|--------|
| **Frontend** | `public/` | Firebase Hosting (`firebase deploy --only hosting`) |
| **Backend** | `backend/` | Render / VPS (`npm start` in `backend/`) |

Live API (production): `https://imdad-backend-1.onrender.com`

---

## Project structure

```
imdad-ul-madaris/
├── public/          # Static HTML/CSS/JS (Firebase Hosting)
├── backend/         # Express + MongoDB API (separate repo, git submodule)
├── firebase.json
└── config.js        # in public/ — API base URL for frontend
```

---

## Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB, JWT, Cloudinary keys

npm install
npm start
```

Server runs on **http://localhost:5000**

Frontend (`public/config.js`) uses `http://localhost:5000` automatically when opened on `localhost`.

---

## Frontend (local)

Serve `public/` with any static server, or use Firebase emulator:

```bash
firebase serve --only hosting
```

---

## Clone with backend (submodule)

```bash
git clone --recurse-submodules https://github.com/mdsalman-st/imdad-ul-madaris.git
cd imdad-ul-madaris
npm run install:all
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

---

## Deploy

1. **Backend** → Push `backend/` to [imdad-backend](https://github.com/mdsalman-st/imdad-backend) and deploy on Render with env vars from `.env.example`.
2. **Frontend** → From repo root: `npm run deploy:hosting`

---

## Note on `backend/` folder

`backend` is a **git submodule** pointing to `mdsalman-st/imdad-backend`. It was removed from this repo in an earlier commit; it is restored so frontend + API live in one workspace again.
