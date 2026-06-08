# PRD (Revisi): Workflow Management System (WFMS)
## Modul Monitoring Proyek TP-Doc — PT DSK Global Konsultama

> **Catatan revisi:** Dokumen ini menyelaraskan PRD WFMS dengan implementasi
> nyata pada sistem Corventra (monorepo `corventra`, modul `backend-development`
> dan `frontend-development`). Perubahan utama dari versi 1.0:
>
> 1. State machine project diperluas menjadi 5 status sesuai kebutuhan
>    operasional DSK (handle pause & cancel scenario), bukan 4 status idealis.
> 2. State machine milestone dibedakan dari state project — milestone pakai
>    enum `(Pending, In Progress, Done, Blocked)`.
> 3. "At Risk" **bukan** state machine state, melainkan **derived monitoring
>    metric** yang dihitung di runtime (dashboard query) — bukan disimpan di DB.
> 4. Validation rule engine **terpusat** di `services/wfms/` (sebelumnya
>    tersebar di controller).
> 5. Audit trail dipecah dua: `project_status_transitions` (level project) +
>    `project_milestone_updates` (level milestone).
> 6. Cron job otomatis tidak diimplementasikan pada Phase 1–3; overdue
>    detection cukup via dashboard query (passive). Cron dimasukkan ke
>    **Future Work** (Phase 4).
>
> Rasional perubahan: skala DSK (≈100 proyek/tahun, tim kecil) tidak butuh
> push-based alerting; dashboard pull-based sudah cukup dan menghindari
> kompleksitas SMTP/scheduling.

---

| Meta | Detail |
|------|--------|
| Document | Product Requirements Document (Revisi 1.1) |
| Modul | Workflow Management System (WFMS) |
| Sistem | Aplikasi Monitoring Proyek dan Penilaian KPI (Corventra) |
| Studi Kasus | PT DSK Global Konsultama — Layanan Transfer Pricing Documentation (TP-Doc) |
| Tech Stack | React 19 + Vite 8 + TypeScript + Tailwind v4 (FE) / Node + Express 5 + MySQL 8 (BE) |
| Versi | 1.1 (selaras dengan implementasi) |
| Author | Muhamad Faried (NIM 2207412041) |
| Pembimbing | (Nama dosen pembimbing) |

---

## 1. OVERVIEW

### 1.1 Latar Belakang

Monitoring proyek TP-Doc di PT DSK Global Konsultama saat ini dilakukan secara
manual menggunakan spreadsheet Excel, WhatsApp, dan email yang tidak
terintegrasi. Status pekerjaan disepakati informal antar peran (CEO, COO, PM,
Konsultan), sehingga tidak ada single source of truth untuk progres proyek,
tidak ada audit trail perubahan status, dan deteksi keterlambatan baru terjadi
setelah masalah eskalasi.

### 1.2 Tujuan Modul WFMS

Modul WFMS bertanggung jawab untuk:
1. Mendefinisikan state pekerjaan yang baku dan tertelusur.
2. Mengendalikan transisi state berdasarkan rule yang telah ditetapkan.
3. Mencatat audit trail setiap perubahan state beserta aktor dan waktu.
4. Menjalankan side effect otomatis (trigger final invoice saat completion,
   block transition saat DP unpaid) tanpa intervensi manual.
5. Menyediakan visualisasi state yang konsisten antara backend dan frontend.
6. Menyediakan derived monitoring metric (overdue, days waiting) untuk
   keterlambatan tanpa mengubah state di DB.

### 1.3 Posisi dalam Sistem

WFMS adalah **lapisan kendali (rule engine)** yang berada di antara user
action (frontend) dan data persistence (database). Setiap perubahan state
proyek dan milestone **harus melalui WFMS service**, tidak boleh langsung
`UPDATE` ke database.

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

- State machine untuk entitas `projects` (5 status) dan `project_milestones`
  (4 status).
- Validation rule untuk setiap transisi state (matrix, preconditions,
  authorization role-based).
