

PRD Integrasi Invoice ↔ Project
Kolaborasi modul Izhhar dan modul Faried
## 1. Tujuan
Dokumen ini menjelaskan aturan integrasi antara:
- modul Invoice & Handover yang dikerjakan oleh Izhhar
- modul Project yang dikerjakan oleh Faried
Tujuannya agar kedua modul tetap terhubung secara konsisten tanpa saling mengatur
detail implementasi internal masing-masing.
Dokumen ini tidak mengatur alur internal Project secara penuh, tetapi hanya mengatur:
- data apa yang sudah disediakan oleh modul Izhhar,
- data apa yang perlu dibaca oleh modul Project,
- trigger apa yang dikirim dari modul Project kembali ke Invoice,
- rule bisnis lintas modul yang harus dipatuhi bersama.

## 2. Ruang Lingkup Integrasi
Integrasi ini hanya mencakup dua rule bisnis utama:
Rule 1 — Project belum bisa mulai jika DP belum dibayar
Project boleh dibuat / diterima oleh modul Project, tetapi belum boleh masuk status
mulai berjalan jika DP belum dibayar.
Rule 2 — Final invoice belum bisa di-issue jika project belum completed
Termin final pada invoice tidak boleh aktif / tidak boleh di-generate jika belum ada trigger
bahwa project sudah selesai.

- Source of Truth per Modul
3.1 Source of truth yang disediakan modul Izhhar
Modul Izhhar menjadi source of truth untuk data berikut:
A. Invoice lifecycle

- invoice_accounts
- invoice_terms
- invoice_payments
B. Payment state yang relevan untuk project
- status term DP (invoice_terms.status)
- handovers.dp_payment_status
- handovers.dp_paid_at
- checklist DP_RECEIVED
C. Trigger aktivasi final invoice
Modul Invoice menyimpan field:
- trigger_reference_value
- trigger_confirmed_by
- trigger_confirmed_at
dan menggunakan field tersebut untuk mengaktifkan final invoice.

3.2 Source of truth yang disediakan modul Faried
Modul Project menjadi source of truth untuk data berikut:
- apakah project sudah mulai atau belum
- progress project
- apakah project sudah completed atau belum
- siapa PM / PIC project
- data operasional delivery project

## 4. Rule Integrasi Final
4.1 Rule Integrasi A — DP sebagai syarat mulai project
## Aturan

Project belum boleh mulai jika DP belum dibayar.
Makna bisnis
Meskipun handover sudah approved dan project sudah terbentuk, status operasional
project belum boleh berubah ke tahap “mulai berjalan” jika:
- handovers.dp_payment_status != PAID
Data yang harus dibaca modul Project
Faried cukup membaca salah satu dari dua sumber berikut:
Opsi utama
- handovers.dp_payment_status
Opsi pendukung
- checklist DP_RECEIVED
Rule final
## Jika:
- handovers.dp_payment_status = PAID
maka project boleh dianggap memenuhi syarat pembayaran awal.
## Jika:
- handovers.dp_payment_status = UNPAID
maka project belum memenuhi syarat mulai.
## Catatan
Rule ini tidak memaksa bagaimana Faried menampilkan atau membloknya di UI.
Yang penting:
- modul Project harus menghormati status tersebut sebagai rule bisnis lintas modul.

4.2 Rule Integrasi B — Project completed sebagai syarat final invoice
## Aturan
Final invoice belum boleh di-issue jika project belum completed.
Makna bisnis

Termin final pada invoice:
- saat awal akan tetap DRAFT
- baru bisa menjadi READY_TO_ISSUE jika ada trigger bahwa project sudah selesai
Siapa yang menyediakan trigger
Trigger ini berasal dari modul Project milik Faried.
Data/aksi yang harus diberikan modul Project ke modul Invoice
Saat project dinyatakan completed, modul Project harus mengirim sinyal/trigger ke modul
Invoice agar final term bisa diaktifkan.
Minimal makna trigger yang dikirim adalah:
- project terkait telah selesai
- final invoice sekarang boleh diaktifkan
Bentuk trigger
Bentuk implementasi teknis bisa dipilih kemudian, misalnya:
- memanggil endpoint Invoice
- memanggil service internal
- update data trigger melalui backend
Tetapi secara bisnis isi trigger minimal harus menghasilkan:
- trigger_reference_value = 'Project completed'
- trigger_confirmed_by = user yang menandai complete
- trigger_confirmed_at = waktu complete
Setelah itu, term FINAL menjadi:
## • READY_TO_ISSUE
## Catatan
Dokumen ini tidak menentukan bagaimana Faried menandai project completed di
modulnya.
Yang ditentukan di sini hanya:
- jika project completed, maka final invoice boleh aktif.


