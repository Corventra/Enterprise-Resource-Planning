# PRD Struktur Folder Frontend ERP

**Project:** Corventra  
**Stack:** React + Vite + TypeScript + React Router + Tailwind CSS  
**Dokumen:** Panduan struktur folder frontend  
**Tujuan dokumen:** Menjadi acuan agar implementasi kode konsisten, rapi, scalable, dan sesuai kebutuhan sistem ERP.

---

# 1. Latar Belakang

Project ini adalah frontend untuk sistem ERP berbasis web (alur **lead-to-cash + project delivery + performance management**) untuk firma jasa profesional. Sistem memiliki 8 role utama:

| Role | Singkatan | Tanggung Jawab Utama |
|---|---|---|
| Marketing & Engagement Officer | MEO | Monitoring akuisisi (read-only Bank Data, Dashboard, Lead Tracker level eksekutif) |
| Business Development | BD | Pemilik pipeline lead-to-cash: campaign, form, bank data, lead, meeting, proposal, engagement letter, handover memo |
| Chief Executive Officer | CEO | **Approval gate**: Proposal, Engagement Letter, Handover Memo. Approve perubahan major di KPI framework. Co-finalize KPI period bersama HRD. |
| Chief Operating Officer | COO | Penanggung jawab pasca-handover: terima handover yang sudah di-approve CEO, **assign PM**, monitoring eksekusi project. Collaborative dengan HRD untuk Task Template. Operational override untuk KPI recompute. |
| Project Manager | PM | Owner project: terima penugasan dari COO, **assign Consultant**, kelola milestone dan deliverable. **Pemberi rating quality** untuk task yang di-approve (input utama dimensi Output Quality KPI). |
| Consultant | Consultant | Eksekutor project di lapangan: kerjakan deliverable, update progress milestone (input utama dimensi Task Completion, Timeliness, Update Compliance KPI). |
| Staff Admin | STAFF_ADMIN | Administrasi dokumen & pendukung lintas fitur (Document Center, Invoices, dukungan handover). |
| **Human Resources Department** | **HRD** | **Owner KPI framework**: configure bobot dimensi & threshold, finalize period snapshot, manual recompute, calibrate konsistensi rating antar PM, export KPI untuk payroll/HR. Tidak akses ke financials project (sama dengan PM/Consultant). |

> **Aturan visibility kritis:** PM, Consultant, **dan HRD** **tidak boleh** melihat data nominal/harga (`feeItems`, `paymentTerms`, `agreeFee`, `proposalFee`, `dealPrice`, `discount`, `successFee`, `billingSchedule`, `downPayment`, dll). Section harga di Project Detail harus di-gate dengan komponen `<RoleGate>` sehingga tidak di-render sama sekali untuk role tersebut, bukan sekadar disembunyikan dengan CSS. **HRD** secara konseptual punya ranah people/performance bukan komersial — sehingga harga adalah out-of-scope.

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
- Handover Memo
- **Approval Center** (CEO inbox unified untuk Proposal, EL, Handover Memo)
- **Projects** (lifecycle eksekusi pasca-handover)
  - Project Pipeline (list, view berbeda per role)
  - Project Detail (overview, timeline, team, documents, financials *gated*)
