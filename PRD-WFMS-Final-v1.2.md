# PRD (Final v1.2): Workflow Management System (WFMS)
## Modul Monitoring Proyek TP-Doc — PT DSK Global Konsultama

> **Catatan versi:** Dokumen ini adalah konsolidasi PRD v1.1 (selaras
> implementasi sistem Corventra) dengan tambahan elemen yang dibutuhkan
> dosen pembimbing untuk penjelasan skripsi BAB 3 dan BAB 4. Perubahan
> dari v1.1:
>
> 1. **Bagian 6 baru — SOP Digital eksplisit per state transition**
>    (dosen pembimbing minta "SOP-nya diperjelasin").
> 2. **Bagian 7 baru — Mapping Workflow Manual → Workflow WFMS**
>    (kebutuhan BAB 4 untuk perbandingan eksisting vs future).
> 3. **Bagian References ke Skripsi diperjelas** dengan mapping per
>    sub-bab.
> 4. **Bagian Quick Reference Card** diperkaya dengan defensive
>    answers untuk pertanyaan sidang yang spesifik.
>
> Semua state machine, schema database, API, dan implementasi tetap
> sesuai realitas sistem (5 state project, 4 state milestone, dual
> audit trail, derived metric untuk At Risk, tanpa cron).

---

| Meta | Detail |
|------|--------|
| Document | Product Requirements Document (Final v1.2) |
| Modul | Workflow Management System (WFMS) |
| Sistem | Aplikasi Monitoring Proyek dan Penilaian KPI (Corventra) |
| Studi Kasus | PT DSK Global Konsultama — Layanan Transfer Pricing Documentation (TP-Doc) |
| Tech Stack | React 19 + Vite 8 + TypeScript + Tailwind v4 (FE) / Node + Express 5 + MySQL 8 (BE) |
| Versi | 1.2 (Final — Consolidated) |
| Author | Muhamad Faried (NIM 2207412041) |
| Pembimbing | (Nama dosen pembimbing) |

---

## 1. OVERVIEW

### 1.1 Latar Belakang

Monitoring proyek TP-Doc di PT DSK Global Konsultama saat ini dilakukan secara manual menggunakan spreadsheet Excel, WhatsApp, dan email yang tidak terintegrasi. Status pekerjaan disepakati informal antar peran (CEO, COO, PM, Konsultan), sehingga tidak ada single source of truth untuk progres proyek, tidak ada audit trail perubahan status, dan deteksi keterlambatan baru terjadi setelah masalah eskalasi.

### 1.2 Tujuan Modul WFMS

Modul WFMS bertanggung jawab untuk:
1. Mendefinisikan state pekerjaan yang baku dan tertelusur.
2. Mengendalikan transisi state berdasarkan rule yang telah ditetapkan.
3. Mencatat audit trail setiap perubahan state beserta aktor dan waktu.
4. Menjalankan side effect otomatis (trigger final invoice saat completion, block transition saat DP unpaid) tanpa intervensi manual.
5. Menyediakan visualisasi state yang konsisten antara backend dan frontend.
6. Menyediakan derived monitoring metric (overdue, days waiting) untuk keterlambatan tanpa mengubah state di DB.

### 1.3 Posisi dalam Sistem

WFMS adalah **lapisan kendali (rule engine)** yang berada di antara user action (frontend) dan data persistence (database). Setiap perubahan state proyek dan milestone **harus melalui WFMS service**, tidak boleh langsung `UPDATE` ke database.

```
[User Action di Frontend]
        ↓
[API Endpoint (Express Route + Controller)]
        ↓
[WFMS Transition Service] ← validasi matrix, otorisasi, audit log, side effect
        ↓
[Database: state ENUM + audit log tables]
```

### 1.4 Cross-Module Integration

WFMS terintegrasi dengan modul lain melalui shared DB tables (bukan event bus):

| Trigger | Source | Target | Mekanisme |
|---------|--------|--------|-----------|
| DP Unpaid Guard | `handovers.dp_payment_status` | Block transisi `Awaiting Consultant → In Progress` | Read di `setConsultants`/`assignConsultants` controller |
| Project Completed → Invoice | Project lifecycle | `invoice_terms` (term FINAL) | UPDATE `trigger_reference_value`, lalu `syncInvoiceTermLifecycle()` |
| Milestone Done → KPI | `project_milestones.completed_at` & `quality_rating` | `kpi_snapshots` (Phase 2) | Recompute on demand atau scheduled (Future Work) |

---

## 2. SCOPE

### 2.1 In Scope

- State machine untuk entitas `projects` (5 status) dan `project_milestones` (4 status).
- Validation rule untuk setiap transisi state (matrix, preconditions, authorization role-based).
- Audit trail dengan dua tabel: `project_status_transitions` (project-level) dan `project_milestone_updates` (milestone-level), keduanya append-only.
- Authorization check berdasarkan role (CEO, COO, PM, Konsultan, Superadmin) via JWT permissions array + ownership check (PM vs owner).
- Side effect otomatis terintegrasi: DP unpaid guard, final invoice trigger, KPI input columns.
- RESTful API endpoint untuk transisi state.
- Frontend component untuk visualisasi state (badge, filter, conditional button).
- Derived monitoring metric di dashboard query: overdue milestone, days waiting DP, days pending handover.
- SOP digital yang mendokumentasikan tanggung jawab pengguna dan respon sistem per transisi state.

### 2.2 Out of Scope (sengaja tidak diimplementasi)

- **Push-based cron At Risk detection** — diganti dengan passive overdue detection di dashboard query. Lihat Future Work (Phase 4).
- **Email / SMS notification** — sistem cukup in-app dashboard alert. Push notification masuk Future Work.
- State machine framework eksternal (Camunda, Airflow) — pakai custom implementation per service layer.
- Workflow editor visual (no-code) — workflow di-define di code.
- Approval chain multi-step kompleks — cukup single approver per transisi.
- Versioning workflow definition — workflow definition fixed di code.

---

## 3. STATE MACHINE DEFINITION

### 3.1 State Machine Project

#### 3.1.1 Daftar State Project

| State | Definisi | Karakteristik |
|-------|----------|---------------|
| **Awaiting Consultant** | Project baru lahir dari handover yang sudah APPROVED. PM sudah di-assign, tapi konsultan tim belum diisi. | Initial state |
| **In Progress** | Konsultan sudah ditugaskan, DP sudah PAID, milestone mulai dikerjakan. | Active state |
| **On Hold** | Project pause sementara — misal karena klien minta penundaan, atau ada blocker di luar tim. | Pause state |
| **Completed** | Semua milestone berstatus `Done`, final invoice ter-trigger. | Terminal state (success) |
| **Cancelled** | Project dibatalkan sebelum selesai — misal klien batal kontrak, atau scope di-reschedule jadi proyek baru. | Terminal state (failure) |

#### 3.1.2 Diagram Transisi Project