## 5. Kontrak Integrasi Antar Modul
5.1 Kontrak dari Izhhar ke Faried
Izhhar menyediakan data berikut yang bisa langsung dipakai oleh Faried:
Payment readiness
- handovers.dp_payment_status
- handovers.dp_paid_at
- checklist DP_RECEIVED
Invoice progression
- status setiap term invoice
- term type (DOWN_PAYMENT, INSTALLMENT, FINAL)
- payment history jika diperlukan untuk referensi
Handover context
- handover approved
- engagement signed
- seluruh data operasional awal project

5.2 Kontrak dari Faried ke Izhhar
Faried perlu menyediakan trigger berikut ke modul Izhhar:
A. Trigger project completed
Minimal makna trigger:
- project dengan relasi handover/engagement tertentu telah selesai
- final invoice boleh diaktifkan
B. Identitas trigger
Trigger sebaiknya membawa:
- project id / handover id / engagement id yang relevan

- siapa user yang mengonfirmasi
- kapan dikonfirmasi

## 6. Boundary Tanggung Jawab
6.1 Tanggung jawab Izhhar
Izhhar bertanggung jawab atas:
- payment recording
- DP paid synchronization
- invoice term lifecycle
- final invoice activation setelah trigger completion diterima
- menjaga status invoice/handover tetap konsisten
6.2 Tanggung jawab Faried
Faried bertanggung jawab atas:
- project execution state
- kapan project dianggap boleh mulai
- kapan project dianggap completed
- mengirimkan trigger completion ke modul invoice

- Rule Teknis yang Harus Disepakati
7.1 Rule untuk mulai project
Sebelum project dianggap “mulai berjalan”, modul Project harus mengecek:
- handovers.dp_payment_status
Jika PAID
Project boleh masuk tahap start.
Jika UNPAID
Project belum boleh start.


7.2 Rule untuk final invoice
Sebelum final invoice bisa di-generate, modul Invoice harus memastikan:
- trigger completion sudah ada
Artinya final term baru boleh aktif jika:
- trigger_reference_value terisi
- trigger_confirmed_by terisi
- trigger_confirmed_at terisi

## 8. Skenario Integrasi
8.1 Skenario 1 — DP belum dibayar
- EL signed
- invoice account dan invoice terms dibuat
- handover dibuat
- handover approved
- project siap diterima modul Project
- tetapi dp_payment_status = UNPAID
- project belum boleh masuk status mulai

8.2 Skenario 2 — DP sudah dibayar
- admin upload bukti pembayaran DP
- term DP menjadi PAID
- handovers.dp_payment_status = PAID
- checklist DP_RECEIVED = YES
- modul Project membaca bahwa syarat pembayaran awal sudah terpenuhi
- project boleh mulai


8.3 Skenario 3 — Project completed
- project berjalan
- Faried menandai project completed
- modul Project mengirim trigger completion ke Invoice
- final term invoice berubah dari DRAFT ke READY_TO_ISSUE
- admin invoice bisa generate final invoice

- Data Integrasi Minimal yang Perlu Konsisten
Agar integrasi aman, kedua modul harus sepakat minimal pada relasi berikut:
- handover_id
- engagement_id
- lead_id
- invoice_account.account_id
- invoice_terms.invoice_id
- term_type = DOWN_PAYMENT / FINAL

- Non-Goals / Di Luar Integrasi Ini
Dokumen ini tidak menentukan:
- tampilan internal modul Project
- status internal project apa saja
- task management project
- UI PM assignment
- detail workflow delivery
Dokumen ini juga tidak menentukan:
- desain halaman invoice

- desain halaman handover
- detail approval CEO/COO

- Pernyataan Kolaborasi yang Bisa Dipakai
Kalau kamu mau kalimat yang lugas untuk dicantumkan di PRD atau dikirim ke Faried,
pakai ini:
Modul yang dikerjakan oleh Izhhar telah menyediakan konteks invoice dan payment
readiness yang dibutuhkan oleh modul Project, khususnya status pembayaran down
payment pada handover. Modul Project yang dikerjakan oleh Faried perlu menggunakan
informasi tersebut sebagai syarat mulai project. Sebaliknya, ketika project telah selesai,
modul Project perlu mengirimkan trigger completion ke modul Invoice agar termin final
dapat diaktifkan dan diterbitkan.
Atau versi lebih singkat:
Integrasi utama antara modul Izhhar dan Faried terdiri dari dua rule: project belum dapat
dimulai sebelum DP dibayar, dan final invoice belum dapat di-issue sebelum project
completed. Status DP dibaca dari handover/invoice yang disediakan modul Izhhar,
sedangkan trigger project completed dikirim dari modul Faried ke modul Invoice.

- Versi Super Ringkas untuk Komunikasi Cepat
Kalau mau dikirim cepat ke Faried:
Yang sudah disediakan Izhhar
- DP payment status di handover sudah sinkron dari invoice
- final invoice sekarang memang menunggu trigger completion
- invoice lifecycle dan payment status sudah jadi source of truth
Yang perlu Faried lakukan
- baca dp_payment_status untuk menentukan project boleh mulai atau belum
- saat project completed, kirim trigger ke invoice supaya final term aktif