- **KPI System** (Performance Management, lihat Section 9)
  - KPI Center (dashboard agregat semua consultant)
  - KPI Detail per Consultant (4 dimensi + breakdown task + trend per period)
  - KPI Configuration (bobot dimensi, threshold, periode penilaian)
  - Task Templates per Service Line

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
```

---

# 5. Role, Permission, dan Visibility

## 5.1 Konstanta Role

Semua role didefinisikan sekali di `app/permissions/roles.ts` sebagai konstanta string. Hindari magic string di komponen.

```ts
export const ROLES = {
  MEO: 'MEO',
  BD: 'BD',
  CEO: 'CEO',
  COO: 'COO',
  PM: 'PM',
  CONSULTANT: 'CONSULTANT',
  STAFF_ADMIN: 'STAFF_ADMIN',
  HRD: 'HRD'
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];
```

## 5.2 Permission Matrix

| Aktivitas | MEO | BD | CEO | COO | PM | Consultant | Staff Admin | HRD |
|---|---|---|---|---|---|---|---|---|
| Lihat Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lihat Bank Data | ✓ (read) | ✓ | – | – | – | – | – | – |
| Process Bank Data → Lead | – | ✓ | – | – | – | – | – | – |
| Buat Campaign / Form | – | ✓ | – | – | – | – | – | – |
| Edit Lead Workspace (meeting, proposal, EL) | – | ✓ | – | – | – | – | – | – |
| Approve Proposal | – | – | ✓ | – | – | – | – | – |
| Approve Engagement Letter | – | – | ✓ | – | – | – | – | – |
| Submit Handover Memo | – | ✓ | – | – | – | – | ✓ | – |
| Approve Handover Memo | – | – | ✓ | – | – | – | – | – |
| Assign PM ke Project | – | – | – | ✓ | – | – | – | – |
| Assign Consultant ke Project | – | – | – | – | ✓ | – | – | – |
| Update milestone / deliverable Project | – | – | – | – | ✓ | ✓ | – | – |
| Lihat **harga / nominal** (fee, billing, dll) | – | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Lihat Project (tanpa harga) | – | – | ✓ | ✓ | ✓ (assigned) | ✓ (assigned) | – | ✓ (read-only) |
| Document Center | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Lihat KPI sendiri** (own) | – | – | – | – | ✓ | ✓ | – | – |
| **Lihat KPI tim** (PM's consultants) | – | – | – | – | ✓ | – | – | – |
| **Lihat KPI semua consultant** | – | – | ✓ | ✓ | – | – | ✓ (audit) | ✓ (primary) |
| **Rate quality task** (saat approve task selesai) | – | – | – | – | ✓ | – | – | – |
| **Configure KPI** (bobot dimensi, threshold) | – | – | view + approve major | view | – | – | – | ✓ primary |
| **Finalize KPI period** (lock snapshot) | – | – | ✓ | – | – | – | – | ✓ |
| **Manual recompute KPI** (audit-logged) | – | – | – | ✓ (operational override) | – | – | – | ✓ |
| **Manage Task Template** per service line | – | – | – | ✓ collaborative | – | – | – | ✓ collaborative |
| **Export KPI report** (CSV/PDF) | – | – | – | – | – | – | ✓ (delegasi) | ✓ primary |

✓ = ada akses, ✗ = ada akses tapi data harga **wajib di-mask**, – = tidak ada akses sama sekali.

> **HRD vs Staff Admin** — keduanya bersifat "admin" tapi domain berbeda. Staff Admin = operasional/dokumen (Handover, Invoice, Document Center). HRD = people/performance (KPI framework, rating calibration, payroll export). HRD **tidak** punya akses ke financials project, sedangkan Staff Admin boleh (untuk billing/invoicing).

## 5.3 Pola Penegakan Permission

Tiga lapis enforcement:

1. **Route-level** — `app/guards/permission-guard.tsx` membungkus route yang sensitif. Kalau role tidak punya akses, redirect ke `/unauthorized` atau `/dashboard`.
2. **Navigation-level** — tiap item `sidebarNavItems` punya field `permission?: Role[]`. Sidebar component memfilter item sebelum render.
3. **Component-level** — `<RoleGate roles={[...]}>` membungkus section UI yang sensitif (mis. Financials section di Project Detail). Kalau role tidak match, children tidak di-render sama sekali.

```tsx
// contoh pemakaian di project-detail-page.tsx
<RoleGate roles={[ROLES.CEO, ROLES.COO, ROLES.BD, ROLES.STAFF_ADMIN]}>
  <ProjectFinancialsSection project={project} />
</RoleGate>
```

> Jangan gunakan `display: none` atau `visibility: hidden` untuk mask data harga — DOM masih bisa di-inspect. Gunakan conditional render via `<RoleGate>`.

---

# 6. Alur Bisnis Handover → Project

## 6.1 Status Machine Handover Memo

Status `HandoverItem.status` di [features/handover/types/handover.types.ts](frontend-development/src/features/handover/types/handover.types.ts) di-extend dari `'Draft' | 'Submitted'` menjadi:

```
DRAFT
  │ (BD/Staff Admin: Submit)
  ▼
WAITING_CEO_APPROVAL
  │                       │
  │ (CEO: Request Revise) │ (CEO: Approve)
  ▼                       ▼
REVISION_NEEDED        APPROVED
  │                       │
  │ (BD: Revise)          │ (COO: Assign PM → spawn Project)
  ▼                       ▼
DRAFT                  ASSIGNED_TO_PM
                          │
                          │ (PM: Assign Consultant)
                          ▼
                       IN_PROJECT
                          │
                          │ (PM: Mark Complete saat semua deliverable selesai)
                          ▼
                       COMPLETED
