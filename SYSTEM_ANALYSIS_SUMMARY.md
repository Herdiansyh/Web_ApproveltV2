# Analisis Sistem ApproveIt - Ringkasan Lengkap

**Tanggal Analisis:** 11 Desember 2025

---

## 📋 RINGKASAN SISTEM

### Nama Project
**ApproveIt v2** - Sistem E-Approval Berbasis Web untuk Persetujuan Dokumen Multi-Level

### Tujuan Utama
Mengelola proses persetujuan dokumen secara terstruktur melalui beberapa tahapan approval dengan kontrol permission yang granular pada setiap tahap.

---

## 🏗️ TEKNOLOGI & STACK

### Backend
- **Framework:** Laravel 12.x
- **ORM:** Eloquent
- **Database:** MySQL 8.0+ / SQLite
- **PHP Version:** 8.2+
- **Authentication:** Laravel Sanctum + Breeze

### Frontend
- **Framework:** React 18.x
- **UI Library:** Inertia.js (untuk Server-Driven UI)
- **Build Tool:** Vite 7.x
- **Styling:** Tailwind CSS 3.x
- **UI Components:** Radix UI + Custom Components

### Fitur Tambahan
- **PDF Generation:** FPDF, FPDI
- **QR Code:** SimpleSoftwareIO QR Code
- **Screenshots:** Browsershot (Puppeteer)
- **Encryption:** File signing & digital signatures
- **Queue:** Laravel Jobs untuk background processing

---

## 🗂️ STRUKTUR DATABASE & MODEL

### Model Utama & Hubungan

```
┌─────────────────────────────────────────────────────────────┐
│                    SUBMISSION (Pengajuan)                    │
│  - ID, user_id, workflow_id, document_id, division_id      │
│  - status, current_step, data_json, approved_at            │
│  - series_code, short_code, qr_code_path                   │
│  - cancel_reason, amend_reason, original_submission_id     │
└─────────────────────────────────────────────────────────────┘
        ├─ BelongsTo User (pembuat)
        ├─ BelongsTo Division (divisi pembuat)
        ├─ BelongsTo Workflow (alur persetujuan)
        ├─ BelongsTo Document (jenis dokumen)
        ├─ BelongsTo User (approved_by - approver)
        ├─ HasMany SubmissionFile (file-file terkait)
        ├─ HasMany Approval (riwayat approval)
        ├─ HasMany SubmissionWorkflowStep (progress per tahap)
        └─ HasOne StampedFile (file final dengan cap tangan)
```

### Tabel Database Utama

| Tabel | Fungsi |
|-------|--------|
| **submissions** | Data pengajuan utama |
| **submission_files** | File yang di-upload untuk submission |
| **submission_workflow_steps** | Progress approval di setiap tahap |
| **stamped_files** | File akhir setelah di-cap tangan |
| **approvals** | Riwayat approval/rejection |
| **workflows** | Definisi alur persetujuan per dokumen |
| **workflow_steps** | Tahapan dalam workflow |
| **documents** | Jenis-jenis dokumen yang bisa diajukan |
| **document_fields** | Field dinamis dalam setiap dokumen |
| **document_name_series** | Prefix/series untuk nomor dokumen |
| **users** | Data user dengan role (admin, manager, direktur, employee) |
| **divisions** | Organisasi tingkat divisi |
| **subdivisions** | Organisasi tingkat subdivisi |
| **subdivision_permissions** | Permission per subdivisi (can_view, can_approve, etc) |

---

## 🔄 ALUR WORKFLOW (SUBMISSION PROCESS)

### Fase 1: Pembuatan Submission
1. User login dan pilih jenis dokumen
2. Sistem menampilkan workflow yang tersedia untuk dokumen itu
3. User memilih workflow dan mengisi form dengan field-field dinamis
4. Sistem membuat `Submission` record dengan status `pending`
5. Sistem membuat `SubmissionWorkflowStep` untuk setiap tahap workflow

### Fase 2: Approval Process
1. Sistem menentukan divisi yang bertanggung jawab pada step saat ini
2. User di divisi tersebut dengan role yang sesuai dapat approve/reject
3. User melakukan approval/rejection dengan catatan (note)
4. Sistem mencatat aksi di `SubmissionWorkflowStep`
5. Status submission berkembang dari pending → approved/rejected

### Fase 3: Finalisasi
1. Jika approved di semua step → submission marked as "approved"
2. Sistem generate PDF dengan cap tangan digital (background job)
3. Sistem create `StampedFile` dengan file final
4. Sistem create QR Code untuk verifikasi
5. User dapat download file final