- Audit trail dengan dua tabel: `project_status_transitions` (project-level)
  dan `project_milestone_updates` (milestone-level), keduanya append-only.
- Authorization check berdasarkan role (CEO, COO, PM, Konsultan, Superadmin)
  via JWT permissions array + ownership check (PM vs owner).
- Side effect otomatis terintegrasi: DP unpaid guard, final invoice trigger,
  KPI input columns.
- RESTful API endpoint untuk transisi state.
- Frontend component untuk visualisasi state (badge, filter, conditional
  button).
- Derived monitoring metric di dashboard query: overdue milestone, days
  waiting DP, days pending handover.

### 2.2 Out of Scope (sengaja tidak diimplementasi)

- **Push-based cron At Risk detection** — diganti dengan passive overdue
  detection di dashboard query. Lihat Future Work (Phase 4).
- **Email / SMS notification** — sistem cukup in-app dashboard alert. Push
  notification masuk Future Work.
- State machine framework eksternal (Camunda, Airflow) — pakai custom
  implementation per service layer.
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

> **Catatan:** State asli pada PRD versi 1.0 (Planning, On Track, At Risk,
> Completed) tidak dipakai. Rasional:
> - "Planning" tidak relevan — project lahir dari handover yang sudah
>   final-scoped, sehingga fase planning ada di modul `handover`, bukan
>   `projects`.
> - "At Risk" bukan state karena tidak ada transisi keluar yang jelas dari
>   "At Risk" — di reality, milestone overdue tetap perlu diselesaikan dalam
>   state "In Progress" sambil di-flag di dashboard. Lihat bagian 5.
> - "On Hold" dan "Cancelled" diperlukan untuk handle skenario operasional
>   nyata (klien minta delay, kontrak batal di tengah jalan).

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
| TP1 | (init) → Awaiting Consultant | `createFromHandover` | COO | Handover status = APPROVED; project belum ada untuk handover ini | INSERT projects; UPDATE handovers.status='ASSIGNED_TO_PM'; INSERT activity log |
| TP2 | Awaiting Consultant → In Progress | `assignConsultants` / `setConsultants` | COO | `handovers.dp_payment_status = 'PAID'`; minimal 1 konsultan valid; user belong ke department handover | UPDATE projects.status; INSERT activity log "PROJECT_STARTED" |
| TP3 | In Progress → On Hold | `pauseProject` (Future) | PM atau CEO | Reason wajib diisi | INSERT audit log; notify konsultan |
| TP4 | On Hold → In Progress | `resumeProject` (Future) | PM atau CEO | Reason wajib diisi | INSERT audit log |
| TP5 | In Progress → Completed | `completeProject` | PM project (strict ownership) | SEMUA `project_milestones.status = 'Done'`; project tidak Cancelled | UPDATE projects.status; UPDATE projects.end_date = today; UPDATE `invoice_terms` (term FINAL): set trigger_reference_value='Project completed', trigger_confirmed_by/at; jalankan `syncInvoiceTermLifecycle()`; INSERT activity log "PROJECT_COMPLETED" |
| TP6 | * → Cancelled | `cancelProject` (Future) | CEO atau COO | Reason wajib diisi; project belum Completed | INSERT audit log; notifikasi tim |

