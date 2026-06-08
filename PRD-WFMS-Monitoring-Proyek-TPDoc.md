# PRD: Workflow Management System (WFMS)
## Modul Monitoring Proyek TP-Doc — PT DSK Global Konsultama

---

| Meta | Detail |
|------|--------|
| Document | Product Requirements Document |
| Modul | Workflow Management System (WFMS) |
| Sistem | Aplikasi Monitoring Proyek dan Penilaian KPI |
| Studi Kasus | PT DSK Global Konsultama — Layanan Transfer Pricing Documentation (TP-Doc) |
| Tech Stack | React.js (frontend) + Node.js (backend) + MySQL (database) + RESTful API |
| Versi | 1.0 |
| Author | Muhamad Faried (NIM 2207412041) |
| Pembimbing | (Nama dosen pembimbing) |

---

## 1. OVERVIEW

### 1.1 Latar Belakang

Monitoring proyek TP-Doc di PT DSK Global Konsultama saat ini dilakukan secara manual menggunakan spreadsheet Excel, WhatsApp, dan email yang tidak terintegrasi. Status pekerjaan disepakati informal antar peran (CEO, COO, PM, Konsultan), sehingga tidak ada single source of truth untuk progres proyek, tidak ada audit trail perubahan status, dan deteksi keterlambatan baru terjadi setelah masalah eskalasi.

### 1.2 Tujuan Modul WFMS

Modul WFMS bertanggung jawab untuk:
1. Mendefinisikan state pekerjaan yang baku dan tertelusur
2. Mengendalikan transisi state berdasarkan rule yang telah ditetapkan
3. Mencatat audit trail setiap perubahan state beserta aktor dan waktu
4. Menjalankan aksi otomatis (deteksi keterlambatan, trigger perhitungan KPI) tanpa intervensi manual
5. Menyediakan visualisasi state yang konsisten antara backend dan frontend

### 1.3 Posisi dalam Sistem

WFMS adalah **lapisan kendali (rule engine)** yang berada di antara user action (frontend) dan data persistence (database). Setiap perubahan state proyek dan milestone **harus melalui WFMS**, tidak boleh langsung `UPDATE` ke database.

```
[User Action di Frontend] 
        ↓
[API Endpoint]
        ↓
[WFMS Rule Engine] ← validasi, otorisasi, log, trigger
        ↓
[Database: state ENUM + audit log]
```

---

## 2. SCOPE

### 2.1 In Scope

✅ State machine untuk entitas `project` dan `milestone`
✅ Validation rule untuk setiap transisi state
✅ Audit trail (state transition log) lengkap dengan timestamp dan aktor
✅ Authorization check berdasarkan role (CEO, COO, PM, Konsultan, Superadmin)
✅ Automated trigger via cron job (deteksi At Risk, recompute KPI)
✅ RESTful API endpoint untuk transisi state
✅ Frontend component untuk visualisasi state (badge, filter, conditional button)

### 2.2 Out of Scope

❌ State machine framework eksternal (Camunda, Airflow) — pakai custom implementation
❌ Workflow editor visual (no-code) — workflow di-define di code
❌ Approval chain multi-step kompleks — cukup single approver per transisi
❌ Versioning workflow definition — workflow definition fixed di code

---

## 3. STATE MACHINE DEFINITION

### 3.1 Daftar State

| State | Definisi | Karakteristik |
|-------|----------|---------------|
| **Planning** | Proyek baru dibuat, PM dan tim ditugaskan, milestone belum mulai dikerjakan | Initial state |
| **On Track** | Pekerjaan berjalan, milestone diupdate berkala, progres sesuai schedule | Normal state |
| **At Risk** | Deadline ≤ 3 hari sementara progres < 80%, atau ada milestone overdue | Warning state — butuh intervensi |
| **Completed** | Semua milestone selesai, final invoice di-trigger | Terminal state |

### 3.2 State Transition Diagram

```
                    [START]
                       ↓
                  ┌─────────┐
                  │Planning │
                  └────┬────┘
                       │ start_work
                       ↓
                  ┌─────────┐
            ┌─────│On Track │─────┐
            │     └────┬────┘     │
            │          │          │
   detect_risk         │   complete_all_milestones
            │          │          │
            ↓          │          ↓
       ┌─────────┐     │     ┌──────────┐
       │ At Risk │─────┘     │Completed │
       └────┬────┘ recover    └──────────┘
            │                  [TERMINAL]
            │ complete_despite_risk
            └────────────────────→ ┘
```