```

```ts
export type HandoverStatus =
  | 'Draft'
  | 'Waiting CEO Approval'
  | 'Revision Needed'
  | 'Approved'
  | 'Assigned to PM'
  | 'In Project'
  | 'Completed';
```

## 6.2 Entitas Project (Baru)

Saat COO klik "Assign PM" pada handover yang `Approved`, dibuat entitas `Project` yang **mereferensikan** handover. Project punya lifecycle dan status sendiri:

```ts
// features/projects/types/project.types.ts
export type ProjectStatus =
  | 'Awaiting Consultant'   // PM baru di-assign, belum pilih consultant
  | 'In Progress'           // Consultant sudah di-assign, kerja jalan
  | 'On Hold'               // dijeda
  | 'Completed'
  | 'Cancelled';

export interface Project {
  id: string;
  projectCode: string;        // mis. PRJ-2026-0001
  handoverId: string;         // referensi balik ke handover memo
  client: string;
  projectName: string;
  serviceLine: 'Transfer Pricing' | 'Tax' | 'Advisory' | 'Audit';
  status: ProjectStatus;
  pm: { id: string; name: string } | null;
  consultants: Array<{ id: string; name: string; role: 'Lead' | 'Senior' | 'Junior' }>;
  startDate: string;
  endDate: string;
  milestones: Array<{
    id: string;
    title: string;
    targetDate: string;
    status: 'Pending' | 'In Progress' | 'Done' | 'Blocked';
    owner: string;
  }>;
  // Tidak ada field harga di sini — harga selalu lewat handover, dan view
  // PM/Consultant menyembunyikannya via <RoleGate>.
}
```

## 6.3 Tabel Aksi per Transisi

| Dari → Ke | Trigger | Role | Halaman |
|---|---|---|---|
| Draft → Waiting CEO Approval | Klik "Submit" | BD / Staff Admin | Handover Update Page |
| Waiting CEO Approval → Approved | Klik "Approve" | CEO | Approval Center |
| Waiting CEO Approval → Revision Needed | Klik "Request Revision" | CEO | Approval Center |
| Revision Needed → Draft | Klik "Edit & Resubmit" | BD / Staff Admin | Handover Update Page |
| Approved → Assigned to PM (+ create Project) | Klik "Assign PM" | COO | Project Pipeline (COO view) |
| Assigned to PM → In Project | Klik "Assign Consultant" | PM | Project Detail (Team tab) |
| In Project → Completed | Semua milestone Done | PM | Project Detail (Timeline tab) |

## 6.4 Critical Path End-to-End

```
[BD] Lead → EL Signed
  └─ [BD/Staff Admin] Buat Handover Memo (Draft) → Submit
       └─ status: WAITING_CEO_APPROVAL
            └─ [CEO] di Approval Center → Approve
                 └─ status: APPROVED (muncul di COO Project Pipeline)
                      └─ [COO] klik Assign PM → pilih PM → Spawn Project (status: Awaiting Consultant)
                           ├─ Handover memo status: ASSIGNED_TO_PM
                           └─ [PM] di Project Pipeline → buka Project Detail → Assign Consultant
                                └─ Project status: In Progress, Handover status: IN_PROJECT
                                     └─ [Consultant] kerjakan milestone → update status
                                          └─ Project Completed → Handover Completed