```
                  [START]
                     ↓
              ┌─────────────────────┐
              │ Awaiting Consultant │
              └──────────┬──────────┘
                         │ assign_consultants (DP harus PAID)
                         ↓
                  ┌─────────────┐
            ┌─────│ In Progress │─────┐
            │     └──────┬──────┘     │
            │            │            │
       put_on_hold       │     all_milestones_done
            │            │            │
            ↓            │            ↓
       ┌─────────┐       │      ┌───────────┐
       │ On Hold │       │      │ Completed │
       └────┬────┘       │      └───────────┘
            │            │       [TERMINAL]
            │ resume     │
            └────────────┘
                         │ cancel (any state)
                         ↓
                   ┌───────────┐
                   │ Cancelled │
                   └───────────┘
                    [TERMINAL]
```

#### 3.1.3 Transition Matrix Project

| From / To | Awaiting Consultant | In Progress | On Hold | Completed | Cancelled |
|-----------|:-------------------:|:-----------:|:-------:|:---------:|:---------:|
| **Awaiting Consultant** | — | ✓ | ✓ | ✗ | ✓ |
| **In Progress** | ✗ | — | ✓ | ✓ | ✓ |
| **On Hold** | ✗ | ✓ | — | ✗ | ✓ |
| **Completed** | ✗ | ✗ | ✗ | — (terminal) | ✗ |
| **Cancelled** | ✗ | ✗ | ✗ | ✗ | — (terminal) |

#### 3.1.4 Transition Rules Project

| # | Transition | Trigger | Aktor | Preconditions | Side Effects |
|:-:|------------|---------|-------|---------------|--------------|
| TP1 | (init) → Awaiting Consultant | `createFromHandover` | COO | Handover status = APPROVED; project belum ada untuk handover ini | INSERT projects; UPDATE handovers.status='ASSIGNED_TO_PM'; INSERT `project_status_transitions` (from_status=NULL, to_status='Awaiting Consultant', trigger_source='SYSTEM'); INSERT activity log |
| TP2 | Awaiting Consultant → In Progress | `assignConsultants` / `setConsultants` | PM atau COO (dengan department access) | `handovers.dp_payment_status = 'PAID'`; minimal 1 konsultan valid; user belong ke department handover | UPDATE projects.status; INSERT `project_status_transitions`; INSERT activity log "PROJECT_STARTED" |
| TP3 | In Progress → On Hold | `pauseProject` (Future) | PM atau CEO | Reason wajib diisi | INSERT audit log; notify konsultan |
| TP4 | On Hold → In Progress | `resumeProject` (Future) | PM atau CEO | Reason wajib diisi | INSERT audit log |
| TP5 | In Progress → Completed | `completeProject` | PM project (strict ownership) | SEMUA `project_milestones.status = 'Done'`; project tidak Cancelled | UPDATE projects.status; UPDATE projects.end_date = today; UPDATE `invoice_terms` (term FINAL): set trigger_reference_value='Project completed', trigger_confirmed_by/at; jalankan `syncInvoiceTermLifecycle()`; INSERT activity log "PROJECT_COMPLETED" |
| TP6 | * → Cancelled | `cancelProject` (Future) | CEO atau COO | Reason wajib diisi; project belum Completed | INSERT audit log; notifikasi tim |

> **Catatan implementasi:** TP1, TP2, TP5 sudah terimplementasi di `projects.controller.js`. TP3, TP4, TP6 belum diimplementasi (masuk Phase 2 atau Future Work).

### 3.2 State Machine Milestone

#### 3.2.1 Daftar State Milestone

| State | Definisi | Karakteristik |
|-------|----------|---------------|
| **Pending** | Milestone baru di-spawn (dari task template atau handover), belum dimulai. | Initial state |
| **In Progress** | Owner sedang mengerjakan, progress mulai diupdate. | Active state |
| **Done** | Milestone selesai, completed_at terisi, siap diberi quality_rating oleh PM. | Terminal-ish state (bisa kembali ke In Progress kalau revisi) |
| **Blocked** | Tidak bisa dilanjut karena dependency eksternal (klien belum kirim data, dll). | Blocker state |

#### 3.2.2 Diagram Transisi Milestone

```
              [START]
                 ↓
            ┌─────────┐
            │ Pending │
            └────┬────┘
                 │ start_work
                 ↓
            ┌─────────────┐
       ┌────│ In Progress │────┐
       │    └──────┬──────┘    │
   set_blocked    │       mark_done
       │          │            │
       ↓          │            ↓
   ┌─────────┐    │       ┌──────┐
   │ Blocked │────┘       │ Done │
   └─────────┘ unblock    └──┬───┘
                              │
                  reopen      │ (revisi PM)
              ←───────────────┘
```

#### 3.2.3 Transition Matrix Milestone

| From / To | Pending | In Progress | Done | Blocked |
|-----------|:-------:|:-----------:|:----:|:-------:|
| **Pending** | — | ✓ | ✗ | ✓ |
| **In Progress** | ✗ | — | ✓ | ✓ |
| **Done** | ✗ | ✓ (reopen) | — | ✗ |
| **Blocked** | ✗ | ✓ (unblock) | ✗ | — |

#### 3.2.4 Transition Rules Milestone

| # | Transition | Trigger | Aktor | Preconditions | Side Effects |
|:-:|------------|---------|-------|---------------|--------------|
| TM1 | Pending → In Progress | `updateMilestoneStatus` | Owner milestone ATAU PM project | Milestone belong ke project; **project status NOT IN ('Completed', 'Cancelled')** | INSERT `project_milestone_updates`; KPI Update Compliance recompute |
| TM2 | In Progress → Done | `updateMilestoneStatus` | Owner ATAU PM | **Project status NOT IN ('Completed', 'Cancelled')** | Set `completed_at = NOW()`; INSERT audit; KPI Timeliness + Output Quality input ready |
| TM3 | In Progress → Blocked | `updateMilestoneStatus` | Owner ATAU PM | **Project status NOT IN ('Completed', 'Cancelled')**; note wajib (alasan blocker) | INSERT audit |
| TM4 | Blocked → In Progress | `updateMilestoneStatus` | Owner ATAU PM | **Project status NOT IN ('Completed', 'Cancelled')** | INSERT audit |
| TM5 | Done → In Progress | `updateMilestoneStatus` | PM only | **Project status NOT IN ('Completed', 'Cancelled')** (reopen hanya valid sebelum project terminal) | Clear `completed_at`; INSERT audit "REOPEN" |
| TM6 | (no-op, Done) | `rateMilestone` | PM only | Milestone status = Done; rating 1..5, revisionCount ≥ 0; **project status NOT IN ('Cancelled')** | UPDATE `quality_rating`, `revision_count`; INSERT audit dengan note "Rated N/5" |

> **Cross-Entity Precondition:** Semua transisi milestone (TM1–TM6) wajib mengecek `project.status` parent. Logic ini diimplementasikan di `services/wfms/preconditions.js` — bukan di matrix milestone, karena matrix hanya cover transisi milestone-to-milestone.