### Pembatalan & Amandemen
- **Cancel:** User bisa membatalkan submission, record di save untuk audit
- **Amend:** User bisa membuat amendment dari submission sebelumnya

---

## 👥 SISTEM ROLE & PERMISSION

### Role yang Ada
1. **Admin** - Akses penuh ke semua fitur
2. **Manager** - Mengelola divisi/subdivisi dan submissions
3. **Direktur** - Review dan approval final
4. **Employee** - User biasa yang membuat submission

### Permission System
- **Subdivision-based Permission** (tabel `subdivision_permissions`)
  - `can_view` - Bisa melihat submission
  - `can_approve` - Bisa approve submission
  - `can_reject` - Bisa reject submission
  - `can_request_next` - Bisa lanjut ke step berikutnya
  - `can_edit` - Bisa edit submission
  - `can_delete` - Bisa delete submission

- **Workflow Step Permission** (tabel `workflow_steps`)
  - Setiap step memiliki role yang dapat bertindak
  - Divisi yang bertanggung jawab pada step itu

### Penentuan User per Step
- **Bukan assignment user individual**
- **Assignment berbasis Division + Role**
- Runtime: Sistem cek user di divisi yang bertanggung jawab pada step tsb
- Cek role user vs role yang dibutuhkan step

---

## 🔍 FITUR UTAMA

### 1. Dashboard
- Statistik submission per user/divisi
- Filter pending approval
- Quick actions untuk approve/reject
- Real-time status tracking

### 2. Submission Management
- Create submission dengan form dinamis
- View detail submission dengan history
- Edit submission (jika belum di-approve)
- Delete submission
- Cancel submission dengan alasan
- Amend submission (buat versi baru)

### 3. Workflow Management (Admin)
- Create/edit/delete workflow
- Define workflow steps dengan divisi tujuan
- Set role requirements per step
- Activate/deactivate workflow

### 4. Document Management (Admin)
- Define document types
- Add custom fields (text, number, date, select)
- Set default columns untuk table display
- Document name series (prefix/nomor otomatis)

### 5. Approval & Review
- View submissions waiting approval
- Approve dengan catatan
- Reject dengan alasan
- See full approval history
- Track workflow progress

### 6. PDF & Digital Signatures
- Auto-generate PDF dari submission
- Digital signature/stamp pada PDF
- QR Code untuk verifikasi
- Download file final

### 7. Verification (Public)
- Public URL untuk verifikasi file (tanpa login)
- Scan QR code atau input short code
- View submission data dan approval history

---

## 📁 STRUKTUR FOLDER

```
project/
├── app/
│   ├── Http/Controllers/
│   │   ├── SubmissionController.php       # Main submission logic
│   │   ├── WorkflowController.php         # Workflow CRUD
│   │   ├── DocumentController.php         # Document CRUD
│   │   ├── UserController.php             # User management
│   │   └── ...
│   ├── Models/
│   │   ├── Submission.php
│   │   ├── Workflow.php
│   │   ├── Document.php
│   │   ├── User.php
│   │   ├── Division.php
│   │   ├── Subdivision.php
│   │   └── ...
│   ├── Services/
│   │   ├── SubmissionListService.php      # Query optimization
│   │   ├── SubmissionQueryService.php     # Base queries
│   │   ├── PermissionCacheService.php     # Cache permissions
│   │   └── DashboardStatsService.php      # Dashboard stats
│   ├── Jobs/
│   │   ├── GeneratePdfFromTemplate.php
│   │   └── StampPdfOnDecision.php
│   ├── Policies/
│   │   └── SubmissionPolicy.php           # Authorization logic
│   └── ...
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── Submissions/
│   │   │   │   ├── Index.jsx              # List submission
│   │   │   │   ├── Create.jsx             # Create submission
│   │   │   │   ├── Show.jsx               # View detail
│   │   │   │   ├── Edit.jsx               # Edit submission
│   │   │   │   └── ForDivision.jsx        # Approval list
│   │   │   └── Dashboard.jsx              # Dashboard
│   │   ├── Components/                    # Reusable components
│   │   └── Layouts/                       # Layout templates
│   └── css/
├── routes/
│   ├── web.php                            # Web routes
│   └── auth.php                           # Auth routes
├── database/
│   ├── migrations/                        # Schema files
│   ├── factories/                         # Fake data generators
│   └── seeders/                           # Database seeders
├── public/
│   └── build/                             # Compiled assets
└── storage/
    └── app/
        └── private/                       # Private file storage
```