```

---

# 7. Page Tambahan dan Tema UI

Tema visual mengikuti page existing (`bank-data-page`, `lead-tracker-page`, `handover-page`):
- Layout: `<PageContainer>` → header (title + action button) → filter row → card grid / table.
- Card pakai `rounded-xl border bg-white p-5` dengan status badge di pojok kanan atas.
- Detail page: section vertikal dengan heading kecil + grid 2 kolom info-row.
- Modal/dialog: pakai `<SidePanelDialog>` yang sudah ada di [components/ui/side-panel-dialog.tsx](frontend-development/src/components/ui/side-panel-dialog.tsx).
- Icon: lucide-react.
- Color accent: ikuti palette existing — primary biru, success hijau, warning kuning, danger merah, neutral abu.

## 7.1 Approval Center — `/approval`

**Akses**: CEO (primary), COO (read-only oversight).

**Layout**:
- Tab pills di atas: `Proposals` | `Engagement Letters` | `Handover Memos` | `All`
- Tiap tab = list card dengan: client/lead, summary 1 baris, submitted by, submitted at (relative), tombol primary "Review".
- Klik card → buka `<SidePanelDialog>` di kanan, isi: detail dokumen + tombol "Approve" / "Request Revision" + textarea catatan revisi.
- Setelah action, item hilang dari list dengan toast feedback.

**Empty state**: ilustrasi sederhana + teks "No pending approvals — semua sudah di-review".

## 7.2 Project Pipeline — `/projects`

**Akses**: COO (full), PM (filtered ke project miliknya), Consultant (filtered ke project di mana ia consultant).

**Layout per role**:

- **COO**: 3 kolom kanban — `Awaiting Consultant` | `In Progress` | `Completed`. Tiap card: project code, client, service line, PM avatar, milestone progress bar. Tombol global "Assign PM" untuk handover yang baru `Approved` (banner di atas).
- **PM**: Section atas "Inbox: Newly Assigned" (project yang status `Awaiting Consultant`, butuh action assign Consultant). Section bawah "My Active Projects" (status `In Progress`).
- **Consultant**: List card "My Active Projects" dengan progress milestone yang di-assign ke dirinya.

**Filter row**: search, service line, status.

## 7.3 Project Detail — `/projects/:projectId`

**Tabs** (URL-based, mirip Lead Workspace):
- `overview` — info klien, scope (in/out), deliverable, background summary. *Diambil dari handover memo, filtered.*
- `timeline` — milestone list dengan status update inline.
- `team` — PM info + consultants list. Tombol "Assign Consultant" (PM-only).
- `documents` — daftar dokumen project (handover doc, deliverables, dll).
- `financials` — fee items, payment terms, billing schedule. **Hanya muncul** untuk CEO/COO/BD/Staff Admin via `<RoleGate>`. PM/Consultant tidak melihat tab ini sama sekali (di-filter di tab list, bukan disembunyikan di konten).

**Header detail**: project code, status badge, PM, start–end date, action buttons sesuai role+status.

## 7.4 Update Handover Detail — `/handover/:id`

Tambahan section di handover detail page yang sudah ada:
- **Approval Trail** — timeline aksi: submitted by + at, approved/rejected by + at + notes, assigned PM + at.
- Tombol action di header berubah sesuai status:
  - `Draft` → "Edit" + "Submit"
  - `Waiting CEO Approval` → (CEO only) "Approve" + "Request Revision"
  - `Revision Needed` → "Edit & Resubmit" (BD/Staff Admin)
  - `Approved` → (COO only) "Assign PM"
  - `Assigned to PM` / `In Project` → link "Open Project" → `/projects/:projectId`

## 7.5 Sidebar per Role

Update [app/navigation/sidebar-nav.ts](frontend-development/src/app/navigation/sidebar-nav.ts) dengan field `permission`:

```ts
{ label: 'Approval', path: '/approval', icon: CheckCircle2, permission: [ROLES.CEO, ROLES.COO] }
{ label: 'Projects', path: '/projects', icon: Briefcase, permission: [ROLES.COO, ROLES.PM, ROLES.CONSULTANT, ROLES.CEO] }
```

Sidebar component lalu memfilter item sebelum render: `items.filter(it => !it.permission || it.permission.includes(currentRole))`.

---

# 8. Tambahan Struktur Folder (untuk fitur baru)

```txt
src/
├── app/
│   ├── guards/
│   │   ├── auth-guard.tsx
│   │   ├── guest-guard.tsx
│   │   └── permission-guard.tsx       # NEW — block route based on role
│   │
│   ├── permissions/                   # NEW — diaktifkan dari PRD asli
│   │   ├── roles.ts                   # ROLES const + Role type
│   │   ├── permissions.ts             # PERMISSIONS const (granular action)
│   │   └── permission-map.ts          # Role → permissions[]
│   │
│   └── store/
│       └── auth-store.ts              # current user + role
│
├── components/
│   └── shared/
│       └── access/                    # NEW
│           └── role-gate.tsx          # <RoleGate roles={[...]}>{children}</RoleGate>
│
└── features/
    ├── approval/                      # NEW — Approval Center untuk CEO/COO
    │   ├── pages/
    │   │   └── approval-center-page.tsx
    │   ├── components/
    │   │   ├── approval-tabs.tsx
    │   │   ├── approval-card.tsx
    │   │   └── approval-detail-panel.tsx
    │   ├── hooks/
    │   ├── services/
    │   ├── types/
    │   │   └── approval.types.ts
    │   └── mocks/
    │       └── approval.mock.ts
    │
    └── projects/                      # NEW — Project lifecycle pasca-handover
        ├── pages/
        │   ├── projects-page.tsx              # pipeline list, view per role
        │   └── project-detail-page.tsx        # detail dengan tabs
        ├── components/
        │   ├── list/
        │   │   ├── project-card.tsx
        │   │   ├── project-filters.tsx
        │   │   └── coo-assign-pm-banner.tsx
        │   ├── detail/
        │   │   ├── project-overview.tsx
        │   │   ├── project-timeline.tsx
        │   │   ├── project-team.tsx
        │   │   ├── project-documents.tsx
        │   │   └── project-financials.tsx     # gated, CEO/COO/BD/Staff only
        │   └── modals/
        │       ├── assign-pm-dialog.tsx
        │       └── assign-consultant-dialog.tsx
        ├── hooks/
        │   ├── use-projects.ts
        │   └── use-project-detail.ts
        ├── services/
        │   └── project.service.ts
        ├── types/
        │   └── project.types.ts
        └── mocks/
            └── projects.mock.ts
