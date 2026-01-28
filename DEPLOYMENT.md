# 🚀 Deployment Guide

## Deploy ke Vercel

### 1️⃣ Persiapan

Pastikan `.env.local` **TIDAK** di-commit ke Git (sudah di-protect oleh `.gitignore`)

### 2️⃣ Deploy

**Option A: Via Vercel Dashboard**

```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel
```

**Option B: Via Git (Recommended)**

1. Push code ke GitHub/GitLab/Bitbucket
2. Import project di [vercel.com](https://vercel.com/new)
3. Pilih repository Anda

### 3️⃣ Set Environment Variables di Vercel

**PENTING! Set di Vercel Dashboard:**

1. Buka project di Vercel Dashboard
2. Settings → Environment Variables
3. Tambahkan:

| Variable Name                | Value                                     |
| ---------------------------- | ----------------------------------------- |
| `GEMINI_API_KEY`             | `AIzaSyBo1HRwT6xSPydfqTzlRbpmFnM2baGlf_o` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | `AIzaSyBo1HRwT6xSPydfqTzlRbpmFnM2baGlf_o` |

**Environment:** Pilih `Production`, `Preview`, dan `Development`

4. Klik **Save**
5. Redeploy project (Deployments → ... → Redeploy)

### 4️⃣ Verifikasi

Setelah deploy selesai:

- Buka URL project Anda
- Test AI Cover Designer
- Cek Console untuk memastikan tidak ada error API key

---

## 🔐 Security Notes

✅ API Key **TIDAK** di-commit ke Git (protected by `.gitignore`)  
✅ API Key **hanya** di environment variables Vercel  
✅ `NEXT_PUBLIC_*` prefix untuk client-side access  
✅ Regular `GEMINI_API_KEY` untuk server-side API routes

---

## 📝 Environment Variables Yang Dibutuhkan

```bash
# .env.local (local development)
GEMINI_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

**Vercel Dashboard:**

- Same keys as above
- Set for all environments (Production, Preview, Development)

---

## 🛠️ Troubleshooting

**Problem:** AI Cover Designer tidak bekerja di production

**Solution:**

1. Cek Vercel Dashboard → Settings → Environment Variables
2. Pastikan `GEMINI_API_KEY` dan `NEXT_PUBLIC_GEMINI_API_KEY` sudah di-set
3. Redeploy project
4. Cek browser console untuk error messages

**Problem:** Build gagal

**Solution:**

```bash
# Test build locally dulu
npm run build

# Jika berhasil, push ke Git dan Vercel akan auto-deploy
```

---

## 📦 Build Command

Vercel akan otomatis detect Next.js dan run:

```bash
npm run build
```

Output directory: `.next`

---

## 🌐 Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add domain Anda
3. Update DNS records sesuai instruksi Vercel
4. Wait for DNS propagation (5-10 menit)

---

## 🔄 Auto-Deployment

Setelah setup:

- Push ke `main` branch → auto deploy to Production
- Push ke branch lain → auto deploy to Preview URL
- Pull request → auto deploy to Preview URL