> **Catatan implementasi saat ini:** TP1, TP2, TP5 sudah terimplementasi di
> [`projects.controller.js`](backend-development/src/controllers/projects.controller.js).
> TP3, TP4, TP6 belum diimplementasi (masuk Phase 2 atau Future Work).

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
| TM1 | Pending → In Progress | `updateMilestoneStatus` | Owner milestone ATAU PM project | Milestone belong ke project; project tidak Completed/Cancelled | INSERT `project_milestone_updates`; KPI Update Compliance recompute |
| TM2 | In Progress → Done | `updateMilestoneStatus` | Owner ATAU PM | Same as above | Set `completed_at = NOW()`; INSERT audit; KPI Timeliness + Output Quality input ready |
| TM3 | In Progress → Blocked | `updateMilestoneStatus` | Owner ATAU PM | Note wajib (alasan blocker) | INSERT audit |
| TM4 | Blocked → In Progress | `updateMilestoneStatus` | Owner ATAU PM | — | INSERT audit |
| TM5 | Done → In Progress | `updateMilestoneStatus` | PM only | Project belum Completed | Clear `completed_at`; INSERT audit "REOPEN" |
| TM6 | (no-op, Done) | `rateMilestone` | PM only | Milestone status = Done; rating 1..5, revisionCount ≥ 0 | UPDATE `quality_rating`, `revision_count`; INSERT audit dengan note "Rated N/5" |