```

---

# 9. KPI System (Performance Management)

## 9.1 Tujuan dan Rujukan Akademis

Modul KPI dirancang sebagai **alat penilaian kinerja Consultant secara objektif, konsisten, transparan, dan auditable**, terintegrasi langsung dengan workflow project monitoring. Pendekatan ini mengikuti formulasi KPI yang dirumuskan dalam tinjauan pustaka skripsi (Karlina & Samanhudi, 2023) dengan dua prinsip utama:

1. **Tidak ada role yang menghitung KPI secara manual.** Sistem (engine) yang menghitung otomatis berdasarkan raw data yang di-input role tertentu. Prinsip ini diperlukan untuk menjaga konsistensi antar-periode dan menghindari konflik kepentingan.
2. **Setiap angka KPI dapat di-trace ke task-level data point** (`updateLog`, `qualityRating`, `completedAt`) — mendukung klaim "didukung oleh sumber data yang valid agar hasil evaluasi dapat dipertanggungjawabkan".

## 9.2 Empat Dimensi KPI dan Bobot Default

KPI Consultant dihitung dari 4 dimensi dengan bobot default **35 / 25 / 15 / 25** (total = 100%). Bobot ini dapat di-adjust oleh HRD; perubahan bobot dimensi (major change) wajib di-approve CEO.

| # | Dimensi | Bobot (`w_i`) | Tipe | Sumber Data | Formula Capaian (`c_i`) |
|---|---|---:|---|---|---|
| 1 | **Task Completion** (kuantitas, weighted) | 35% | benefit | `project.milestones[].status === 'Done'` × `taskWeight` | `Σ(taskWeight × done) / Σ(taskWeight) × 100%` |
| 2 | **Timeliness** (ketepatan waktu) | 25% | benefit | `completedAt` vs `targetDate`, dengan toleransi ≤2 hari | `onTimeCount / totalDoneCount × 100%` |
| 3 | **Update Compliance** (kepatuhan progress update) | 15% | cost | gap antar entry di `updateLog[]`, target organisasi 3 hari | `targetGapDays / actualAvgGapDays × 100%` (cap 100%) |
| 4 | **Output Quality** (rating PM 1–5) | 25% | benefit | `qualityRating` di-set PM saat approve task | `avgRating / 5 × 100%` |

## 9.3 Formula Perhitungan

Mengikuti rujukan tesis:

- **Indikator benefit** (semakin besar semakin baik): `c_i = realisasi / target × 100%`
- **Indikator cost** (semakin kecil semakin baik): `c_i = target / realisasi × 100%` (di-cap 100%)
- **Skor total KPI** dengan bobot ternormalisasi (`Σw_i = 1`):

```
KPI_total = Σ(w_i × c_i)
```

- Apabila bobot belum dinormalisasi:

```
KPI_total = Σ(b_i × c_i) / Σ(b_i)
```

## 9.4 Task Template per Service Line

Setiap project di-spawn dengan task list dari TaskTemplate sesuai service line. Template di-manage **collaborative HRD + COO** (COO definisi workflow, HRD assign weight per task untuk rating konteks). Default 4 service line:

- **Transfer Pricing** (10 task — sesuai screenshot referensi: Permintaan Dokumen, Kelengkapan Dokumen, ..., Quality Control, Kirim Net ke Klien)
- **Tax** (TBD via Settings)
- **Advisory** (TBD via Settings)
- **Audit** (TBD via Settings)

Per task template:
- `title`: Nama task
- `weight`: Bobot relatif (sum per template = 100, customizable per project oleh PM)
- `phase`: Fase project (Initiation, Analysis, Core Work, QC, Delivery)
- `expectedDurationDays`: Estimasi durasi (untuk auto-set targetDate saat spawn)

PM dapat override weight per project saat handover di-convert ke project (tidak mempengaruhi template global).

## 9.5 Periode Penilaian dan Snapshot

- **Default periode**: Monthly (YYYY-MM)
- **Snapshot lifecycle**: Real-time recompute setiap data change → finalize end-of-period oleh **HRD atau CEO** → snapshot menjadi **immutable** (audit-locked)
- **Trend tracking**: Semua snapshot historis disimpan untuk analisis trend per consultant

## 9.6 Computation Flow & Tanggung Jawab Role

| Tahap | Aktor | Aksi | Frekuensi |
|---|---|---|---|
| 1. Set rules (bobot, target, threshold) | **HRD** primary, **CEO** approve major changes | Configure di Settings → KPI Config | Per quarter / saat policy change |
| 2. Provide raw data — progress | **Consultant** | Update status task (Pending → In Progress → Done) + catatan | Harian / per milestone |
| 3. Provide raw data — quality | **PM** | Approve task selesai + isi rating 1–5 + revision count + comment | Per task selesai |
| 4. **Compute (the math)** | **Sistem (auto)** | Engine: hitung `c_i` per dimensi → `KPI_total` → simpan ke `KpiSnapshot` | Real-time + cron month-end |
| 5. Acknowledge & qualitative review | **PM** | Review snapshot tim, tambah comment (tidak edit angka) | Akhir periode |
| 6. Calibration & oversight | **HRD** + **COO** | Lihat agregat, deteksi outlier, calibrate konsistensi rating antar PM | Akhir periode |
| 7. Finalize period (lock snapshot) | **HRD** atau **CEO** | Lock snapshot menjadi immutable | Akhir periode |
| 8. Strategic view & policy adjust | **CEO** | Approve perubahan bobot dimensi untuk periode berikut | Per quarter |
| 9. Manual recompute (kalau ada koreksi data masal) | **HRD** atau **COO** (operational override) | Trigger rekalkulasi, audit-logged | Ad-hoc, jarang |
| 10. Audit / export | **HRD** primary, **Staff Admin** delegasi | Export CSV/PDF untuk payroll / HR system | Per kebutuhan |
| 11. Self-monitor | **Consultant** | Lihat KPI sendiri + drill-down task-level | Anytime |

## 9.7 Cross-Project Aggregation

Consultant aktif di multi-project: KPI agregat = **weighted by jumlah task yang ia owni di tiap project**. Logika:

```
ConsultantKpi_Period = Σ(taskCountInProject × ProjectKpi) / Σ(taskCountInProject)
```

Project dengan workload lebih besar memberi bobot lebih besar — konsultan tidak di-penalize karena project kecil ber-tempo lambat saat project besar berjalan baik.

## 9.8 Threshold Defaults

| Threshold | Default | Tipe | Bisa Di-edit? |
|---|---|---|---|
| On-time tolerance | ≤ 2 hari setelah `targetDate` | benefit | HRD via Settings |
| Update gap target | 3 hari (max gap antar update) | cost | HRD via Settings |
| Quality rating scale | 1 (rendah) – 5 (tinggi), Likert | input | Tidak (locked, akademic basis) |
| Quality rating mandatory | Ya, wajib saat PM approve task | rule | Tidak |
| Period | Monthly | – | HRD via Settings (Quarterly opsional di v2) |

## 9.9 Page dan Akses

| Page | Route | Akses Role |
|---|---|---|
| KPI Center (agregat semua consultant) | `/kpi` | HRD, COO, CEO, Staff Admin (read-only export) |
| KPI Detail Consultant (4 dimensi + breakdown task + trend) | `/kpi/consultant/:consultantId` | HRD/COO/CEO (semua); PM (jika consultant bagian timnya); Consultant (hanya untuk diri sendiri) |
| KPI My Team (PM lihat consultant timnya) | `/kpi/team` | PM only |
| KPI Self View (consultant lihat sendiri) | `/kpi/me` | Consultant only |
| KPI Configuration (bobot dimensi, threshold, periode) | `/settings/kpi-config` | HRD primary; CEO/COO view |
| Task Template Manager | `/settings/task-templates` | HRD + COO collaborative |
| PM Rating Dialog | (modal di Project Timeline tab) | PM only, terbuka saat approve task ke status Done |

## 9.10 Schema Additions

### Extend `ProjectMilestone` (existing)

Tambahan field (kompatibel dengan struktur saat ini di [features/projects/types/project.types.ts](frontend-development/src/features/projects/types/project.types.ts)):

```ts
export interface ProjectMilestone {
  // existing
  id; title; targetDate; status; ownerId; ownerName; notes?;
  // NEW (KPI-related)
  weight: number;                    // default 10, range 1-50
  phase?: 'Initiation' | 'Analysis' | 'Core Work' | 'QC' | 'Delivery';
  completedAt?: string;              // ISO, set automatically saat status → 'Done'
  qualityRating?: 1 | 2 | 3 | 4 | 5; // PM-set saat approve
  revisionCount?: number;            // PM-set, default 0
  updateLog: TaskUpdateLogEntry[];   // append-only, untuk dimensi compliance
}

