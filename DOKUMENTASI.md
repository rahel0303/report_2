# AutoMetric — Dokumentasi Fitur

## Daftar Isi
1. [Autentikasi](#1-autentikasi)
2. [Admin Panel](#2-admin-panel)
3. [Halaman Home (User)](#3-halaman-home-user)
4. [Report Generator](#4-report-generator)
5. [Cover Designer](#5-cover-designer)
6. [Smart Insights (AI)](#6-smart-insights-ai)
7. [Export PPTX](#7-export-pptx)
8. [Export History](#8-export-history)
9. [Penyimpanan File](#9-penyimpanan-file)
10. [API Endpoints](#10-api-endpoints)
11. [Database](#11-database)
12. [Proteksi Rute](#12-proteksi-rute)

---

## 1. Autentikasi

### Login
- Form login dengan username dan password
- Setelah login: admin diarahkan ke `/admin`, user biasa ke `/home`
- Mencegah kembali ke halaman login via tombol Back browser

### Register
- Tersedia di halaman login (toggle antara Login / Register)
- Form: nama lengkap, username, password, konfirmasi password
- Akun baru otomatis berstatus **belum terverifikasi** — tidak bisa membuat report sampai admin memverifikasi
- Banner peringatan ditampilkan di halaman home jika belum terverifikasi

### Logout
- Tombol logout tersedia di header (halaman report) dan sidebar (admin panel)
- Menghapus token JWT dari cookie lalu redirect ke `/login`

### Sesi
- Menggunakan JWT disimpan di HTTP-only cookie
- Token berlaku 7 hari
- Endpoint `/api/auth/me` untuk validasi sesi aktif

---

## 2. Admin Panel

Hanya bisa diakses oleh user dengan role `admin`. Terdiri dari 4 tab:

### Tab Companies
- Tabel daftar semua perusahaan (klien)
- **Tambah** perusahaan baru — slug di-generate otomatis dari nama
- **Edit** nama perusahaan
- **Hapus** perusahaan (konfirmasi via SweetAlert2)

### Tab Users
- Tabel semua user: nama, username, role, perusahaan, status verifikasi
- **Tambah** user baru: isi nama, username, password, role (admin/user), pilih perusahaan
- **Edit** user: ubah nama, username, role, perusahaan, password
- **Verifikasi** user: tombol ✓ untuk verifikasi, ✗ untuk unverifikasi
  - Tombol verifikasi hanya aktif jika user sudah memiliki perusahaan
- **Hapus** user (tidak bisa menghapus diri sendiri)
- Badge status: **Verified** (hijau) / **Pending** (kuning)

### Tab Active Brands
- Filter tampilan berdasarkan perusahaan dan bulan (MM-YYYY)
- Tabel daftar brand yang aktif per perusahaan per bulan
- **Tombol "Manage Active Brands"** membuka modal dengan:
  - Dropdown pilih perusahaan
  - Dropdown pilih bulan (12 bulan terakhir)
  - Daftar semua brand dengan checkbox + kolom pencarian
  - Tombol **"Sama seperti bulan sebelumnya"** — otomatis centang brand yang sama dengan bulan sebelumnya
  - Simpan: hapus semua data bulan tersebut lalu insert ulang yang dipilih (bulk sync)

### Tab Export History
- Tabel semua export dari seluruh user: nama file, user, brand, periode, jumlah slide, tanggal
- Kolom pencarian nama file
- **Hapus** export per baris (konfirmasi via SweetAlert2)

---

## 3. Halaman Home (User)

### Daftar Brand Aktif
- Menampilkan brand yang aktif berdasarkan perusahaan user yang login dan bulan yang dipilih
- Dropdown bulan untuk filter (default: bulan lalu)
- Setiap brand menampilkan username media sosial (Instagram, TikTok, Facebook, Twitter)
- Tinggi daftar diperbesar (`max-h-96`) agar lebih banyak brand terlihat

### Riwayat Export
- Daftar file PPTX yang pernah di-export oleh user yang sedang login
- Tampilan thumbnail cover (warna gradient sesuai tema waktu export)
- Info: nama file, brand, periode, jumlah slide, tanggal export
- Tombol **Download** — unduh file PPTX dari Google Cloud Storage
- Tombol **Hapus** — hapus record dan file dari GCS

### Navigasi
- Tombol **Create New Report** — hanya muncul jika user sudah terverifikasi
- Banner kuning jika user belum terverifikasi

---

## 4. Report Generator

Halaman utama pembuatan laporan. Hanya bisa diakses user terverifikasi.

### Setup Awal
- Pilih brand dari daftar brand aktif (filter per bulan)
- Pilih periode laporan (3 bulan terakhir — tidak termasuk bulan berjalan)
- Pilih tema warna dan font

### Manajemen Slide
- Hapus slide
- Preview slide secara langsung

### Tipe Slide yang Tersedia
- Cover laporan
- Section heading (pemisah bab)
- Instagram: growth, best/least post, content pillar, engagement, reach, sentiment, tagged posts
- TikTok: growth, best/least, content pillar, thumbnail showcase
- Twitter/X: growth, best/least, content
- Facebook: growth, best/least
- All-channel overview
- Competitor overview dan perbandingan detail

---

## 5. Cover Designer

Komponen untuk mendesain halaman cover laporan.

### Template Cover
9 template dalam 3 kategori:
- **Modern**: Neon Pulse, Bold Split, Glass Morphism
- **Geometric**: Prism, Bauhaus Grid, Hexagon Mesh
- **Minimalist**: Clean Line, Asymmetric, Nordic Frame

### Kustomisasi
- Upload logo klien — warna dominan logo diekstrak otomatis sebagai warna primer
- Pilih warna primer, sekunder, dan aksen secara manual via color picker
- Toggle mode konten: terang / gelap
- Edit judul cover, subjudul, dan periode
- Preview langsung di area desain

---

## 6. Smart Insights (AI) (On Progress)

## 7. Export PPTX

### Proses Export
- Export seluruh slide atau sebagian (partial export)
- Modal progress export menampilkan status real-time tiap slide
- Nama file otomatis: `[BrandName]_[Periode]_[mode].pptx`

### Fitur Teknis Export
- Generate menggunakan PptxGenJS
- Font Sora di-embed ke dalam file PPTX (obfuscation sesuai standar OOXML ECMA-376)
- Warna tema diterapkan ke semua elemen slide
- Background gradient RGB blend sesuai tema
- Upload cover image ke Cloudinary sebelum di-embed ke PPTX
- Konversi gambar remote ke base64 untuk embedding
- File PPTX diunggah ke Google Cloud Storage setelah selesai
- Metadata export disimpan ke database

---

## 8. Export History

### User
- Tersedia di halaman home
- Hanya menampilkan export milik user yang login
- Download dan hapus file

### Admin
- Tersedia di admin panel tab "Export History"
- Menampilkan seluruh export dari semua user
- Bisa hapus export siapapun

### Metadata yang Disimpan
- Nama file, brand, periode
- Jumlah slide
- Flag partial/full export
- Konfigurasi cover design (warna, tema)
- URL gambar cover (Cloudinary)
- Path file di GCS
- Timestamp export

---

## 9. Penyimpanan File

### Google Cloud Storage (GCS)
- Penyimpanan utama file PPTX hasil export
- Upload, download, dan delete via service account
- Bucket: `autoreport-exports`

### Cloudinary
- Penyimpanan gambar cover yang di-upload saat proses export
- Upload via base64, menghasilkan URL publik
- URL tersebut di-embed ke dalam slide cover di PPTX

### Google Drive *(tersedia tapi bukan alur utama)*
- Alternatif upload PPTX ke folder Google Drive
- Link sharable "anyone with link"

### localStorage (Browser)
- Menyimpan slide dan konfigurasi report yang sedang dikerjakan
- Menyimpan daftar template yang dibuat user
- Data tidak hilang saat refresh

---

## 10. API Endpoints

### Auth
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/api/auth/login` | Login, set cookie JWT |
| POST | `/api/auth/logout` | Hapus cookie JWT |
| GET | `/api/auth/me` | Cek sesi aktif |
| POST | `/api/auth/register` | Daftar akun baru |

### Brands (User)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/brands` | List brand aktif sesuai company & bulan user |

### Admin — Companies
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/admin/companies` | List semua perusahaan |
| POST | `/api/admin/companies` | Tambah perusahaan |
| PUT | `/api/admin/companies/[id]` | Edit perusahaan |
| DELETE | `/api/admin/companies/[id]` | Hapus perusahaan |

### Admin — Users
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/admin/users` | List semua user |
| POST | `/api/admin/users` | Tambah user |
| PUT | `/api/admin/users/[id]` | Edit user (termasuk verifikasi) |
| DELETE | `/api/admin/users/[id]` | Hapus user |

### Admin — Active Brands
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/admin/active-brands` | List active brands (filter company+bulan) |
| POST | `/api/admin/active-brands/sync` | Bulk sync brand aktif per company+bulan |
| GET | `/api/admin/brands` | List semua brand dari data warehouse |

### Export History
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/export-history` | List export milik user login |
| POST | `/api/export-history` | Simpan record export baru |
| DELETE | `/api/export-history/[id]` | Hapus export (user: milik sendiri) |
| GET | `/api/export-history/[id]/download` | Download file PPTX dari GCS |
| GET | `/api/admin/export-history` | List semua export (admin) |
| DELETE | `/api/admin/export-history/[id]` | Hapus export siapapun (admin) |

### Upload
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/api/upload/cover-image` | Upload gambar cover ke Cloudinary |

---

## 11. Database

### Tabel

**`public.companies`**
- `id`, `name`, `slug`, `created_at`, `updated_at`
- Menyimpan data klien/perusahaan

**`public.users`**
- `id`, `name`, `username`, `password` (bcrypt), `role` (admin/user)
- `company_id` → FK ke `public.companies`
- `is_verified` (boolean) — false saat register, admin yang ubah ke true
- `created_at`

**`public.export_history`**
- `id`, `user_id`, `export_name`, `brand_name`, `period`
- `slide_count`, `is_partial`, `cover_config` (JSON)
- `cover_image_url`, `gcs_path`, `created_at`

**`l1_socmed.dim_brands`**
- Data brand dari data warehouse analytics
- `id`, `brand_name`, `ig_username`, `tt_username`, `fb_username`, `tw_username`, `is_competitor`

**`l1_socmed.dim_brand_active_months`**
- `id`, `company_id`, `brand_id`, `month_year` (MM-YYYY)
- Unique constraint: `(company_id, brand_id, month_year)`
- Menentukan brand mana yang bisa dilihat oleh user dari perusahaan tertentu di bulan tertentu

---

## 12. Proteksi Rute

Dikelola di `proxy.ts` (Next.js middleware):

| Kondisi | Aksi |
|---------|------|
| Belum login | Redirect ke `/login` |
| Sudah login, buka `/login` | Redirect ke `/admin` (admin) atau `/home` (user) |
| Admin buka `/home` atau `/` | Redirect ke `/admin` |
| User belum verifikasi, buka `/` | Redirect ke `/home` (tidak bisa buat report) |
| Non-admin akses `/admin/*` atau `/api/admin/*` | Response 403 Forbidden |

Path yang tidak diproteksi: `/login`, `/api/auth/*`, `/_next/*`, file statis