---

## 4. FUNCTIONAL REQUIREMENTS

### FR-1: State Storage (Database Level)

**Acceptance Criteria:**
- Kolom `status` pada `projects` bertipe `ENUM('Awaiting Consultant', 'In Progress', 'On Hold', 'Completed', 'Cancelled')` dengan default `'Awaiting Consultant'`.
- Kolom `status` pada `project_milestones` bertipe `ENUM('Pending', 'In Progress', 'Done', 'Blocked')` dengan default `'Pending'`.
- Database menolak insert/update dengan nilai status di luar enum (constraint MySQL).
- Index pada kolom `status` di kedua tabel untuk performa filter.

### FR-2: Audit Trail (Append-Only)

**Acceptance Criteria:**
- Tabel **`project_status_transitions`** mencatat perubahan project.status: `transition_id, project_id, from_status, to_status, triggered_by_user_id, triggered_at, trigger_source (USER|SYSTEM), reason`. (BARU — perlu migration.)
- Tabel **`project_milestone_updates`** (sudah ada) mencatat perubahan milestone.status + rating.
- Setiap transisi sukses harus menghasilkan 1 row baru di tabel audit yang sesuai.
- Audit bersifat append-only — tidak ada endpoint UPDATE atau DELETE.
- Tersedia API endpoint untuk view audit trail per project (gabungan project + milestone history).

### FR-3: Validation Rule Engine (Centralized Service)

**Acceptance Criteria:**
- Folder `backend-development/src/services/wfms/` berisi: `state-definitions.js`, `transition-service.js`, `audit-logger.js`, `preconditions.js`, `authorization.js`.
- Controller (`projects.controller.js`) memanggil service ini, tidak melakukan validasi inline.
- Function `transitionProject()` melakukan 7 langkah berurutan dalam satu transaction: (1) SELECT FOR UPDATE lock → (2) matrix check → (3) authorization → (4) preconditions → (5) execute UPDATE → (6) audit log → (7) side effects.
- Jika validasi gagal, throw `WFMSError` dengan code spesifik (`INVALID_TRANSITION`, `PRECONDITION_FAILED`, `UNAUTHORIZED_ROLE`, `DP_UNPAID`).

### FR-4: Side Effect Integration (Cross-Module)

**Acceptance Criteria:**
- **DP Unpaid Guard:** `transitionProject()` ke `In Progress` membaca `handovers.dp_payment_status`; jika ≠ `'PAID'`, return error `DP_UNPAID` (HTTP 409).
- **Invoice Trigger on Completion:** Saat project → Completed, UPDATE `invoice_terms` term FINAL, jalankan `syncInvoiceTermLifecycle()`.
- **KPI Input:** Milestone fields `completed_at`, `quality_rating`, `revision_count`, dan rekord `project_milestone_updates` menjadi input untuk perhitungan KPI 4 dimensi (Task Completion 35%, Timeliness 25%, Update Compliance 15%, Output Quality 25%).

### FR-5: Frontend State Visualization

**Acceptance Criteria:**
- Komponen `<ProjectStatusBadge />` dan `<MilestoneStatusBadge />` reusable.
- Mapping warna: Project (Awaiting Consultant=abu-abu, In Progress=biru, On Hold=oranye, Completed=hijau, Cancelled=merah); Milestone (Pending=abu-abu, In Progress=biru, Done=hijau, Blocked=merah).
- Filter dropdown "Filter by Status" tersedia di halaman daftar project.
- Tombol action conditional: "Mark Completed" hanya muncul jika syarat terpenuhi.
- Halaman detail project punya tab "Timeline" yang menampilkan gabungan audit trail.

### FR-6: Derived Monitoring Metrics (Bukan State)

**Acceptance Criteria:**
- Dashboard query menghitung "overdue milestone", "upcoming risk milestone", "days waiting DP", "handover pending PM".
- Metrik **tidak disimpan** di kolom DB, dihitung di query repository.
- Ditampilkan di Dashboard CEO, COO, PM, dan Konsultan sebagai alert section.

---

## 5. DERIVED MONITORING METRICS — "AT RISK" Reframed

"At Risk" diposisikan sebagai **derived metric**, bukan state machine state. Rasional:

1. **Tidak ada transisi keluar yang jelas dari "At Risk":** Milestone overdue tetap harus diselesaikan di state aktif (In Progress). Memberinya state terpisah hanya menambah kompleksitas tanpa nilai bisnis.
2. **Push notification berlebihan untuk skala DSK:** Tim kecil (≈10 orang) cukup buka dashboard pagi hari. Alert push (SMTP, queue, retry) tidak proporsional dengan benefit-nya.
3. **Konsistensi data:** State yang disimpan adalah keputusan manusia. Keterlambatan adalah konsekuensi pasif yang bisa dihitung kapan saja dari `target_date` + status saat ini.

### Implementation Query Patterns

| Metric | Query Pattern | Tampil di |
|--------|--------------|-----------|
| Overdue milestone | `target_date < CURDATE() AND status NOT IN ('Done')` | Dashboard PM, COO, Konsultan |
| Upcoming risk (≤ 7 hari) | `target_date BETWEEN CURDATE() AND CURDATE() + 7 DAY AND status NOT IN ('Done')` | Dashboard PM, COO, CEO |
| DP unpaid alert | `handovers.dp_payment_status != 'PAID'` + `DATEDIFF(CURDATE(), approved_at)` | Dashboard COO, CEO |
| Handover pending PM | `handovers.status = 'APPROVED'` + no linked project | Dashboard COO |

---

## 6. SOP DIGITAL (Per Transisi State)

> **Catatan:** Bagian ini menjawab catatan bimbingan dosen *"SOP-nya diperjelasin"*. SOP digital di sini bukan dokumen Word terpisah, tetapi adalah **prosedur baku yang ter-encode di rule engine sistem** — setiap transisi state otomatis menegakkan SOP-nya. Dokumentasi di bawah menjadi rujukan implementasi sekaligus user manual.

### 6.1 SOP Lifecycle Project

#### SOP-P1: Inisiasi Project dari Handover

**Trigger:** Handover APPROVED dan DP klien sudah PAID.

**Prosedur:**
1. COO membuka halaman daftar handover, memilih handover yang APPROVED.
2. COO klik "Create Project" → form muncul dengan data auto-prefill dari handover (klien, scope, service line).
3. COO menetapkan PM untuk project ini dari daftar user dengan role PM.
4. COO klik "Submit" → sistem:
   - Validasi handover masih APPROVED dan belum punya project linked.
   - Create row di `projects` dengan status `Awaiting Consultant`.
   - Update `handovers.status = 'ASSIGNED_TO_PM'`.
   - INSERT row di `project_status_transitions` (from_status=NULL, to_status='Awaiting Consultant', trigger_source='SYSTEM', reason='Project created from handover').
   - INSERT activity log untuk audit cross-module di `handover_activity_logs`.