export interface TaskUpdateLogEntry {
  at: string;                        // ISO
  byId: string;                      // user email
  byName: string;
  fromStatus: ProjectMilestoneStatus;
  toStatus: ProjectMilestoneStatus;
  note?: string;
}
```

### `TaskTemplate` (NEW)

```ts
export interface TaskTemplate {
  id: string;
  serviceLine: ProjectServiceLine;
  name: string;                      // "TP Standard 2026"
  isDefault: boolean;
  tasks: Array<{
    title: string;
    weight: number;
    phase?: ProjectMilestone['phase'];
    expectedDurationDays: number;
  }>;
  createdAt: string;
  updatedBy: { id: string; name: string; role: Role };
  updatedAt: string;
}
```

### `KpiSnapshot` (NEW — computed per consultant per period)

```ts
export type KpiDimensionKey = 'taskCompletion' | 'timeliness' | 'updateCompliance' | 'outputQuality';

export interface KpiDimensionScore {
  weight: number;                    // 0..1 (normalized)
  capaian: number;                   // 0..100 (%)
  rawValue: number;                  // raw metric (e.g., 5/7 = 0.714 untuk timeliness)
  contributingTaskIds: string[];     // jejak audit
}

export interface KpiSnapshot {
  consultantId: string;
  consultantName: string;
  period: string;                    // "2026-04" (YYYY-MM)
  computedAt: string;
  finalizedAt?: string;              // null = preliminary, ada = locked
  finalizedBy?: { id: string; name: string; role: Role };
  dimensions: Record<KpiDimensionKey, KpiDimensionScore>;
  total: number;                     // 0..100
  contributingProjectIds: string[];
}
```

### `KpiPeriodConfig` (NEW — per organisasi, di-edit HRD)

```ts
export interface KpiPeriodConfig {
  effectiveFrom: string;             // ISO
  weights: Record<KpiDimensionKey, number>;  // sum = 1.0
  onTimeToleranceDays: number;       // default 2
  updateGapTargetDays: number;       // default 3
  qualityRatingScale: 5;             // locked
  period: 'monthly' | 'quarterly';   // default monthly
  approvedBy?: { id: string; name: string; role: Role };  // CEO untuk major changes
  approvedAt?: string;
}
```

## 9.11 Tambahan Permission

Tambahan ke `permissions.ts`:

```ts
KPI_VIEW_OWN: 'KPI_VIEW_OWN',
KPI_VIEW_TEAM: 'KPI_VIEW_TEAM',
KPI_VIEW_ALL: 'KPI_VIEW_ALL',
KPI_RATE_TASK: 'KPI_RATE_TASK',
KPI_CONFIGURE: 'KPI_CONFIGURE',
KPI_FINALIZE_PERIOD: 'KPI_FINALIZE_PERIOD',
KPI_RECOMPUTE: 'KPI_RECOMPUTE',
KPI_EXPORT: 'KPI_EXPORT',
TASK_TEMPLATE_MANAGE: 'TASK_TEMPLATE_MANAGE',
```

Mapping ke role (lihat juga [Section 5.2](#52-permission-matrix)):

| Permission | Granted to |
|---|---|
| `KPI_VIEW_OWN` | PM, Consultant, HRD, COO, CEO |
| `KPI_VIEW_TEAM` | PM |
| `KPI_VIEW_ALL` | HRD (primary), COO, CEO, Staff Admin (audit) |
| `KPI_RATE_TASK` | PM |
| `KPI_CONFIGURE` | HRD (primary), CEO (approve major), COO (view) |
| `KPI_FINALIZE_PERIOD` | HRD, CEO |
| `KPI_RECOMPUTE` | HRD, COO (operational override) |
| `KPI_EXPORT` | HRD (primary), Staff Admin (delegasi) |
| `TASK_TEMPLATE_MANAGE` | HRD, COO (collaborative) |

## 9.12 Folder Structure Tambahan untuk KPI

```txt
src/
├── features/
│   ├── kpi/                          # NEW — modul Performance Management
│   │   ├── pages/
│   │   │   ├── kpi-center-page.tsx           # /kpi (HRD/COO/CEO/Staff Admin)
│   │   │   ├── kpi-consultant-page.tsx       # /kpi/consultant/:id
│   │   │   ├── kpi-team-page.tsx             # /kpi/team (PM)
│   │   │   └── kpi-self-page.tsx             # /kpi/me (Consultant)
│   │   ├── components/
│   │   │   ├── dimension-card.tsx            # 1 card per dimensi (4 cards di detail)
│   │   │   ├── kpi-trend-chart.tsx           # line chart per period
│   │   │   ├── kpi-breakdown-table.tsx       # task-level audit drill-down
│   │   │   ├── kpi-summary-cards.tsx         # agregat di KPI Center
│   │   │   └── pm-rate-task-dialog.tsx       # modal PM saat approve task
│   │   ├── hooks/
│   │   │   ├── use-kpi-snapshot.ts
│   │   │   ├── use-kpi-period-config.ts
│   │   │   └── use-kpi-engine.ts             # trigger compute
│   │   ├── services/
│   │   │   ├── kpi-engine.ts                 # core compute logic (the math)
│   │   │   ├── kpi-snapshot-service.ts       # CRUD snapshot
│   │   │   └── kpi-config-service.ts         # CRUD config + finalize
│   │   ├── types/
│   │   │   └── kpi.types.ts                  # KpiSnapshot, KpiDimensionScore, dll
│   │   ├── utils/
│   │   │   ├── kpi-calculations.ts           # pure functions (capaian per dimensi)
│   │   │   └── kpi-aggregations.ts           # cross-project weighted average
│   │   └── mocks/
│   │       ├── kpi-snapshots.mock.ts         # historical snapshot dummy
│   │       └── kpi-config.mock.ts            # default config
│   │
│   └── settings/                     # NEW — Settings pages
│       └── pages/
│           ├── kpi-config-page.tsx           # /settings/kpi-config (HRD primary)
│           └── task-templates-page.tsx       # /settings/task-templates (HRD+COO)
│
└── features/projects/                # EXTEND existing
    ├── mocks/
    │   └── task-templates.mock.ts            # NEW — default template per service line
    ├── types/
    │   └── task-template.types.ts            # NEW — TaskTemplate type
    └── services/
        └── task-template-service.ts          # NEW — CRUD template, used saat spawn project
