# PRD Struktur Folder Frontend ERP

**Project:** Corventra  
**Stack:** React + Vite + TypeScript + React Router + Tailwind CSS  
**Dokumen:** Panduan struktur folder frontend  
**Tujuan dokumen:** Menjadi acuan agar implementasi kode konsisten, rapi, scalable, dan sesuai kebutuhan sistem ERP.

---

# 1. Latar Belakang

Project ini adalah frontend untuk sistem ERP berbasis web yang memiliki beberapa role utama:
- MEO
- Business Development (BD)
- CEO
- Staff Admin

Fitur utama yang sudah direncanakan antara lain:
- Login
- Dashboard
- Campaigns
- Form Builder
- Bank Data
- Lead Tracker
- Lead Workspace
  - Info
  - Meeting
  - Notulensi
  - Proposal
  - Engagement Letter
  - Handover

Frontend akan dibangun terlebih dahulu dengan data dummy. Karena itu, struktur folder harus:
1. mudah dipahami,
2. mudah dikembangkan bertahap,
3. tidak cepat berantakan saat fitur bertambah,
4. cocok untuk AI-assisted development,
5. memisahkan logika global aplikasi dan logika spesifik fitur.

---

# 2. Tujuan Struktur Folder

Struktur folder ini dibuat untuk mencapai tujuan berikut:

## 2.1 Modular dan scalable
Setiap fitur utama ditempatkan dalam foldernya sendiri agar saat project bertambah besar, file tidak menumpuk di satu tempat.

## 2.2 Mudah dibaca
Developer dan AI coding agent harus bisa langsung mengerti letak:
- halaman,
- layout,
- komponen,
- hooks,
- types,
- service,
- mock data,
tanpa harus mencari terlalu jauh.

## 2.3 Sesuai proses bisnis
Folder disusun berdasarkan **fitur bisnis**, bukan berdasarkan role dan bukan berdasarkan jenis file secara global.

Contoh:
- `campaigns`
- `forms`
- `bank-data`
- `lead-tracker`
- `lead-workspace`

Bukan:
- `meo/`
- `bd/`
- `pages/` besar berisi semua file campur
- `components/` besar berisi semua hal tanpa domain

## 2.4 Menghindari duplikasi
Beberapa halaman dan proses digunakan lintas role. Karena itu folder tidak dipisahkan berdasarkan role.

Contoh:
- `dashboard` dipakai banyak role
- `bank-data` dipakai lebih dari satu role
- `lead-workspace` tetap satu fitur, tetapi tampilannya bisa berbeda tergantung role dan status data

## 2.5 Mendukung layout aplikasi modern
Project ini membutuhkan:
- halaman login,
- halaman setelah login,
- sidebar kiri yang bisa collapse,
- header atas,
- nested routes,
- tabs berbasis URL,
- detail page,
- route protection.

Karena itu dibutuhkan pemisahan yang jelas antara:
- router,
- layouts,
- guards,
- navigation,
- global state,
- feature modules.

---

# 3. Prinsip Arsitektur

Struktur ini memakai pendekatan berikut:

## 3.1 Feature-based structure
Folder utama frontend dibagi berdasarkan fitur bisnis.

Artinya:
- setiap fitur punya folder sendiri,
- setiap fitur boleh punya `pages`, `components`, `hooks`, `types`, `services`, `mocks`.

## 3.2 Shared layer + feature layer
Hal global disimpan terpisah di:
- `app/`
- `components/`
- `services/`
- `types/`
- `utils/`
- `hooks/`
- `config/`

Sedangkan hal yang spesifik fitur disimpan di:
- `features/`

## 3.3 Role-based access, not role-based folders
Hak akses role diatur di:
- `guards`
- `permissions`
- conditional rendering
- route filtering
- navigation filtering

Bukan dengan membuat folder:
- `features/meo/`
- `features/bd/`
- `features/ceo/`

## 3.4 One feature, many behaviors
Satu fitur bisa punya perilaku berbeda tergantung role.

Contoh:
- `bank-data` tetap satu fitur
- MEO hanya bisa melihat
- BD bisa melihat dan melakukan tindakan tertentu

## 3.5 Layout sebagai kerangka global
Semua halaman setelah login harus memakai layout yang sama agar konsisten:
- sidebar kiri
- header atas
- content area utama

---

# 4. Struktur Folder Utama

> Catatan: komentar `# ...` pada struktur di bawah ini adalah penjelasan fungsi folder/file, bukan nama folder sebenarnya.