### 3.3 Transition Matrix (Allowed Transitions)

| From / To | Planning | On Track | At Risk | Completed |
|-----------|:--------:|:--------:|:-------:|:---------:|
| **Planning** | — | ✅ | ❌ | ❌ |
| **On Track** | ❌ | — | ✅ | ✅ |
| **At Risk** | ❌ | ✅ | — | ✅ |
| **Completed** | ❌ | ❌ | ❌ | — (terminal) |

### 3.4 Transition Rules Detail

| # | Transition | Trigger | Aktor | Preconditions | Side Effects |
|:-:|------------|---------|-------|---------------|--------------|
| T1 | Planning → On Track | `start_work` | PM | Minimal 1 milestone telah diupdate progresnya | Log audit trail; notify konsultan |
| T2 | On Track → At Risk | `detect_risk` | SYSTEM (cron) | `(target_date - today) ≤ 3 hari` DAN `progress < 80%` | Log audit trail; kirim alert ke PM & CEO |
| T3 | On Track → At Risk | `flag_risk` | PM | — (manual flag) | Log audit trail; kirim alert ke CEO |
| T4 | At Risk → On Track | `recover` | PM | Progress sudah ≥ 80% ATAU target_date di-extend | Log audit trail; kirim notifikasi recovery |
| T5 | On Track → Completed | `complete` | PM atau CEO | Semua milestone berstatus `Completed` | Log audit trail; trigger compute KPI; trigger generate invoice |
| T6 | At Risk → Completed | `complete_despite_risk` | PM atau CEO | Semua milestone berstatus `Completed` | Log audit trail; trigger compute KPI; trigger generate invoice; mark `completed_with_risk = true` |

---

## 4. FUNCTIONAL REQUIREMENTS

### FR-1: State Storage (Database Level)

**Deskripsi:** Status proyek dan milestone disimpan dengan tipe ENUM untuk memastikan hanya nilai yang valid yang bisa masuk ke database.

**Acceptance Criteria:**
- [ ] Kolom `status` pada tabel `projects` dan `milestones` bertipe `ENUM('Planning', 'On Track', 'At Risk', 'Completed')`
- [ ] Setiap row baru mendapat default status `Planning`
- [ ] Database menolak insert/update dengan nilai status di luar 4 enum

### FR-2: State Transition Log (Audit Trail)

**Deskripsi:** Setiap perubahan state dicatat dalam tabel terpisah dengan informasi lengkap.

**Acceptance Criteria:**
- [ ] Tabel `state_transition_log` mencatat: entity_type, entity_id, from_status, to_status, triggered_by_user_id, triggered_at, trigger_source (USER/SYSTEM), reason
- [ ] Setiap transisi sukses harus menghasilkan 1 row baru di log
- [ ] Log bersifat append-only, tidak boleh di-update atau di-delete
- [ ] Tersedia API endpoint untuk view audit trail per proyek/milestone

### FR-3: Validation Rule Engine (Backend Logic)

**Deskripsi:** Function backend yang memvalidasi setiap permintaan transisi state sebelum dieksekusi.

**Acceptance Criteria:**
- [ ] Function `transitionProjectStatus(projectId, newStatus, userId, reason)` melakukan validasi:
  - Cek apakah transisi allowed (sesuai matrix di bagian 3.3)
  - Cek preconditions (sesuai bagian 3.4)
  - Cek otorisasi (role user yang melakukan transisi)
- [ ] Jika validasi gagal, return error message yang spesifik dan tidak melakukan perubahan apa pun
- [ ] Jika validasi sukses, eksekusi transisi dalam database transaction (atomic)
- [ ] Logika serupa berlaku untuk `transitionMilestoneStatus`

### FR-4: Automated Trigger via Cron Job

**Deskripsi:** Scheduled job yang berjalan otomatis untuk deteksi state secara proaktif.

**Acceptance Criteria:**
- [ ] Cron job berjalan setiap hari pukul 00:01 WIB
- [ ] Untuk setiap proyek/milestone berstatus `On Track`, sistem mengecek kondisi At Risk
- [ ] Jika kondisi terpenuhi, sistem otomatis transisi ke `At Risk` (trigger_source = SYSTEM)
- [ ] Sistem mengirim alert (email/in-app notification) ke PM dan CEO
- [ ] Log execution cron job tersimpan untuk audit