5. Sistem menampilkan halaman detail project yang baru dibuat dengan banner "Awaiting Consultant Assignment".

**Hasil:** Project terinisialisasi, PM bisa langsung lihat di dashboard-nya, konsultan belum di-assign.

#### SOP-P2: Penugasan Konsultan dan Mulai Pekerjaan

**Trigger:** Project status = `Awaiting Consultant` dan PM siap memulai pekerjaan.

**Prosedur:**
1. PM atau COO membuka detail project.
2. Pilih konsultan dari daftar user dengan role Konsultan yang satu department.
3. Klik "Assign Consultants" → sistem:
   - Validasi DP klien sudah PAID (read `handovers.dp_payment_status`).
   - Jika DP belum PAID → tampilkan error "DP belum dibayar, project tidak dapat dimulai" (HTTP 409, code `DP_UNPAID`).
   - Jika DP PAID → INSERT row di `project_consultants`, UPDATE `projects.status = 'In Progress'`.
   - INSERT row di `project_status_transitions` (from=Awaiting Consultant, to=In Progress).
   - INSERT activity log "PROJECT_STARTED".
4. Sistem menampilkan tim project dengan badge `In Progress`.

**Hasil:** Project aktif, milestone-milestone bisa mulai dikerjakan oleh konsultan.

#### SOP-P3: Penyelesaian Project

**Trigger:** Semua milestone berstatus `Done`, PM siap close project.

**Prosedur:**
1. PM membuka detail project, memverifikasi semua milestone `Done`.
2. PM klik "Mark Completed" (tombol hanya muncul jika semua milestone Done + user = PM project).
3. PM mengisi note (opsional) → konfirmasi.
4. Sistem:
   - Validasi semua milestone berstatus `Done`. Jika ada yang bukan Done → return error `MILESTONES_INCOMPLETE`.
   - Validasi user = `pm_user_id` project. Jika bukan PM → return error `UNAUTHORIZED_ROLE`.
   - UPDATE `projects.status = 'Completed'`, `end_date = CURDATE()`.
   - INSERT row di `project_status_transitions` (from=In Progress, to=Completed).
   - **Side effect: Trigger Final Invoice:**
     - UPDATE `invoice_terms` WHERE term_type='FINAL' AND status='DRAFT': set `trigger_reference_value='Project completed', trigger_confirmed_by, trigger_confirmed_at`.
     - Jalankan `syncInvoiceTermLifecycle()` untuk promosi term FINAL ke READY_TO_ISSUE jika previous terms sudah PAID.
   - INSERT activity log "PROJECT_COMPLETED".
5. Sistem menampilkan banner "Project Completed" dengan timestamp dan PM name.

**Hasil:** Project closed, final invoice masuk antrian penerbitan, KPI konsultan dihitung dari data milestone.

### 6.2 SOP Lifecycle Milestone

#### SOP-M1: Update Status Milestone

**Trigger:** Konsultan (owner) atau PM ingin mengubah status milestone.

**Prosedur:**
1. Owner milestone (atau PM) membuka detail project, tab "Milestones".
2. Klik milestone yang akan diupdate → modal/form muncul.
3. Pilih status baru (Pending, In Progress, Done, Blocked).
4. Isi note (wajib jika status baru = Blocked, opsional untuk lainnya).
5. Submit → sistem:
   - Validasi transisi allowed di matrix (lihat bagian 3.2.3).
   - Validasi otorisasi: user = owner_user_id ATAU user = pm_user_id project.
   - Validasi project tidak Completed/Cancelled (kecuali untuk reopen oleh PM).
   - Jika status baru = Done: SET `completed_at = NOW()`.
   - Jika status baru = In Progress (reopen): CLEAR `completed_at`.
   - INSERT row di `project_milestone_updates` (audit).
6. Sistem refresh halaman dengan badge milestone status baru.

**Hasil:** Status milestone terupdate, audit trail tercatat, KPI input siap dihitung.

#### SOP-M2: Rating Quality Milestone oleh PM

**Trigger:** Milestone berstatus `Done`, PM ingin memberi rating kualitas.

**Prosedur:**
1. PM membuka detail project, tab "Milestones", pilih milestone status Done.
2. Klik "Rate Quality" (tombol hanya muncul jika status=Done dan user=PM project).
3. PM memberi rating 1–5, mencatat `revision_count` (jumlah revisi yang diminta), note (opsional).
4. Submit → sistem:
   - Validasi rating 1..5, revision_count ≥ 0.
   - UPDATE `project_milestones.quality_rating`, `revision_count`.
   - INSERT row di `project_milestone_updates` dengan note "Rated N/5".
5. Sistem menampilkan badge rating bintang di milestone.

**Hasil:** Quality rating tercatat, menjadi input dimensi KPI Output Quality (bobot 25%).

#### SOP-M3: Eskalasi Milestone Overdue (Passive via Dashboard)

**Trigger:** Milestone `target_date < CURDATE()` dan `status != 'Done'`.

**Prosedur:**
1. PM/COO/CEO membuka dashboard pagi hari.
2. Section "Overdue Milestones" otomatis menampilkan milestone yang overdue (derived metric, lihat bagian 5).
3. Setiap row menunjukkan: nama milestone, project, owner, target_date, jumlah hari lewat.
4. PM klik milestone → diarahkan ke detail milestone untuk koordinasi dengan owner.
5. Owner update status milestone (mengikuti SOP-M1) — kemungkinan ke Blocked (jika nunggu klien) atau Done (jika selesai).

**Hasil:** Eskalasi terjadi via dashboard pull-based, tanpa cron push, tanpa email blast.

---

## 7. MAPPING WORKFLOW MANUAL → WORKFLOW WFMS

> **Catatan:** Bagian ini menjadi rujukan untuk BAB 4.1.3 (Perbandingan Existing dan Future) skripsi. Tabel di bawah memperlihatkan setiap aktivitas manual eksisting dipetakan ke implementasi WFMS digital, lengkap dengan dampak transparansinya.

### 7.1 Lifecycle Project (Level Bisnis)