> **Catatan implementasi saat ini:** TM1–TM5 terimplementasi via
> [`updateMilestoneStatus`](backend-development/src/controllers/projects.controller.js#L864).
> TM6 terimplementasi via [`rateMilestone`](backend-development/src/controllers/projects.controller.js#L972).

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
- Tabel **`project_milestone_updates`** (sudah ada) mencatat perubahan milestone.status + rating: `update_id, milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at`.
- Setiap transisi sukses harus menghasilkan 1 row baru di tabel audit yang sesuai.
- Audit bersifat append-only — tidak ada endpoint UPDATE atau DELETE.
- Tersedia API endpoint untuk view audit trail per project (gabungan project + milestone history).

### FR-3: Validation Rule Engine (Centralized Service)

**Acceptance Criteria:**
- Folder `backend-development/src/services/wfms/` berisi:
  - `state-definitions.js` — enum + transition matrix sebagai konstanta.
  - `transition-service.js` — function `transitionProject()` dan `transitionMilestone()`.
  - `audit-logger.js` — helper INSERT audit log.
  - `preconditions.js` — helper cek DP unpaid, all milestones done, dll.
  - `authorization.js` — helper cek role/ownership.
- Controller (`projects.controller.js`) memanggil service ini, tidak melakukan validasi inline.
- Function `transitionProject(projectId, toStatus, userId, reason, options)` melakukan:
  1. Cek transisi allowed via matrix.
  2. Cek preconditions (DP paid, semua milestone done, dll).
  3. Cek otorisasi (role + ownership).
  4. Eksekusi transisi dalam DB transaction (atomic).
  5. INSERT audit log.
  6. Trigger side effect (invoice trigger, activity log).
- Jika validasi gagal, throw `WFMSError` dengan code spesifik (`INVALID_TRANSITION`, `PRECONDITION_FAILED`, `UNAUTHORIZED_ROLE`, `DP_UNPAID`).
- Logika serupa untuk `transitionMilestone()` dan `rateMilestone()`.

### FR-4: Side Effect Integration (Cross-Module)

**Acceptance Criteria:**
- **DP Unpaid Guard:** `transitionProject()` ke `In Progress` membaca `handovers.dp_payment_status`; jika ≠ `'PAID'`, return error `DP_UNPAID` (HTTP 409).
- **Invoice Trigger on Completion:** Saat project → Completed, UPDATE `invoice_terms` WHERE `project_id=? AND term_type='FINAL' AND status='DRAFT'` set `trigger_reference_value='Project completed', trigger_confirmed_by, trigger_confirmed_at`; lalu jalankan `syncInvoiceTermLifecycle(conn, account_id)` untuk promosi DRAFT → READY_TO_ISSUE jika previous terms PAID.
- **KPI Input:** Milestone fields `completed_at`, `quality_rating`, `revision_count`, dan rekord `project_milestone_updates` menjadi input untuk perhitungan KPI 4 dimensi (Task Completion 35%, Timeliness 25%, Update Compliance 15%, Output Quality 25%).

### FR-5: Frontend State Visualization

**Acceptance Criteria:**
- Komponen `<ProjectStatusBadge status={status} />` dan `<MilestoneStatusBadge status={status} />` reusable, di `frontend-development/src/components/ui/` atau `features/projects/components/shared/`. (Saat ini badge masih inline di tiap page — perlu extract.)
- Mapping warna:
  - Project: Awaiting Consultant = abu-abu, In Progress = biru, On Hold = oranye, Completed = hijau, Cancelled = merah.
  - Milestone: Pending = abu-abu, In Progress = biru, Done = hijau, Blocked = merah.
- Filter dropdown "Filter by Status" tersedia di halaman daftar project.
- Tombol action conditional:
  - "Mark Completed" muncul jika project.status = `In Progress` AND user.role = `PM` (project owner) AND semua milestone Done.
  - "Update Milestone" muncul jika user = owner milestone ATAU PM project.
  - "Rate Milestone" muncul jika milestone.status = Done AND user = PM project.
- Halaman detail project punya tab "Timeline" yang menampilkan gabungan audit trail (project + milestone) dalam bentuk kronologis. (Tab "Timeline" sudah ada di `project-tabs.tsx`, isi perlu disesuaikan.)

### FR-6: Derived Monitoring Metrics (Bukan State)

**Acceptance Criteria:**
- Dashboard query menghitung "overdue milestone": `target_date < CURDATE() AND status != 'Done' AND status != 'Cancelled'`.
- Dashboard query menghitung "upcoming risk milestone": `target_date BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY AND status != 'Done'`.
- Dashboard query menghitung "days waiting DP": untuk handover APPROVED yang `dp_payment_status != 'PAID'`, hitung `DATEDIFF(CURDATE(), approved_at)`.
- Metrik ini **tidak** disimpan di kolom DB, dihitung di query repository.
- Ditampilkan di Dashboard CEO, COO, PM, dan Konsultan sebagai alert section.

---

## 5. DERIVED MONITORING METRICS — "AT RISK" Reframed

PRD versi 1.0 mendefinisikan "At Risk" sebagai state machine state dengan
transisi otomatis via cron. Pada revisi ini, "At Risk" diposisikan ulang
sebagai **derived metric** dengan rasional:

1. **Tidak ada transisi keluar yang jelas:** Milestone yang "At Risk" (deadline
   dekat + progress rendah) tetap harus diselesaikan di state aktif (In
   Progress). Memberinya state terpisah hanya menambah kompleksitas tanpa
   nilai bisnis.
2. **Push notification berlebihan untuk skala DSK:** Tim kecil (≈10 orang)
   sudah cukup membuka dashboard pagi hari. Alert via email/in-app push
   meningkatkan complexity (SMTP, queue, retry) tanpa proporsional benefit.
3. **Konsistensi data:** State yang disimpan adalah keputusan manusia
   (mulai/selesai/pause/batal). Keterlambatan adalah konsekuensi pasif yang
   bisa dihitung kapan saja dari `target_date` + status saat ini.

### Implementation

| Metric | Query Pattern | Tampil di |
|--------|--------------|-----------|
| Overdue milestone | `target_date < CURDATE() AND status NOT IN ('Done')` | Dashboard PM, COO, Konsultan |
| Upcoming risk (≤ 7 hari) | `target_date BETWEEN CURDATE() AND CURDATE() + 7 DAY AND status NOT IN ('Done')` | Dashboard PM, COO, CEO |
| DP unpaid alert | `handovers.dp_payment_status != 'PAID'` + `DATEDIFF(CURDATE(), approved_at)` | Dashboard COO, CEO |
| Handover pending PM | `handovers.status = 'APPROVED'` + no linked project | Dashboard COO |

---

## 6. DATABASE SCHEMA

### 6.1 Tabel `projects` (sudah ada)

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

### 6.2 Tabel `project_milestones` (sudah ada)

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

### 6.3 Tabel `project_milestone_updates` (sudah ada — audit milestone)

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

### 6.4 Tabel `project_status_transitions` (BARU — perlu migration)

```sql
CREATE TABLE project_status_transitions (
  transition_id    BIGINT        PRIMARY KEY AUTO_INCREMENT,
  project_id       BIGINT        NOT NULL,

  from_status      ENUM('Awaiting Consultant', 'In Progress', 'On Hold', 'Completed', 'Cancelled') NOT NULL,
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

---

## 7. API ENDPOINTS

### 7.1 Project Lifecycle Endpoints

#### POST `/api/projects/from-handover`
Buat project dari handover APPROVED. Aktor: COO (permission `PROJECT_CREATE`).

#### POST `/api/projects/:projectId/consultants`
Assign konsultan (transisi Awaiting Consultant → In Progress jika belum). Validasi: DP harus PAID, minimal 1 konsultan.

#### PUT `/api/projects/:projectId/consultants`
Replace seluruh tim konsultan. Validasi sama.

#### POST `/api/projects/:projectId/complete`
Transisi In Progress → Completed. Validasi: aktor PM project, semua milestone Done. Side effect: trigger final invoice.

**Response (success 200):**
```json
{
  "success": true,
  "data": {
    "project": { "project_id": 1, "status": "Completed", ... },
    "triggeredInvoiceTerms": 1
  }
}
```

**Response (error 409 — precondition):**
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

### 7.2 Milestone Lifecycle Endpoints

#### PATCH `/api/projects/:projectId/milestones/:milestoneId/status`
Update status milestone. Body: `{ status: 'In Progress' | 'Done' | 'Blocked' | 'Pending', note?: string }`. Aktor: owner milestone atau PM project.

#### PATCH `/api/projects/:projectId/milestones/:milestoneId/rate`
PM rate milestone yang sudah Done. Body: `{ rating: 1..5, revisionCount: number >= 0, note?: string }`.

### 7.3 Audit Trail Endpoint

#### GET `/api/projects/:projectId/audit-trail` (BARU — perlu implementasi)

Return gabungan history project + milestone untuk project tersebut.

**Response:**
```json
{
  "project_id": 1,
  "transitions": [
    {
      "id": 12,
      "entity_type": "project",
      "from_status": "Awaiting Consultant",
      "to_status": "In Progress",
      "triggered_by": { "id": 5, "name": "Budi", "role": "COO" },
      "trigger_source": "USER",
      "triggered_at": "2026-05-28T08:30:00Z",
      "reason": "Tim sudah lengkap, DP PAID"
    },
    {
      "id": 45,
      "entity_type": "milestone",
      "milestone_title": "Draft TP-Doc",
      "from_status": "Pending",
      "to_status": "In Progress",
      "triggered_by": { "id": 8, "name": "Andi", "role": "Konsultan" },
      "trigger_source": "USER",
      "triggered_at": "2026-05-29T09:15:00Z",
      "reason": null
    }
  ]
}
```

---

## 8. BACKEND IMPLEMENTATION GUIDANCE

### 8.1 Struktur Folder

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

### 8.2 Pseudocode Core Function

```javascript
// src/services/wfms/transition-service.js

const { isAllowedTransition } = require('./state-definitions');
const { checkPreconditions } = require('./preconditions');
const { isAuthorized } = require('./authorization');
const { logProjectTransition, logMilestoneTransition } = require('./audit-logger');

async function transitionProject(conn, { projectId, toStatus, userId, reason, options = {} }) {
  const [[project]] = await conn.query(
    `SELECT p.project_id, p.project_code, p.status, p.pm_user_id, p.handover_id,
            h.dp_payment_status
     FROM projects p
     INNER JOIN handovers h ON h.handover_id = p.handover_id
     WHERE p.project_id = ? FOR UPDATE`,
    [projectId]
  );
  if (!project) throw new WFMSError('NOT_FOUND', 'Project tidak ditemukan');

  const fromStatus = project.status;
  if (fromStatus === toStatus) {
    return { noop: true, project };  // idempotent
  }

  // 1. Matrix check
  if (!isAllowedTransition('project', fromStatus, toStatus)) {
    throw new WFMSError('INVALID_TRANSITION',
      `Transisi dari ${fromStatus} ke ${toStatus} tidak diperbolehkan`);
  }

  // 2. Authorization (role + ownership)
  const user = await getUser(conn, userId);
  if (!isAuthorized('project', user, project, fromStatus, toStatus)) {
    throw new WFMSError('UNAUTHORIZED_ROLE',
      `Role ${user.role} tidak boleh melakukan transisi ini`);
  }

  // 3. Preconditions
  const pre = await checkPreconditions(conn, 'project', project, toStatus, options);
  if (!pre.passed) {
    throw new WFMSError(pre.code || 'PRECONDITION_FAILED', pre.message);
  }

  // 4. Execute transition
  await conn.query(
    `UPDATE projects SET status = ?, updated_at = NOW() WHERE project_id = ?`,
    [toStatus, projectId]
  );

  // 5. Audit log
  await logProjectTransition(conn, {
    projectId, fromStatus, toStatus, userId,
    triggerSource: options.triggerSource || 'USER',
    reason
  });

  // 6. Side effects (delegated)
  if (toStatus === 'Completed') {
    await triggerFinalInvoice(conn, projectId, userId);
  }
  if (toStatus === 'In Progress' && fromStatus === 'Awaiting Consultant') {
    await logActivity(conn, project.handover_id, 'PROJECT_STARTED', userId);
  }

  return { noop: false, project: { ...project, status: toStatus } };
}
```

### 8.3 Refactor Existing Controllers

Controller `completeProject` saat ini berisi ~150 baris logic. Setelah
refactor:

```javascript
const completeProject = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  const actorUserId = getUserIdFromRequest(req, res);
  const { note } = req.body || {};

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await transitionProject(conn, {
      projectId,
      toStatus: 'Completed',
      userId: actorUserId,
      reason: note
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

## 9. FRONTEND IMPLEMENTATION GUIDANCE

### 9.1 Komponen StatusBadge

```tsx
// src/features/projects/components/shared/project-status-badge.tsx

const PROJECT_STATUS_CONFIG = {
  'Awaiting Consultant': { bg: '#F3F4F6', text: '#374151' },
  'In Progress':         { bg: '#DBEAFE', text: '#1E3A8A' },
  'On Hold':             { bg: '#FED7AA', text: '#9A3412' },
  'Completed':           { bg: '#D1FAE5', text: '#065F46' },
  'Cancelled':           { bg: '#FEE2E2', text: '#991B1B' }
} as const;

export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => {
  const cfg = PROJECT_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {status}
    </span>
  );
};
```

```tsx
// src/features/projects/components/shared/milestone-status-badge.tsx
const MILESTONE_STATUS_CONFIG = {
  'Pending':     { bg: '#F3F4F6', text: '#374151' },
  'In Progress': { bg: '#DBEAFE', text: '#1E3A8A' },
  'Done':        { bg: '#D1FAE5', text: '#065F46' },
  'Blocked':     { bg: '#FEE2E2', text: '#991B1B' }
} as const;
```

### 9.2 Conditional Action Button

```tsx
const canMarkCompleted =
  project.status === 'In Progress' &&
  currentUser.id === project.pmUserId &&
  project.milestones.every((m) => m.status === 'Done');

const canRateMilestone = (m: Milestone) =>
  m.status === 'Done' &&
  currentUser.id === project.pmUserId;
```

### 9.3 Timeline View

Tab "Timeline" (sudah ada di [`project-tabs.tsx`](frontend-development/src/features/projects/components/detail/project-tabs.tsx#L18)) menampilkan gabungan audit trail kronologis. Fetch dari `GET /api/projects/:id/audit-trail`.

---

## 10. ACCEPTANCE CRITERIA (Testing Scenarios)

### Test Case 1: Valid Project Transition
**Given** project Awaiting Consultant, handover DP PAID
**When** COO assign konsultan via POST `/api/projects/:id/consultants`
**Then** status → In Progress, audit row di `project_status_transitions`, trigger_source = USER

### Test Case 2: DP Unpaid Block
**Given** project Awaiting Consultant, handover DP belum PAID
**When** COO assign konsultan
**Then** HTTP 409 dengan code `DP_UNPAID`, status DB tidak berubah, tidak ada audit log

### Test Case 3: Invalid Transition Blocked
**Given** project Awaiting Consultant
**When** user POST `/api/projects/:id/complete`
**Then** HTTP 409 dengan code `INVALID_TRANSITION` (Awaiting Consultant → Completed tidak ada di matrix)

### Test Case 4: Precondition Check (Milestone Not Done)
**Given** project In Progress, ada milestone status Pending
**When** PM POST `/api/projects/:id/complete`
**Then** HTTP 409 dengan code `MILESTONES_INCOMPLETE`, status tidak berubah, invoice tidak ter-trigger

### Test Case 5: Authorization Check
**Given** project In Progress dengan PM = User A
**When** User B (konsultan, bukan PM) POST `/api/projects/:id/complete`
**Then** HTTP 403 dengan code `UNAUTHORIZED_ROLE`

### Test Case 6: Side Effect — Trigger Invoice
**Given** project In Progress, semua milestone Done, invoice term FINAL status DRAFT
**When** PM POST `/api/projects/:id/complete`
**Then** project.status = Completed, end_date = today, invoice_terms.trigger_reference_value = 'Project completed', dan jika previous terms PAID maka FINAL term promote ke READY_TO_ISSUE

### Test Case 7: Milestone Reopen
**Given** milestone Done
**When** PM PATCH status ke In Progress dengan note "Revisi"
**Then** status = In Progress, completed_at = NULL, audit row baru di `project_milestone_updates`

### Test Case 8: Derived Metric — Overdue
**Given** milestone target_date = kemarin, status In Progress
**When** PM buka dashboard
**Then** milestone muncul di section "Milestones at Risk → Overdue" dengan badge "1 hari lewat"; **status di DB tetap In Progress** (tidak berubah jadi "At Risk")

### Test Case 9: Audit Trail Immutability
**Given** ada entry di `project_status_transitions` atau `project_milestone_updates`
**When** user attempt UPDATE/DELETE row tersebut
**Then** tidak ada endpoint API yang exposed untuk mutate audit — operasi tidak mungkin via aplikasi

---

## 11. IMPLEMENTATION PHASES

### Phase 1 — Core WFMS Reality (sudah selesai)

- Tabel `projects`, `project_milestones`, `project_milestone_updates` dengan ENUM.
- Endpoint `createFromHandover`, `assignConsultants`, `setConsultants`, `updateMilestoneStatus`, `rateMilestone`, `completeProject`.
- DP unpaid guard, invoice trigger pada completion.
- Frontend: project list, project detail, milestone update, dashboard per role (CEO, COO, PM, Konsultan) dengan derived overdue metric.

**Output Phase 1:** Sistem berjalan, dashboard menunjukkan state + overdue metric, audit milestone lengkap.

### Phase 2 — WFMS Centralization & Project Audit Trail (rekomendasi)

⏱️ Estimasi: 1-2 hari kerja

- Migration `project_status_transitions`.
- Folder `services/wfms/` dengan transition service, audit logger, preconditions.
- Refactor controller `completeProject`, `assignConsultants`, `setConsultants` untuk delegate ke service.
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

- Cron job push-based At Risk detection + email notification (kalau scale DSK bertumbuh).
- Multi-step approval chain (PM → COO → CEO untuk completion).
- Versioning workflow definition (kalau workflow berubah per service line).

---

## 12. REFERENCES KE SKRIPSI

| Bagian Skripsi | Konten yang Merujuk PRD |
|----------------|--------------------------|
| **BAB 2.1.5 WfMS** | Fondasi teoritis dari implementasi di PRD ini |
| **BAB 3.2.3 Perancangan Sistem** | Narasi tentang perancangan workflow merujuk ke State Machine Definition (bagian 3) |
| **BAB 3.2.4 Implementasi** | Narasi tentang implementasi workflow merujuk ke Backend Implementation Guidance (bagian 8) |
| **BAB 4.2 Perancangan Sistem** | State Diagram (3.1.2, 3.2.2), Transition Matrix (3.1.3, 3.2.3), Transition Rules (3.1.4, 3.2.4), Database Schema (6), API Design (7), Derived Metric (5) |
| **BAB 4.3 Implementasi Sistem** | Screenshot kode dari Backend Implementation (8), Screenshot UI dari Frontend Implementation (9) |
| **BAB 4.4 Pengujian** | Acceptance Criteria (10) menjadi test scenarios |

---

## 13. RISK & MITIGATION

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|:------------:|:------:|----------|
| Race condition saat transisi paralel | Rendah | Tinggi | DB transaction + SELECT FOR UPDATE (sudah diimplementasi) |
| Validasi inline di controller terlewat | Sedang | Sedang | Refactor ke `services/wfms/` (Phase 2) |
| Workflow definition perlu berubah per service line | Sedang | Rendah | Konstanta mudah di-edit di `state-definitions.js` |
| Penguji minta cron At Risk detection | Sedang | Sedang | Defend: passive detection via dashboard query cocok untuk skala DSK; lihat Phase 4 sebagai future work |
| Penguji minta WFMS framework formal (Camunda dll) | Rendah | Sedang | Defend: custom rule engine cocok dengan skala 100 proyek/tahun; framework eksternal over-engineering |

---

## 14. APPENDIX

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

### B. Quick Reference Card untuk Sidang

Saat ditanya **"Mana WFMS-nya?"**, tunjukkan:

1. **State Machine Definition** → bagian 3 PRD (project & milestone enum)
2. **Database schema dengan ENUM** → tabel `projects.status`, `project_milestones.status`
3. **Audit Trail** → tabel `project_status_transitions` + `project_milestone_updates`
4. **Rule Engine** → folder `services/wfms/transition-service.js`
5. **Side Effect Integration** → trigger invoice di `completeProject`, DP unpaid guard di `assignConsultants`
6. **Visualization** → komponen `<ProjectStatusBadge />`, `<MilestoneStatusBadge />`, halaman Timeline tab
7. **Derived Monitoring** → dashboard query overdue/upcoming di repositories `dashboard-*.repo.js`

### C. Pertanyaan Defensif yang Mungkin Muncul

**Q: Kenapa "At Risk" bukan state machine state?**
A: Karena tidak ada transisi keluar yang jelas dari "At Risk" — milestone overdue tetap dikerjakan di state "In Progress" sambil di-flag di dashboard. Memberinya state terpisah hanya menambah kompleksitas tanpa nilai bisnis. Lihat bagian 5 untuk detail rasional.

**Q: Kenapa tidak pakai cron untuk auto-detection?**
A: Skala DSK (≈100 proyek/tahun, tim ≈10 orang) tidak butuh push-based alerting. Pull-based via dashboard cukup, dan menghindari overhead SMTP/queue/retry. Cron dimasukkan ke Future Work (Phase 4) kalau scale bertumbuh.

**Q: Kenapa 5 state project tapi 4 state milestone?**
A: State project mencerminkan lifecycle bisnis penuh (assign → kerja → pause/batal → selesai). State milestone lebih granular fokus ke task-level execution (mulai → kerja → blokir → selesai). Beda level granularity, beda kebutuhan state.

**Q: Bagaimana memastikan audit trail tidak bisa dimanipulasi?**
A: Tidak ada endpoint API yang exposed untuk UPDATE/DELETE row audit. Append-only by design. Untuk security level lebih tinggi (forensic), bisa tambah cryptographic chain (Future Work).

---

**END OF PRD (REVISI 1.1)**