### FR-5: Frontend State Visualization

**Deskripsi:** UI yang merefleksikan state machine kepada pengguna.

**Acceptance Criteria:**
- [ ] Komponen `<StatusBadge status={status} />` menampilkan badge berwarna:
  - Planning = abu-abu (#9CA3AF)
  - On Track = hijau (#10B981)
  - At Risk = oranye/merah (#EF4444)
  - Completed = biru (#3B82F6)
- [ ] Filter dropdown "Filter by Status" tersedia di halaman daftar proyek
- [ ] Tombol action conditional:
  - "Mark Completed" hanya muncul jika status = `On Track` atau `At Risk` DAN role user = PM atau CEO
  - "Flag as At Risk" hanya muncul jika status = `On Track` DAN role user = PM
- [ ] Halaman detail proyek punya tab "History" yang menampilkan audit trail dalam bentuk timeline

---

## 5. DATABASE SCHEMA

### 5.1 Tabel `projects`

```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  scope_description TEXT,
  status ENUM('Planning', 'On Track', 'At Risk', 'Completed') NOT NULL DEFAULT 'Planning',
  pm_user_id INT NOT NULL,
  start_date DATE,
  target_date DATE,
  actual_completion_date DATE NULL,
  completed_with_risk BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pm_user_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_target_date (target_date)
);
```

### 5.2 Tabel `milestones`

```sql
CREATE TABLE milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  sequence_order INT NOT NULL,
  status ENUM('Planning', 'On Track', 'At Risk', 'Completed') NOT NULL DEFAULT 'Planning',
  assignee_user_id INT,
  target_date DATE NOT NULL,
  actual_completion_date DATE NULL,
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  quality_score INT NULL CHECK (quality_score BETWEEN 1 AND 5),
  last_update_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_user_id) REFERENCES users(id),
  INDEX idx_project_status (project_id, status),
  INDEX idx_target_date (target_date)
);
```

### 5.3 Tabel `state_transition_log` (Audit Trail)

```sql
CREATE TABLE state_transition_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_type ENUM('project', 'milestone') NOT NULL,
  entity_id INT NOT NULL,
  from_status VARCHAR(20) NOT NULL,
  to_status VARCHAR(20) NOT NULL,
  triggered_by_user_id INT NULL,  -- NULL jika triggered by SYSTEM
  trigger_source ENUM('USER', 'SYSTEM') NOT NULL DEFAULT 'USER',
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  FOREIGN KEY (triggered_by_user_id) REFERENCES users(id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_triggered_at (triggered_at)
);
```

### 5.4 Tabel `users` (Referensi — sudah ada di skripsi)

```sql
-- Sudah ada, untuk referensi role
-- role ENUM('CEO', 'COO', 'PM', 'Konsultan', 'Superadmin')
```

---

## 6. API ENDPOINTS

### 6.1 Project State Endpoints

#### **GET /api/projects**
Mendapat daftar proyek dengan filter status.

**Query params:** `?status=On Track` (optional)
**Response:** Array of project objects

#### **GET /api/projects/:id**
Mendapat detail proyek termasuk current status.

#### **POST /api/projects/:id/transition**
Eksekusi transisi state proyek.

**Request body:**
```json
{
  "to_status": "On Track",
  "reason": "Tim sudah siap mulai, kick-off meeting done"
}
```

**Response (success 200):**
```json
{
  "success": true,
  "project": { "id": 1, "status": "On Track", ... },
  "transition_log_id": 123
}
```

**Response (error 400):**
```json
{
  "success": false,
  "error_code": "INVALID_TRANSITION",
  "message": "Transisi dari Planning ke Completed tidak diperbolehkan"
}
```

**Possible error codes:**
- `INVALID_TRANSITION` — transisi tidak ada di matrix
- `PRECONDITION_FAILED` — preconditions tidak terpenuhi (misal: belum semua milestone done)
- `UNAUTHORIZED_ROLE` — role user tidak boleh trigger transisi ini

### 6.2 Milestone State Endpoints

#### **POST /api/milestones/:id/transition**
Sama strukturnya dengan project transition.

#### **PATCH /api/milestones/:id/progress**
Update progress milestone (akan memicu auto-transition jika kondisi terpenuhi).

**Request body:**
```json
{
  "progress_percentage": 75,
  "quality_score": 4
}
```

### 6.3 Audit Trail Endpoint

#### **GET /api/projects/:id/audit-trail**
Mendapat history perubahan state proyek + milestone-nya.

**Response:**
```json
{
  "project_id": 1,
  "transitions": [
    {
      "id": 123,
      "entity_type": "project",
      "from_status": "Planning",
      "to_status": "On Track",
      "triggered_by": { "id": 5, "name": "Budi", "role": "PM" },
      "trigger_source": "USER",
      "triggered_at": "2026-05-28T08:30:00Z",
      "reason": "Tim sudah siap mulai"
    },
    ...
  ]
}
```

---

## 7. BACKEND IMPLEMENTATION GUIDANCE

### 7.1 Struktur Folder yang Disarankan

```
backend/
├── src/
│   ├── modules/
│   │   └── wfms/
│   │       ├── stateDefinitions.js       ← State enum, transition matrix
│   │       ├── transitionRules.js        ← Preconditions, side effects
│   │       ├── transitionService.js      ← Core logic
│   │       ├── auditLogger.js            ← Audit trail handler
│   │       └── automatedTriggers.js      ← Cron jobs
│   ├── api/
│   │   ├── projectRoutes.js
│   │   └── milestoneRoutes.js
│   └── ...
```

### 7.2 Pseudocode Core Function

```javascript
// src/modules/wfms/transitionService.js

async function transitionProjectStatus(projectId, toStatus, userId, reason) {
  // 1. Get current state
  const project = await db.getProjectById(projectId);
  const fromStatus = project.status;
  const user = await db.getUserById(userId);
  
  // 2. Validate transition matrix
  if (!isAllowedTransition('project', fromStatus, toStatus)) {
    throw new WFMSError('INVALID_TRANSITION', 
      `Transisi dari ${fromStatus} ke ${toStatus} tidak diperbolehkan`);
  }
  
  // 3. Validate preconditions
  const preconditionResult = await checkPreconditions('project', projectId, toStatus);
  if (!preconditionResult.passed) {
    throw new WFMSError('PRECONDITION_FAILED', preconditionResult.message);
  }
  
  // 4. Validate authorization
  if (!isAuthorizedForTransition(user.role, 'project', fromStatus, toStatus)) {
    throw new WFMSError('UNAUTHORIZED_ROLE', 
      `Role ${user.role} tidak boleh melakukan transisi ini`);
  }
  
  // 5. Execute transition dalam DB transaction
  return await db.transaction(async (trx) => {
    // 5a. Update project status
    await trx.updateProjectStatus(projectId, toStatus);
    
    // 5b. Log audit trail
    const logId = await trx.insertTransitionLog({
      entity_type: 'project',
      entity_id: projectId,
      from_status: fromStatus,
      to_status: toStatus,
      triggered_by_user_id: userId,
      trigger_source: 'USER',
      reason: reason
    });
    
    // 5c. Execute side effects
    await executeSideEffects('project', projectId, fromStatus, toStatus, trx);
    
    return { success: true, transition_log_id: logId };
  });
}
```

### 7.3 Pseudocode Cron Job

```javascript
// src/modules/wfms/automatedTriggers.js

const cron = require('node-cron');

// Setiap hari pukul 00:01 WIB
cron.schedule('1 0 * * *', async () => {
  console.log('[WFMS Cron] Starting At Risk detection...');
  
  // Cek semua milestone On Track
  const milestones = await db.getMilestonesByStatus('On Track');
  
  for (const m of milestones) {
    const daysToDeadline = differenceInDays(m.target_date, new Date());
    
    if (daysToDeadline <= 3 && m.progress_percentage < 80) {
      try {
        // Auto-transition (triggered_by_user_id = NULL karena SYSTEM)
        await transitionMilestoneStatus(
          m.id, 
          'At Risk', 
          null,  // SYSTEM
          `Auto-flagged: H-${daysToDeadline} dengan progress ${m.progress_percentage}%`,
          'SYSTEM'
        );
        
        // Kirim alert
        await sendAlert({
          recipients: [m.assignee_user_id, m.project.pm_user_id, CEO_USER_ID],
          subject: `Milestone "${m.name}" At Risk`,
          message: `Deadline H-${daysToDeadline}, progres ${m.progress_percentage}%`
        });
      } catch (err) {
        console.error(`[WFMS Cron] Failed to flag milestone ${m.id}:`, err);
      }
    }
  }
  
  console.log('[WFMS Cron] At Risk detection completed');
}, {
  timezone: 'Asia/Jakarta'
});
```

---

## 8. FRONTEND IMPLEMENTATION GUIDANCE

### 8.1 Komponen StatusBadge

```jsx
// src/components/StatusBadge.jsx

const STATUS_CONFIG = {
  'Planning':  { color: 'gray',   bg: '#F3F4F6', text: '#374151' },
  'On Track':  { color: 'green',  bg: '#D1FAE5', text: '#065F46' },
  'At Risk':   { color: 'red',    bg: '#FEE2E2', text: '#991B1B' },
  'Completed': { color: 'blue',   bg: '#DBEAFE', text: '#1E3A8A' }
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Planning'];
  return (
    <span 
      className="status-badge" 
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {status}
    </span>
  );
}
```

### 8.2 Conditional Action Button Logic

```jsx
// src/components/ProjectActions.jsx

function ProjectActions({ project, currentUser }) {
  const canMarkCompleted = 
    (project.status === 'On Track' || project.status === 'At Risk') &&
    (currentUser.role === 'PM' || currentUser.role === 'CEO') &&
    project.allMilestonesCompleted;
  
  const canFlagRisk = 
    project.status === 'On Track' &&
    currentUser.role === 'PM';
  
  return (
    <div className="actions">
      {canMarkCompleted && (
        <button onClick={handleMarkCompleted}>Mark Completed</button>
      )}
      {canFlagRisk && (
        <button onClick={handleFlagRisk}>Flag as At Risk</button>
      )}
    </div>
  );
}
```

### 8.3 Audit Trail Timeline View

```jsx
// src/components/AuditTrailTimeline.jsx

function AuditTrailTimeline({ projectId }) {
  const { data: transitions } = useFetch(`/api/projects/${projectId}/audit-trail`);
  
  return (
    <div className="timeline">
      {transitions.map(t => (
        <div key={t.id} className="timeline-item">
          <span className="time">{formatDate(t.triggered_at)}</span>
          <span className="actor">
            {t.trigger_source === 'SYSTEM' ? '🤖 System' : `👤 ${t.triggered_by.name}`}
          </span>
          <span className="change">
            <StatusBadge status={t.from_status} /> → <StatusBadge status={t.to_status} />
          </span>
          {t.reason && <span className="reason">"{t.reason}"</span>}
        </div>
      ))}
    </div>
  );
}
```

---

## 9. ACCEPTANCE CRITERIA (Testing Scenarios)

### Test Case 1: Valid Transition
**Given** proyek dengan status `Planning`
**When** PM klik tombol "Start Work"
**Then** status berubah ke `On Track`, audit trail tercatat dengan trigger_source = USER

### Test Case 2: Invalid Transition Blocked
**Given** proyek dengan status `Planning`
**When** user mencoba transisi ke `Completed` (via API)
**Then** API return error 400 `INVALID_TRANSITION`, status di DB tidak berubah, tidak ada log audit baru

### Test Case 3: Precondition Check
**Given** proyek dengan status `On Track`, masih ada milestone yang belum `Completed`
**When** PM klik "Mark Completed"
**Then** API return error `PRECONDITION_FAILED` dengan message yang jelas

### Test Case 4: Authorization Check
**Given** proyek dengan status `On Track`
**When** Konsultan (bukan PM/CEO) mencoba transisi ke `Completed`
**Then** API return error `UNAUTHORIZED_ROLE`

### Test Case 5: Auto At Risk Detection
**Given** milestone dengan target_date H-2 dan progress 50%
**When** cron job berjalan pada pukul 00:01
**Then** status milestone otomatis menjadi `At Risk`, audit trail tercatat dengan trigger_source = SYSTEM, alert terkirim

### Test Case 6: Side Effect — Trigger KPI Recompute
**Given** proyek dengan semua milestone `Completed`
**When** PM trigger transisi proyek ke `Completed`
**Then** status proyek = `Completed`, KPI recompute otomatis dipanggil, invoice generation di-trigger

### Test Case 7: Audit Trail Immutability
**Given** ada entry di `state_transition_log`
**When** user mencoba UPDATE atau DELETE row tersebut via API
**Then** operation ditolak (tidak ada endpoint untuk modify log)

---

## 10. IMPLEMENTATION PHASES

### **Phase 1 — Core WFMS (WAJIB untuk skripsi)**

⏱️ Estimasi: 3-4 hari kerja

- [ ] Setup tabel `projects`, `milestones`, `state_transition_log` dengan ENUM
- [ ] Implement function `transitionProjectStatus()` dan `transitionMilestoneStatus()`
- [ ] Implement validation rule (matrix, preconditions, authorization)
- [ ] Implement audit logger
- [ ] API endpoint POST `/api/projects/:id/transition` dan `/api/milestones/:id/transition`
- [ ] Unit test untuk validation rule

**Output Phase 1:** WFMS sudah konkret di backend, bisa demo via Postman/curl

### **Phase 2 — Automation & Frontend (RECOMMENDED)**

⏱️ Estimasi: 2-3 hari kerja

- [ ] Cron job deteksi At Risk
- [ ] Alert/notification mechanism
- [ ] Komponen StatusBadge di frontend
- [ ] Conditional action button
- [ ] Halaman audit trail (timeline view)
- [ ] Filter by status di daftar proyek

**Output Phase 2:** WFMS terlihat dari sisi user, demo sidang bisa show end-to-end

### **Phase 3 — Polish (NICE TO HAVE)**

⏱️ Estimasi: 1-2 hari kerja

- [ ] Email notification untuk alert At Risk
- [ ] Dashboard analytics per status (jumlah proyek per state)
- [ ] Export audit trail ke PDF/Excel

---

## 11. REFERENCES KE SKRIPSI

PRD ini menjadi acuan implementasi untuk bagian-bagian berikut di skripsi:

| Bagian Skripsi | Konten yang Merujuk PRD |
|----------------|--------------------------|
| **BAB 2.1.5 WfMS** | Fondasi teoritis dari implementasi di PRD ini |
| **BAB 3.2.3 Perancangan Sistem** | Narasi tentang perancangan workflow merujuk ke State Machine Definition (bagian 3) |
| **BAB 3.2.4 Implementasi** | Narasi tentang implementasi workflow merujuk ke Backend Implementation Guidance (bagian 7) |
| **BAB 4.2 Perancangan Sistem** (kosong, akan diisi) | State Diagram (3.2), Transition Matrix (3.3), Transition Rules (3.4), Database Schema (5), API Design (6) |
| **BAB 4.3 Implementasi Sistem** (kosong, akan diisi) | Screenshot kode dari Backend Implementation (7), Screenshot UI dari Frontend Implementation (8) |
| **BAB 4.4 Pengujian** (kosong, akan diisi) | Acceptance Criteria (9) menjadi test scenarios |

---

## 12. RISK & MITIGATION

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|:------------:|:------:|----------|
| Race condition saat transisi paralel | Rendah | Tinggi | Gunakan DB transaction + SELECT FOR UPDATE |
| Cron job gagal jalan | Rendah | Sedang | Log execution, retry mechanism, monitoring |
| Workflow definition perlu berubah | Sedang | Rendah | Pakai konstanta yang mudah di-edit di `stateDefinitions.js` |
| Penguji minta WFMS framework formal | Rendah | Sedang | Siapkan jawaban defensif: custom rule engine cocok dengan skala 100 proyek/tahun |

---

## 13. APPENDIX

### A. Glossary

| Term | Definisi |
|------|----------|
| **WFMS** | Workflow Management System — perangkat lunak yang mendefinisikan, mengoordinasikan, dan memantau alur kerja proses bisnis |
| **State Machine** | Model matematis yang menggambarkan entitas dengan state terbatas dan transisi antar state |
| **State Transition** | Perubahan state dari satu kondisi ke kondisi lain karena suatu event |
| **Audit Trail** | Catatan kronologis aktivitas yang dilakukan dalam sistem untuk keperluan akuntabilitas |
| **Precondition** | Kondisi yang harus dipenuhi sebelum suatu transisi state dapat dieksekusi |
| **Side Effect** | Aksi otomatis yang dijalankan sistem sebagai konsekuensi suatu transisi state |

### B. Quick Reference Card untuk Sidang

Saat ditanya **"Mana WFMS-nya?"**, tunjukkan:

1. **State Machine Definition** → bagian 3 PRD ini
2. **Database schema dengan ENUM** → tabel `projects`, `milestones`
3. **Audit Trail** → tabel `state_transition_log`
4. **Rule Engine** → file `transitionService.js`
5. **Automation** → file `automatedTriggers.js`
6. **Visualization** → komponen `StatusBadge`, halaman timeline

---

**END OF PRD**