| # | Aktivitas | Workflow Manual (Eksisting) | Workflow WFMS (Future) | Improvement |
|:-:|-----------|------------------------------|-------------------------|-------------|
| 1 | Inisiasi project | COO informasi via WhatsApp ke PM, kirim file Excel scope | COO klik "Create Project" dari handover APPROVED, status = `Awaiting Consultant` di sistem | Single source of truth; auto-link ke handover |
| 2 | Penugasan konsultan | PM kirim pesan ke konsultan, catat di Excel pribadi | PM/COO assign konsultan di sistem, status = `In Progress` jika DP PAID | DP unpaid guard otomatis; konsultan langsung lihat di dashboard |
| 3 | Pencatatan progres milestone | Konsultan kirim update via WhatsApp/email; PM input ke Excel | Konsultan update status milestone langsung di sistem (Pending → In Progress → Done) | Audit trail otomatis; tidak ada lost message |
| 4 | Penanganan blocker | Diskusi informal di WhatsApp group | Konsultan set milestone ke `Blocked` dengan note alasan; PM diberitahu via dashboard | Blocker tertelusur; eskalasi lebih cepat |
| 5 | Pause/resume project | Kesepakatan lisan, tidak terdokumentasi | PM/CEO trigger transisi `In Progress → On Hold` dengan reason wajib | Pause tertelusur; auditable untuk billing |
| 6 | Penilaian kualitas milestone | Tidak ada pencatatan kualitas formal | PM rate milestone Done dengan score 1–5 + revision_count | Kualitas terukur; jadi input KPI Output Quality |
| 7 | Penyelesaian project | PM kirim email ke COO, COO buat invoice manual | PM klik "Mark Completed" → otomatis trigger final invoice | Invoice trigger otomatis; tidak ada lost project |
| 8 | Pembatalan project | Pemberitahuan via email/WhatsApp, tidak terdokumentasi | CEO/COO trigger `* → Cancelled` dengan reason wajib | Cancel tertelusur; alasan terdokumentasi |

### 7.2 Lifecycle Milestone (Level Eksekusi)

| # | Aktivitas | Workflow Manual (Eksisting) | Workflow WFMS (Future) | Improvement |
|:-:|-----------|------------------------------|-------------------------|-------------|
| 1 | Mulai mengerjakan milestone | Konsultan mulai kerja, tidak ada pencatatan formal | Konsultan trigger `Pending → In Progress` di sistem | Start time tercatat; KPI Update Compliance ter-input |
| 2 | Menyelesaikan milestone | Konsultan kirim file ke PM via email | Konsultan trigger `In Progress → Done`; `completed_at` auto-set | Completion time tercatat; KPI Timeliness ter-hitung |
| 3 | Revisi milestone selesai | PM minta revisi via chat; revisi ulang tanpa pencatatan | PM trigger `Done → In Progress` (reopen); `revision_count` ter-track | Revisi tertelusur; jadi indikator kualitas |
| 4 | Identifikasi milestone overdue | Manual scan Excel; sering terlewat | Dashboard auto-flag via derived metric `target_date < today AND status != 'Done'` | Deteksi otomatis tanpa intervensi user |

### 7.3 Audit & Akuntabilitas

| Aspek | Sebelum (Manual) | Sesudah (WFMS) |
|-------|------------------|-----------------|
| Catatan perubahan status | Tidak ada / tersebar di chat | Tabel `project_status_transitions` + `project_milestone_updates` append-only |
| Siapa yang mengubah | Sering tidak diketahui | `triggered_by_user_id` + `name_snapshot` tercatat |
| Kapan diubah | Estimasi dari timestamp chat | `triggered_at` presisi detik |
| Alasan perubahan | Tergantung memori | `reason` / `note` wajib untuk transisi tertentu |

---

## 8. DATABASE SCHEMA

### 8.1 Tabel `projects` (sudah ada)