```

## 9.13 Implementation Roadmap

Mengikuti pola Step 1-5 yang sudah jalan (additive, tidak menyentuh existing yang sudah stabil):

| Step | Scope | File baru/ubah |
|---|---|---|
| **6a** | Add HRD role infrastructure | `roles.ts`, `permission-map.ts`, `auth.service.ts` (dummy `hrd@erp.local`), update permission-related sidebar items |
| **6b** | Extend `ProjectMilestone` type + `TaskTemplate` + auto-update `updateLog[]` saat status change | Extend [project.types.ts](frontend-development/src/features/projects/types/project.types.ts), tambah TaskTemplate types, update [project-service.ts](frontend-development/src/features/projects/services/project-service.ts) supaya append log saat mutate |
| **6c** | Project Timeline tab interaktif: Consultant update status (in-place dropdown), PM approve task dengan rating 1-5 | Update [project-timeline-page.tsx](frontend-development/src/features/projects/pages/project-timeline-page.tsx), tambah `pm-rate-task-dialog.tsx` |
| **6d** | KPI engine (kalkulasi `c_i` per dimensi + `KPI_total`), KpiSnapshot mock + service | New `features/kpi/utils/kpi-calculations.ts`, `kpi-engine.ts`, `kpi-snapshot-service.ts` |
| **6e** | Pages KPI: Center, Detail Consultant, Self View, Team View | New `features/kpi/pages/*` |
| **6f** | KPI Config page (HRD) + Task Template Manager (HRD+COO) | New `features/settings/pages/*` |
| **6g** | Cross-reference: link dari Project Detail Team tab ke consultant KPI; link dari Consultant home ke own KPI | Update existing pages (additive) |