---

## 🔑 KEY SERVICES & PATTERNS

### PermissionCacheService
- Cache subdivision permissions untuk performa
- Methods: `hasPermission()`, `getPermissionForSubdivision()`
- Cache TTL: 3600 detik (1 jam)

### SubmissionQueryService
- Base queries dengan proper relations
- Methods: `baseQuery()`, `listQuery()`, `detailQuery()`
- Menghindari N+1 queries

### SubmissionListService
- High-level queries untuk list operations
- Methods: `getCompletedSubmissionsForUser()`, `getActiveSubmissionsForDivision()`
- Pagination & filtering

### DashboardStatsService
- Aggregate statistics untuk dashboard
- Methods: `getStats()`, `getPendingItems()`

---

## 📊 FITUR LANJUTAN

### 1. Dynamic Fields
- Setiap document bisa punya field custom
- Tipe: text, number, date, select
- Data disimpan di `data_json` di submission

### 2. Document Numbering
- Auto-generate nomor dokumen dengan prefix
- Prefix per document type
- Sequence counter per prefix

### 3. Filtering & Search
- Search by title, description
- Filter by date range
- Filter by status, document type, division
- Advanced filter dengan multiple criteria

### 4. Audit Trail
- Setiap approval action tercatat di `submission_workflow_steps`
- Who approved/rejected, when, dengan notes
- Full history tersedia di UI

### 5. Performance Optimizations
- Indexed columns untuk fast queries
- Caching permissions di cache layer
- Eager loading relations (no N+1 queries)
- Aggregate functions untuk statistics

---

## 🚀 DEPLOYMENT & OPERATIONS

### Local Development
```bash
composer install
npm install
php artisan key:generate
php artisan migrate --seed
npm run dev
php artisan serve
```

### Production
- Docker setup tersedia
- Nginx config di `docker/nginx.conf`
- Environment variables di `.env`
- Background jobs dengan queue

---

## 📝 CATATAN PENTING UNTUK DEVELOPER

### ✅ Best Practices yang Digunakan
1. **Service Layer Pattern** - Business logic di Services, bukan Controller
2. **Authorization Policies** - Use policies untuk authorization
3. **Eager Loading** - Load relations explicitly, jangan di Model with
4. **Caching** - Cache permission checks dan frequently accessed data
5. **Scopes** - Use query scopes untuk reusable filters
6. **Type Hints** - Strict typing di PHP 8.2+
7. **Comments** - Well documented code dengan docblocks

### ⚙️ Optimasi yang Sudah Dilakukan
1. Database indexes pada kolom yang sering di-filter
2. Subdivision permission caching (1 jam TTL)
3. Proper relation loading (no N+1 queries)
4. Aggregate queries untuk statistics
5. Background jobs untuk PDF generation

### 🔐 Security Features
1. CSRF protection
2. Authorization policies per action
3. Role-based access control
4. Permission checks pada setiap endpoint
5. Input validation pada semua forms
6. Secure file uploads dengan path hashing

---

## 📚 DOKUMENTASI YANG TERSEDIA

Dalam project terdapat dokumentasi lengkap:
- `QUICKSTART.md` - Setup cepat (5 menit)
- `DEVELOPER_SETUP.md` - Setup development environment
- `DOCUMENTATION.md` - Dokumentasi lengkap sistem
- `API_REFERENCE.md` - Semua API endpoints
- `WORKFLOW_DOCUMENTATION.md` - Detail sistem workflow
- `IMPLEMENTATION_CHECKLIST.md` - Checklist fitur yang sudah diimplementasi

---

## 🎯 SIAP UNTUK FITUR BARU

Sekarang saya sudah memahami:
✅ Arsitektur sistem (Laravel + React)
✅ Database schema dan relasi
✅ Alur workflow approval
✅ Sistem role & permission
✅ Patterns & best practices yang digunakan
✅ Service layer & optimization strategies
✅ Frontend structure dengan Inertia.js

**Silakan berikan spesifikasi fitur baru yang ingin Anda buat!** 🚀

Saya siap membantu untuk:
- Feature development
- Database schema changes
- API endpoint creation
- Frontend components
- Business logic implementation
- Testing & debugging
- Documentation

---

*Dokumentasi ini dibuat tanggal: 11 Desember 2025*
*Versi Project: ApproveIt v2*