```sql
CREATE TABLE projects (
  project_id       BIGINT        PRIMARY KEY AUTO_INCREMENT,
  project_code     VARCHAR(64)   NOT NULL UNIQUE,
  handover_id      BIGINT        NOT NULL UNIQUE,
  client           VARCHAR(255)  NOT NULL,
  project_name     VARCHAR(255)  NOT NULL,
  service_line     ENUM('Transfer Pricing', 'Tax', 'Advisory', 'Audit') NOT NULL,
  status           ENUM(
    'Awaiting Consultant',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled'
  ) NOT NULL DEFAULT 'Awaiting Consultant',
  pm_user_id       INT           NULL,
  pm_name_snapshot VARCHAR(128)  NULL,
  start_date       DATE          NULL,
  end_date         DATE          NULL,
  created_by       INT           NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_projects_pm
    FOREIGN KEY (pm_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_projects_status (status),
  INDEX idx_projects_service_line (service_line),
  INDEX idx_projects_pm (pm_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 8.2 Tabel `project_milestones` (sudah ada)

```sql
CREATE TABLE project_milestones (
  milestone_id     BIGINT        PRIMARY KEY AUTO_INCREMENT,
  project_id       BIGINT        NOT NULL,
  title            VARCHAR(255)  NOT NULL,
  notes            TEXT          NULL,
  target_date      DATE          NOT NULL,
  status           ENUM('Pending', 'In Progress', 'Done', 'Blocked') NOT NULL DEFAULT 'Pending',
  owner_user_id    INT           NULL,
  owner_name_snapshot VARCHAR(128) NULL,
  weight           INT           NOT NULL DEFAULT 10,
  phase            ENUM('Initiation', 'Analysis', 'Core Work', 'QC', 'Delivery') NULL,
  sequence_no      INT           NOT NULL DEFAULT 1,
  completed_at     DATETIME      NULL,
  quality_rating   TINYINT       NULL,
  revision_count   INT           NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_milestones_project
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_quality_rating
    CHECK (quality_rating IS NULL OR (quality_rating BETWEEN 1 AND 5)),
  INDEX idx_project_milestones_project (project_id),
  INDEX idx_project_milestones_status (status),
  INDEX idx_project_milestones_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 8.3 Tabel `project_milestone_updates` (sudah ada — audit milestone)

```sql
CREATE TABLE project_milestone_updates (
  update_id        BIGINT        PRIMARY KEY AUTO_INCREMENT,
  milestone_id     BIGINT        NOT NULL,
  by_user_id       INT           NULL,
  by_name_snapshot VARCHAR(128)  NULL,
  from_status      ENUM('Pending', 'In Progress', 'Done', 'Blocked') NOT NULL,
  to_status        ENUM('Pending', 'In Progress', 'Done', 'Blocked') NOT NULL,
  note             TEXT          NULL,
  at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_milestone_updates_milestone
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(milestone_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_project_milestone_updates_milestone (milestone_id),
  INDEX idx_project_milestone_updates_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 8.4 Tabel `project_status_transitions` (BARU — perlu migration)

```sql
CREATE TABLE project_status_transitions (
  transition_id    BIGINT        PRIMARY KEY AUTO_INCREMENT,
  project_id       BIGINT        NOT NULL,
  -- from_status NULLABLE untuk log creation event (initial transition dari "tidak ada" ke 'Awaiting Consultant').
  -- Setelah row creation, semua transisi berikutnya wajib punya from_status non-NULL.
  from_status      ENUM('Awaiting Consultant', 'In Progress', 'On Hold', 'Completed', 'Cancelled') NULL,
  to_status        ENUM('Awaiting Consultant', 'In Progress', 'On Hold', 'Completed', 'Cancelled') NOT NULL,
  triggered_by_user_id INT       NULL,
  triggered_by_name_snapshot VARCHAR(128) NULL,
  trigger_source   ENUM('USER', 'SYSTEM') NOT NULL DEFAULT 'USER',
  reason           TEXT          NULL,
  triggered_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_status_transitions_project
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_project_status_transitions_user
    FOREIGN KEY (triggered_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_project_status_transitions_project (project_id),
  INDEX idx_project_status_transitions_at (triggered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> **Catatan design — Creation Logging:** Initial creation event dilog dengan
> `from_status = NULL` (representasi "tidak ada state sebelumnya"). Pola ini
> mengikuti konvensi state machine umum (Camunda, AASM) yang mengakui
> *initial transition* sebagai transisi resmi. Audit trail menjadi lengkap
> dari birth-to-death lifecycle project, dan UI Timeline cukup handle
> single NULL case di first event.
>
> **Backfill untuk existing projects:** Migration akan menginsert 1 row
> creation per project yang sudah ada di tabel `projects` sebelum migration
> dijalankan (`from_status=NULL, to_status='Awaiting Consultant'`,
> `trigger_source='SYSTEM'`, `reason='Backfill dari migration'`,
> `triggered_at=projects.created_at`,
> `triggered_by_user_id=projects.created_by`).

---

## 9. API ENDPOINTS

### 9.1 Project Lifecycle Endpoints

| Method | Endpoint | Aktor | Tujuan |
|--------|----------|-------|--------|
| POST | `/api/projects/from-handover` | COO | Buat project dari handover APPROVED |
| POST | `/api/projects/:projectId/consultants` | PM/COO | Assign konsultan (TP2) |
| PUT | `/api/projects/:projectId/consultants` | PM/COO | Replace tim konsultan |
| POST | `/api/projects/:projectId/complete` | PM | Transisi In Progress → Completed (TP5) |
| GET | `/api/projects/:projectId/audit-trail` | All authorized | Lihat history (BARU) |

#### Contoh Response `/complete`

**Success 200:**
```json
{
  "success": true,
  "data": {
    "project": { "project_id": 1, "status": "Completed" },
    "triggeredInvoiceTerms": 1
  }
}
```

**Error 409 (precondition):**
```json
{
  "success": false,
  "message": "Masih ada 2 dari 5 milestone yang belum Done.",
  "code": "MILESTONES_INCOMPLETE"
}
```

**Possible error codes:**
- `INVALID_TRANSITION` — transisi tidak ada di matrix
- `PRECONDITION_FAILED` / `MILESTONES_INCOMPLETE` — preconditions tidak terpenuhi
- `UNAUTHORIZED_ROLE` — role/ownership tidak memenuhi
- `DP_UNPAID` — DP handover belum dibayar

### 9.2 Milestone Lifecycle Endpoints

| Method | Endpoint | Aktor | Tujuan |
|--------|----------|-------|--------|
| PATCH | `/api/projects/:projectId/milestones/:milestoneId/status` | Owner/PM | Update status milestone |
| PATCH | `/api/projects/:projectId/milestones/:milestoneId/rate` | PM | Rate milestone Done |

---

## 10. BACKEND IMPLEMENTATION GUIDANCE

### 10.1 Struktur Folder

```
backend-development/src/
├── services/
│   └── wfms/
│       ├── state-definitions.js     ← Enum + transition matrix (konstanta)
│       ├── transition-service.js    ← Core: transitionProject(), transitionMilestone()
│       ├── audit-logger.js          ← Helper INSERT audit log
│       ├── preconditions.js         ← Helper cek DP paid, all milestone done
│       └── authorization.js         ← Helper cek role/ownership
├── controllers/
│   └── projects.controller.js       ← Tipis: parse req, panggil service, response
├── repositories/
│   └── (existing)
├── routes/
│   └── projects.routes.js
└── db/migrations/
    └── 2026-05-29-016-project-status-transitions.sql  ← BARU
```

### 10.2 Pseudocode Core Function

```javascript
// src/services/wfms/transition-service.js

async function transitionProject(conn, { projectId, toStatus, userId, reason, options = {} }) {
  // STEP 1: SELECT FOR UPDATE lock (prevent race condition)
  const [[project]] = await conn.query(
    `SELECT p.project_id, p.status, p.pm_user_id, p.handover_id,
            h.dp_payment_status
     FROM projects p
     INNER JOIN handovers h ON h.handover_id = p.handover_id
     WHERE p.project_id = ? FOR UPDATE`,
    [projectId]
  );
  if (!project) throw new WFMSError('NOT_FOUND', 'Project tidak ditemukan');

  const fromStatus = project.status;
  if (fromStatus === toStatus) return { noop: true, project };  // idempotent

  // STEP 2: Matrix check (allowed transition?)
  if (!isAllowedTransition('project', fromStatus, toStatus)) {
    throw new WFMSError('INVALID_TRANSITION',
      `Transisi dari ${fromStatus} ke ${toStatus} tidak diperbolehkan`);
  }

  // STEP 3: Authorization (role + ownership)
  const user = await getUser(conn, userId);
  if (!isAuthorized('project', user, project, fromStatus, toStatus)) {
    throw new WFMSError('UNAUTHORIZED_ROLE', `Role ${user.role} tidak boleh transisi ini`);
  }

  // STEP 4: Preconditions (DP paid, all milestone done, etc.)
  const pre = await checkPreconditions(conn, 'project', project, toStatus, options);
  if (!pre.passed) throw new WFMSError(pre.code || 'PRECONDITION_FAILED', pre.message);

  // STEP 5: Execute UPDATE
  await conn.query(
    `UPDATE projects SET status = ?, updated_at = NOW() WHERE project_id = ?`,
    [toStatus, projectId]
  );

  // STEP 6: Audit log
  await logProjectTransition(conn, {
    projectId, fromStatus, toStatus, userId,
    triggerSource: options.triggerSource || 'USER', reason
  });

  // STEP 7: Side effects (delegated)
  if (toStatus === 'Completed') {
    await triggerFinalInvoice(conn, projectId, userId);
  }
  if (toStatus === 'In Progress' && fromStatus === 'Awaiting Consultant') {
    await logActivity(conn, project.handover_id, 'PROJECT_STARTED', userId);
  }

  return { noop: false, project: { ...project, status: toStatus } };
}
```

### 10.3 Controller Refactor Pattern

Setelah refactor, controller cukup tipis (~30 baris):

```javascript
const completeProject = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  const actorUserId = getUserIdFromRequest(req, res);
  const { note } = req.body || {};

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await transitionProject(conn, {
      projectId, toStatus: 'Completed', userId: actorUserId, reason: note
    });
    await conn.commit();

    const detail = await loadProjectDetailById(pool, projectId);
    return res.status(200).json({
      success: true,
      data: { project: detail, triggeredInvoiceTerms: result.triggeredInvoiceTerms }
    });
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    if (e instanceof WFMSError) {
      const httpStatus = e.code === 'NOT_FOUND' ? 404
                       : e.code === 'UNAUTHORIZED_ROLE' ? 403
                       : 409;
      return res.status(httpStatus).json({ success: false, code: e.code, message: e.message });
    }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};
```

---

## 11. FRONTEND IMPLEMENTATION GUIDANCE

### 11.1 Komponen StatusBadge

Frontend sudah punya **single source of truth** untuk warna status di
`features/projects/types/project.types.ts`:

```ts
export const projectStatusStyleMap: Record<ProjectStatus, string> = {
  'Awaiting Consultant': 'bg-amber-100 text-[#a16207]',
  'In Progress': 'bg-[#d5e3fc] text-[#003c90]',
  'On Hold': 'bg-[#e0e3e5] text-[#434653]',
  Completed: 'bg-[#006544]/15 text-[#006544]',
  Cancelled: 'bg-orange-100 text-[#c2410c]'
};

export const projectMilestoneStatusStyleMap: Record<ProjectMilestoneStatus, string> = {
  Pending: 'bg-[#e0e3e5] text-[#434653]',
  'In Progress': 'bg-[#d5e3fc] text-[#003c90]',
  Done: 'bg-[#006544]/15 text-[#006544]',
  Blocked: 'bg-orange-100 text-[#c2410c]'
};
```

Komponen badge tinggal konsumsi map ini, ditempatkan di
`features/projects/components/shared/`:

```tsx
import { projectStatusStyleMap, type ProjectStatus } from '../../types/project.types';

export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${projectStatusStyleMap[status]}`}>
    {status}
  </span>
);
```

### 11.2 Conditional Action Button

Naming convention frontend = **camelCase**, akses PM via `project.pm?.id`
(bukan `project.pmUserId`):

```tsx
const canMarkCompleted =
  project.status === 'In Progress' &&
  currentUser.id === project.pm?.id &&
  project.milestones.every((m) => m.status === 'Done');

const canRateMilestone = (m: ProjectMilestone) =>
  m.status === 'Done' && currentUser.id === project.pm?.id;
```

### 11.3 Timeline View

Tab "Timeline" menampilkan gabungan audit trail kronologis. Fetch dari `GET /api/projects/:id/audit-trail`.

---

## 12. ACCEPTANCE CRITERIA (Testing Scenarios)

| # | Skenario | Kondisi Awal | Tindakan | Hasil yang Diharapkan |
|:-:|----------|--------------|----------|------------------------|
| TC1 | Valid Project Transition | Project Awaiting Consultant, DP PAID | COO assign konsultan | Status → In Progress, audit row tercatat |
| TC2 | DP Unpaid Block | Project Awaiting Consultant, DP belum PAID | COO assign konsultan | HTTP 409 `DP_UNPAID`, no change, no audit |
| TC3 | Invalid Transition | Project Awaiting Consultant | POST `/complete` | HTTP 409 `INVALID_TRANSITION` |
| TC4 | Precondition Check | Project In Progress, ada milestone Pending | PM POST `/complete` | HTTP 409 `MILESTONES_INCOMPLETE` |
| TC5 | Authorization | Project In Progress, PM=A | User B (konsultan) POST `/complete` | HTTP 403 `UNAUTHORIZED_ROLE` |
| TC6 | Side Effect Invoice | All milestones Done, term FINAL DRAFT | PM POST `/complete` | Status=Completed, invoice ter-trigger |
| TC7 | Milestone Reopen | Milestone Done | PM PATCH ke In Progress | Status=In Progress, completed_at=NULL, audit baru |
| TC8 | Derived Metric Overdue | Milestone target=kemarin, status In Progress | PM buka dashboard | Muncul di "Overdue", status DB tetap In Progress |
| TC9 | Audit Immutability | Ada entry audit | UPDATE/DELETE via API | Tidak mungkin (no endpoint exposed) |

---

## 13. IMPLEMENTATION PHASES

### Phase 1 — Core WFMS Reality (sudah selesai)

- Tabel `projects`, `project_milestones`, `project_milestone_updates` dengan ENUM.
- Endpoint `createFromHandover`, `assignConsultants`, `setConsultants`, `updateMilestoneStatus`, `rateMilestone`, `completeProject`.
- DP unpaid guard, invoice trigger pada completion.
- Frontend: project list, project detail, milestone update, dashboard per role dengan derived overdue metric.

**Output Phase 1:** Sistem berjalan, dashboard menunjukkan state + overdue metric, audit milestone lengkap.

### Phase 2 — WFMS Centralization & Project Audit Trail (rekomendasi)

⏱️ Estimasi: 1-2 hari kerja

- Migration `project_status_transitions`.
- Folder `services/wfms/` dengan transition service, audit logger, preconditions.
- Refactor controller untuk delegate ke service.
- Endpoint `GET /api/projects/:id/audit-trail`.
- Komponen `<ProjectStatusBadge />`, `<MilestoneStatusBadge />`.
- Isi tab "Timeline" dengan gabungan audit trail.

**Output Phase 2:** Penguji bisa ditunjuk satu folder `services/wfms/` sebagai modul WFMS. Audit trail project + milestone lengkap, screenshot-able.

### Phase 3 — Polish (optional)

⏱️ Estimasi: 1 hari kerja

- Endpoint `pauseProject`, `resumeProject`, `cancelProject` (transisi TP3, TP4, TP6).
- Filter dropdown "Filter by Status" di project list dan dashboard.
- Export audit trail ke PDF.

### Phase 4 — Future Work (di luar scope skripsi)

- Cron job push-based At Risk detection + email notification.
- Multi-step approval chain.
- Versioning workflow definition.

---

## 14. REFERENCES KE SKRIPSI

### 14.1 Mapping PRD → BAB Skripsi

| Bagian Skripsi | Konten yang Merujuk PRD |
|----------------|--------------------------|
| **BAB 1.2 Rumusan Masalah** | Frasa "berbasis workflow" → didefinisikan konkret di PRD bagian 3 |
| **BAB 2.1.5 WfMS** | Fondasi teoritis dari implementasi di PRD ini |
| **BAB 3.2.3 Perancangan Sistem** | Narasi tentang perancangan workflow merujuk ke State Machine Definition (bagian 3) + SOP Digital (bagian 6) |
| **BAB 3.2.4 Implementasi** | Narasi tentang implementasi workflow merujuk ke Backend Implementation Guidance (bagian 10) |
| **BAB 4.1.1 Proses Bisnis Eksisting** | Kolom "Workflow Manual" pada Tabel Mapping (bagian 7) |
| **BAB 4.1.2 Proses Bisnis Future** | Kolom "Workflow WFMS" pada Tabel Mapping (bagian 7) |
| **BAB 4.1.3 Perbandingan Existing vs Future** | Tabel Mapping lengkap (bagian 7) |
| **BAB 4.2 Perancangan Sistem** | State Diagram (3.1.2, 3.2.2), Transition Matrix (3.1.3, 3.2.3), Transition Rules (3.1.4, 3.2.4), Database Schema (8), API Design (9), Derived Metric (5), SOP Digital (6) |
| **BAB 4.3 Implementasi Sistem** | Screenshot kode dari Backend Implementation (10), Screenshot UI dari Frontend Implementation (11) |
| **BAB 4.4 Pengujian** | Acceptance Criteria (12) menjadi test scenarios |

### 14.2 Pemenuhan Catatan Bimbingan Dosen

| Catatan Dosen | Pemenuhan di PRD |
|---------------|-------------------|
| "WFMS itu kamu implementasikan atau cuma basa-basi?" | Bagian 3 (state machine konkret) + bagian 10 (kode implementasi) |
| "Di metodologi BAB 3 harus jelas bagaimana membangun workflow-nya" | Narasi BAB 3.2.3 merujuk ke State Machine Definition + SOP Digital |
| "SOP-nya diperjelasin" | **Bagian 6 SOP Digital** dengan tabel prosedur per transisi |
| "Pembentukan workflow ada di tahapan yang mana?" | BAB 3.2.3 (perancangan) + BAB 3.2.4 (implementasi) merujuk eksplisit ke bagian 3, 6, 10 PRD |

---

## 15. RISK & MITIGATION

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|:------------:|:------:|----------|
| Race condition saat transisi paralel | Rendah | Tinggi | DB transaction + SELECT FOR UPDATE (sudah diimplementasi) |
| Validasi inline di controller terlewat | Sedang | Sedang | Refactor ke `services/wfms/` (Phase 2) |
| Workflow definition perlu berubah per service line | Sedang | Rendah | Konstanta mudah di-edit di `state-definitions.js` |
| Penguji minta cron At Risk detection | Sedang | Sedang | Defend: passive detection via dashboard query cocok untuk skala DSK; lihat Phase 4 sebagai future work |
| Penguji minta WFMS framework formal (Camunda dll) | Rendah | Sedang | Defend: custom rule engine cocok dengan skala 100 proyek/tahun; framework eksternal over-engineering |
| Inkonsistensi state machine antara skripsi dan sistem | Rendah | **Tinggi** | Selalu single source of truth = PRD ini; update skripsi setiap kali PRD berubah |

---

## 16. APPENDIX

### A. Glossary

| Term | Definisi |
|------|----------|
| **WFMS** | Workflow Management System — perangkat lunak yang mendefinisikan, mengoordinasikan, dan memantau alur kerja proses bisnis |
| **State Machine** | Model matematis yang menggambarkan entitas dengan state terbatas dan transisi antar state |
| **State Transition** | Perubahan state dari satu kondisi ke kondisi lain karena suatu event |
| **Audit Trail** | Catatan kronologis aktivitas dalam sistem untuk keperluan akuntabilitas |
| **Precondition** | Kondisi yang harus dipenuhi sebelum suatu transisi state dapat dieksekusi |
| **Side Effect** | Aksi otomatis yang dijalankan sistem sebagai konsekuensi suatu transisi state |
| **Derived Metric** | Nilai yang dihitung dari data lain saat runtime (query) — tidak disimpan di DB |
| **SOP Digital** | Prosedur operasional baku yang ter-encode di rule engine sistem; bukan dokumen Word terpisah |

### B. Quick Reference Card untuk Sidang

Saat ditanya **"Mana WFMS-nya?"**, tunjukkan 9 bukti berikut:

1. **State Machine Definition** → bagian 3 PRD (project & milestone enum + matrix + rules)
2. **SOP Digital** → bagian 6 PRD (prosedur lengkap per transisi)
3. **Workflow Mapping Manual → Digital** → bagian 7 PRD (8 + 4 row tabel komparasi)
4. **Database schema dengan ENUM** → bagian 8 PRD (`projects.status`, `project_milestones.status`)
5. **Audit Trail** → bagian 8 PRD (`project_status_transitions` + `project_milestone_updates`)
6. **Rule Engine** → bagian 10 PRD (folder `services/wfms/transition-service.js`)
7. **Side Effect Integration** → bagian 4 FR-4 (trigger invoice di `completeProject`, DP unpaid guard di `assignConsultants`)
8. **Visualization** → bagian 11 PRD (komponen `<ProjectStatusBadge />`, `<MilestoneStatusBadge />`, halaman Timeline tab)
9. **Derived Monitoring** → bagian 5 PRD (dashboard query overdue/upcoming di `dashboard-*.repo.js`)

### C. Pertanyaan Defensif yang Mungkin Muncul

**Q1: Kenapa "At Risk" bukan state machine state?**
A: Tidak ada transisi keluar yang jelas dari "At Risk" — milestone overdue tetap dikerjakan di state "In Progress" sambil di-flag di dashboard. Memberinya state terpisah hanya menambah kompleksitas tanpa nilai bisnis. Lihat bagian 5 untuk detail rasional.

**Q2: Kenapa tidak pakai cron untuk auto-detection?**
A: Skala DSK (≈100 proyek/tahun, tim ≈10 orang) tidak butuh push-based alerting. Pull-based via dashboard cukup, dan menghindari overhead SMTP/queue/retry. Cron dimasukkan ke Future Work (Phase 4) kalau scale bertumbuh.

**Q3: Kenapa 5 state project tapi 4 state milestone?**
A: State project mencerminkan lifecycle bisnis penuh (assign → kerja → pause/batal → selesai). State milestone lebih granular fokus ke task-level execution (mulai → kerja → blokir → selesai). Beda level granularity, beda kebutuhan state.

**Q4: Bagaimana memastikan audit trail tidak bisa dimanipulasi?**
A: Tidak ada endpoint API yang exposed untuk UPDATE/DELETE row audit. Append-only by design. Untuk security level lebih tinggi (forensic), bisa tambah cryptographic chain (Future Work).

**Q5: SOP digital di mana letaknya?**
A: SOP digital di-encode langsung di rule engine `services/wfms/transition-service.js`, bukan dokumen Word terpisah. Setiap transisi otomatis menegakkan SOP-nya: validasi prasyarat, otorisasi, audit log, dan side effect. Dokumentasi prosa untuk pengguna ada di bagian 6 PRD ini.

**Q6: Bagaimana cara membuktikan workflow ini bukan basa-basi?**
A: Tunjukkan tiga hal: (1) Tabel `projects.status` dengan ENUM (database level constraint), (2) Folder `services/wfms/` dengan code transition service yang validasi 4 lapis (matrix, preconditions, authorization, atomic transaction), (3) Tabel `project_status_transitions` berisi data audit dari demo aplikasi yang real-time tercatat.

**Q7: Apa pembeda implementasi ini dari sekadar CRUD biasa?**
A: CRUD biasa: `UPDATE projects SET status=? WHERE id=?` — terima nilai apa saja. WFMS implementasi ini: setiap perubahan status WAJIB lewat `transitionProject()` yang melakukan **7 langkah berurutan** (1: SELECT FOR UPDATE lock, 2: matrix check, 3: authorization, 4: preconditions, 5: execute UPDATE, 6: audit log, 7: side effect). Penguji bisa langsung lihat code-nya untuk membandingkan.

---

**END OF PRD (FINAL v1.2)**