```txt
src/
├── app/ # Lapisan global aplikasi: router, layout utama, guard, provider, permission, navigation, dan global store
│   ├── router/ # Menyimpan konfigurasi routing React Router, route tree, dan pemisahan public/protected routes
│   │   ├── index.tsx # Entry utama router aplikasi
│   │   ├── public-routes.tsx # Daftar route yang bisa diakses tanpa login, misalnya login
│   │   └── protected-routes.tsx # Daftar route yang hanya bisa diakses setelah login
│   │
│   ├── layouts/ # Layout besar halaman, bukan komponen kecil
│   │   ├── auth-layout.tsx # Layout untuk halaman login atau halaman auth
│   │   ├── app-shell-layout.tsx # Layout utama setelah login: sidebar + header + content
│   │   └── blank-layout.tsx # Layout polos untuk halaman khusus seperti 404, unauthorized, dll
│   │
│   ├── guards/ # Proteksi route berdasarkan status login atau permission
│   │   ├── auth-guard.tsx # Mencegah user yang belum login mengakses halaman protected
│   │   ├── guest-guard.tsx # Mencegah user yang sudah login mengakses halaman guest seperti login
│   │   └── permission-guard.tsx # Membatasi akses halaman/fitur berdasarkan role atau permission
│   │
│   ├── providers/ # Pembungkus global aplikasi
│   │   ├── app-provider.tsx # Root provider aplikasi, tempat gabung semua provider
│   │   ├── theme-provider.tsx # Provider tema jika nanti ada dark/light mode
│   │   └── query-provider.tsx # Provider untuk server state jika nanti memakai TanStack Query
│   │
│   ├── permissions/ # Definisi role, permission, dan pemetaan akses
│   │   ├── roles.ts # Konstanta role, misalnya MEO, BD, CEO, STAFF_ADMIN
│   │   ├── permissions.ts # Konstanta permission yang dipakai di aplikasi
│   │   └── permission-map.ts # Mapping role ke permission
│   │
│   ├── navigation/ # Konfigurasi menu sidebar dan menu header, bukan komponen UI-nya
│   │   ├── sidebar-nav.ts # Data item sidebar: label, path, icon, permission
│   │   └── header-menu.ts # Data item dropdown/header menu: profile, settings, logout
│   │
│   └── store/ # Global state aplikasi yang dipakai lintas halaman
│       ├── auth-store.ts # Menyimpan user login, token, role, division, auth state
│       └── layout-store.ts # Menyimpan state sidebar collapse, sidebar mobile open, dsb
│
├── components/ # Komponen reusable lintas fitur
│   ├── ui/ # Komponen UI generik dan murni presentational
│   │   ├── button.tsx # Komponen tombol reusable
│   │   ├── input.tsx # Komponen input reusable
│   │   ├── textarea.tsx # Komponen textarea reusable
│   │   ├── dialog.tsx # Komponen modal/dialog reusable
│   │   ├── dropdown-menu.tsx # Komponen dropdown menu reusable
│   │   ├── badge.tsx # Komponen badge reusable
│   │   ├── table.tsx # Komponen table reusable
│   │   └── index.ts # Barrel export komponen ui
│   │
│   └── shared/ # Komponen reusable level aplikasi, sudah tahu konteks ERP atau layout, tapi tidak spesifik 1 fitur
│       ├── layout/ # Komponen penyusun layout utama setelah login
│       │   ├── sidebar/
│       │   │   ├── sidebar.tsx # Sidebar utama
│       │   │   ├── sidebar-item.tsx # Item menu sidebar
│       │   │   ├── sidebar-group.tsx # Group menu sidebar bila dibutuhkan
│       │   │   └── sidebar-toggle.tsx # Tombol collapse/expand sidebar
│       │   │
│       │   ├── header/
│       │   │   ├── header.tsx # Header utama di atas content
│       │   │   ├── header-search.tsx # Search bar di header
│       │   │   ├── user-menu.tsx # Dropdown menu profil user
│       │   │   └── user-profile-summary.tsx # Ringkasan user: avatar, nama, divisi, role
│       │   │
│       │   ├── app-shell/
│       │   │   ├── app-shell.tsx # Komponen pembungkus sidebar + header + page content
│       │   │   ├── main-content.tsx # Area konten utama di samping sidebar
│       │   │   └── page-container.tsx # Wrapper padding dan max width untuk isi halaman
│       │   │
│       │   └── index.ts # Barrel export untuk komponen layout shared
│       │
│       ├── feedback/ # Komponen state umum
│       │   ├── loading-state.tsx # Tampilan loading reusable
│       │   ├── empty-state.tsx # Tampilan data kosong reusable
│       │   └── error-state.tsx # Tampilan error reusable
│       │
│       └── data-display/ # Komponen kecil untuk menampilkan data secara konsisten
│           ├── status-badge.tsx # Badge status umum, misalnya active, pending, overdue
│           └── info-row.tsx # Baris label-value untuk detail data
│
├── features/ # Seluruh modul bisnis utama aplikasi
│   ├── auth/ # Fitur autentikasi
│   │   ├── pages/ # Halaman fitur auth
│   │   │   └── login-page.tsx # Halaman login
│   │   ├── components/ # Komponen spesifik auth
│   │   │   └── login-form.tsx # Form login
│   │   ├── hooks/ # Hook spesifik auth
│   │   │   └── use-auth.ts # Hook helper auth
│   │   ├── services/ # Service API atau service data auth
│   │   │   └── auth-service.ts # Login, logout, get current user, dsb
│   │   ├── types/ # Tipe data auth
│   │   │   └── auth.types.ts # Type login payload, auth response, current user
│   │   └── mocks/ # Dummy data auth saat backend belum siap
│   │       └── auth.mock.ts # Dummy user dan simulasi login
│   │
│   ├── dashboard/ # Fitur dashboard
│   │   ├── pages/ # Halaman dashboard
│   │   │   └── dashboard-page.tsx # Halaman utama dashboard
│   │   ├── components/ # Widget dan section dashboard
│   │   ├── services/ # Service data dashboard
│   │   ├── types/ # Tipe data dashboard
│   │   └── mocks/ # Dummy statistik/dashboard cards
│   │
│   ├── campaigns/ # Fitur campaign management
│   │   ├── pages/ # Halaman list/detail campaign
│   │   ├── components/ # Tabel, form, card, filter campaign
│   │   ├── hooks/ # Hook campaign
│   │   ├── services/ # Service campaign
│   │   ├── types/ # Type campaign
│   │   └── mocks/ # Dummy data campaign
│   │
│   ├── forms/ # Fitur form builder / form management
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── mocks/
│   │
│   ├── bank-data/ # Fitur bank data lead/prospect
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── mocks/
│   │
│   ├── lead-tracker/ # Fitur pelacakan lead dan pipeline
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── mocks/
│   │
│   └── lead-workspace/ # Fitur workspace detail per lead
│       ├── pages/ # Halaman utama workspace dan tab berbasis route
│       │   ├── lead-workspace-page.tsx # Wrapper halaman workspace
│       │   ├── lead-info-page.tsx # Tab/halaman info lead
│       │   ├── lead-meeting-page.tsx # Tab/halaman meeting
│       │   ├── lead-notulensi-page.tsx # Tab/halaman notulensi
│       │   ├── lead-proposal-page.tsx # Tab/halaman proposal
│       │   ├── lead-engagement-letter-page.tsx # Tab/halaman engagement letter
│       │   └── lead-handover-page.tsx # Tab/halaman handover
│       ├── components/ # Komponen spesifik lead workspace
│       ├── hooks/ # Hook spesifik workspace
│       ├── services/ # Service data workspace
│       ├── types/ # Tipe data workspace
│       └── mocks/ # Dummy data workspace
│
├── services/ # Layer service global untuk komunikasi data
│   ├── http/ # Fondasi HTTP client global
│   │   ├── api-client.ts # Instance HTTP client utama
│   │   ├── interceptors.ts # Interceptor request/response, token, error handling
│   │   └── endpoints.ts # Konstanta endpoint API
│   │
│   └── adapters/ # Mapper data dari API/mock ke bentuk yang dipakai UI
│       ├── user-adapter.ts # Adaptasi data user
│       ├── campaign-adapter.ts # Adaptasi data campaign
│       └── lead-adapter.ts # Adaptasi data lead/workspace
│
├── hooks/ # Hook global reusable lintas fitur
│   ├── use-toggle.ts # Hook boolean toggle
│   ├── use-debounce.ts # Hook debounce untuk search/filter
│   └── use-local-storage.ts # Hook sinkronisasi state dengan localStorage
│
├── config/ # Konfigurasi global aplikasi
│   ├── env.ts # Akses environment variables secara aman dan terstruktur
│   └── app-config.ts # Konfigurasi global aplikasi, misalnya app name, default pagination, dsb
│
├── types/ # Tipe global lintas fitur
│   ├── api.ts # Tipe response API global
│   ├── user.ts # Tipe user global
│   ├── navigation.ts # Tipe item sidebar/header menu
│   └── common.ts # Tipe utilitas umum
│
├── utils/ # Fungsi utilitas murni tanpa state
│   ├── cn.ts # Helper gabung className
│   ├── storage.ts # Helper localStorage/sessionStorage
│   ├── format-date.ts # Helper format tanggal
│   └── format-currency.ts # Helper format angka/mata uang
│
├── App.tsx # Root komponen aplikasi, biasanya memanggil AppProvider atau Router
├── main.tsx # Entry point Vite, mount React ke DOM
├── index.css # Global styles dan import Tailwind
└── vite-env.d.ts # Tipe bawaan Vite untuk TypeScript