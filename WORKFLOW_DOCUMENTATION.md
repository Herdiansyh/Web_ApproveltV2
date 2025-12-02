# Dokumentasi Sistem Workflow ApproveIt

## Overview

Sistem workflow ApproveIT dirancang untuk mengelola proses persetujuan dokumen secara terstruktur melalui beberapa tahapan yang dapat dikonfigurasi. Sistem ini mendukung alur persetujuan multi-level dengan kontrol permission yang granular pada setiap tahap.

---

## 1. Struktur Database Workflow

### 1.1 Tabel Utama

#### `workflows`
- **Tujuan**: Mendefinisikan alur kerja untuk setiap jenis dokumen
- **Field Penting**:
  - `document_id`: Relasi ke jenis dokumen
  - `division_from_id`: Divisi asal pengajuan
  - `division_to_id`: Divisi tujuan akhir
  - `is_active`: Status aktif workflow
  - `total_steps`: Jumlah total tahapan
  - `flow_definition`: Definisi alur dalam JSON (opsional)

#### `workflow_steps`
- **Tujuan**: Mendefinisikan setiap tahapan dalam workflow
- **Field Penting**:
  - `workflow_id`: Relasi ke workflow
  - `division_id`: Divisi yang bertanggung jawab pada tahap ini
  - `step_order`: Urutan tahapan (1, 2, 3, ...)
  - `role`: Role yang dapat bertindak pada tahap ini
  - `is_final_step`: Menandai tahap akhir
  - `actions`: Array aksi yang tersedia (approve, reject, request_next)
  - `can_*`: Permission flags (can_approve, can_reject, dll)

#### `submissions`
- **Tujuan**: Menyimpan data pengajuan dokumen
- **Field Penting**:
  - `workflow_id`: Workflow yang digunakan
  - `current_step`: Tahapan saat ini
  - `status`: Status keseluruhan (pending, approved, rejected)
  - `data_json`: Data dinamis dari form fields

#### `submission_workflow_steps`
- **Tujuan**: Track status setiap tahapan untuk setiap submission
- **Field Penting**:
  - `submission_id`: Relasi ke submission
  - `step_order`: Urutan tahapan
  - `status`: Status tahap (pending, approved, rejected)
  - `approver_id`: User yang melakukan approve/reject
  - `approved_at`: Timestamp aksi
  - `note`: Catatan persetujuan/penolakan

### 1.2 Tabel Permission

#### `subdivision_permissions`
- **Tujuan**: Mengontrol permission user berdasarkan subdivision
- **Field Penting**:
  - `subdivision_id`: Relasi ke subdivision
  - `can_view`: Bisa melihat submission
  - `can_approve`: Bisa approve submission
  - `can_reject`: Bisa reject submission
  - `can_request_next`: Bisa lanjutkan ke tahap berikutnya
  - `can_edit`: Bisa edit submission
  - `can_delete`: Bisa delete submission

---

## 2. Cara Kerja Workflow

### 2.1 Penentuan Workflow untuk Submission

**1. Saat User Membuat Submission:**
```php
// User memilih workflow_id dari form
$validated = $request->validate([
    'workflow_id' => 'required|exists:workflows,id',
    // ...
]);
```

**2. Sistem Melakukan Validasi Workflow:**
```php
$workflow = Workflow::with(['steps', 'steps.division', 'document.fields'])
    ->where('id', $validated['workflow_id'])
    ->where('is_active', true)                    // Workflow harus aktif
    ->whereHas('document', function ($q) {        // Document harus aktif
        $q->where('is_active', true);
    })
    ->firstOrFail();
```

**3. Dasar Pengambilan Workflow:**
- **User Selection**: User memilih workflow saat membuat pengajuan
- **Active Status**: Hanya workflow yang aktif (`is_active = true`)
- **Document Active**: Document terkait harus aktif
- **Division Matching**: User harus berada di divisi yang sesuai dengan `division_from_id`

### 2.2 Inisialisasi Submission

**1. Membuat Submission Record:**
```php
$submission = Submission::create([
    'user_id' => $user->id,
    'division_id' => $user->division_id,
    'workflow_id' => $workflow->id,
    'status' => 'pending',
    'current_step' => 1,                    // Mulai dari step 1
    // ...
]);
```

**2. Membuat Workflow Steps untuk Submission:**
```php
foreach ($steps as $step) {
    SubmissionWorkflowStep::create([
        'submission_id' => $submission->id,
        'division_id' => $step->division_id,
        'step_order' => $step->step_order,
        'status' => 'pending',              // Semua step dimulai dengan pending
    ]);
}
```

---

## 3. Mekanisme Penentuan User per Step

### 3.1 Assignment Berdasarkan Division

Sistem **tidak menetapkan user spesifik** ke workflow step, melainkan menetapkan **division** yang bertanggung jawab:

```php
// Di WorkflowStep model
protected $fillable = [
    'workflow_id',
    'division_id',        // Division yang bertanggung jawab
    'step_order',
    'role',              // Role yang bisa bertindak
    // ...
];
```

### 3.2 Runtime User Determination

User yang bisa bertindak pada step tertentu ditentukan saat runtime dengan kriteria:

#### **A. Division Matching**
```php
// Di SubmissionController approve method
$workflowStep = $submission->workflow->steps
    ->where('step_order', $submission->current_step)
    ->first();

if (!$workflowStep || ($user->role !== 'admin' && $user->division_id !== $workflowStep->division_id)) {
    abort(403, 'Aksi hanya dapat dilakukan oleh divisi pemilik langkah ini.');
}
```

#### **B. Role-Based Access**
```php
// Check role permission
if ($user->role !== 'admin' && $user->division_id !== $workflowStep->division_id) {
    // User tidak memiliki akses
}
```

#### **C. Permission-Based Validation**
User harus memiliki permission yang sesuai di subdivisionnya:

```php
// Check subdivision permission
$permission = SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
    ->where('can_approve', true)  // atau can_reject, dll
    ->first();

if (!$permission) {
    abort(403, 'Anda tidak memiliki izin untuk menyetujui pengajuan ini.');
}
```

### 3.3 Alur Penentuan User untuk Step

#### **Step 1: HR Division**
- `workflow_step.division_id = HR Division ID`
- Semua user di HR subdivision dengan `can_approve = true` bisa approve
- Admin bisa approve dari division manapun

#### **Step 2: Manager Division** 
- `workflow_step.division_id = Manager Division ID`
- Semua user di Manager subdivision dengan `can_approve = true` bisa approve
- User harus berada di division yang sesuai

#### **Step 3: Direktur Division**
- `workflow_step.division_id = Direktur Division ID`
- User dengan role 'direktur' atau di Direktur subdivision
- Biasanya hanya beberapa user spesifik

### 3.4 Tracking Approver

Setiap user yang melakukan approve akan dicatat:

```php
// Saat approve
$currentStep->approver_id = $user->id;        // User yang approve
$currentStep->approved_at = now();           // Waktu approve
$currentStep->save();
```

### 3.5 Contoh Skenario Lengkap

```
Workflow: Document Approval
- Step 1: HR Division (division_id = 1)
- Step 2: Manager Division (division_id = 2) 
- Step 3: Direktur Division (division_id = 3)

Users:
- User A: division_id = 1, subdivision_id = 1, can_approve = true
- User B: division_id = 2, subdivision_id = 2, can_approve = true  
- User C: division_id = 3, subdivision_id = 3, can_approve = true
- User D: role = admin
```

**Flow:**
1. **Step 1**: User A (HR) atau User D (admin) bisa approve
2. **Step 2**: User B (Manager) atau User D (admin) bisa approve  
3. **Step 3**: User C (Direktur) atau User D (admin) bisa approve

### 3.6 Keuntungan Approach Ini

✅ **Multiple users** di同一 division bisa approve  
✅ **Dynamic user assignment** tanpa perlu update workflow  
✅ **Role-based access** untuk admin bypass  
✅ **Permission granularity** per subdivision  

**Kesimpulan:** User yang bisa approve ditentukan oleh kombinasi: **Division Assignment + Subdivision Permission + User Role**.

---

## 4. Alur Proses Workflow

### 4.1 Flow Dasar

```
User Create Submission → Step 1 (Division A) → Step 2 (Division B) → Step 3 (Division C) → Final
```

**1. Initial State:**
- `submission.status = 'pending'`
- `submission.current_step = 1`
- Semua `submission_workflow_steps.status = 'pending'`

**2. Proses Approve pada Setiap Step:**
```php
// Cari current step
$currentStep = $submission->workflowSteps
    ->where('step_order', $submission->current_step)
    ->first();

// Validasi permission
$permission = SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
    ->where('can_approve', true)
    ->first();

// Update status step
$currentStep->status = 'approved';
$currentStep->approver_id = $user->id;
$currentStep->approved_at = now();
$currentStep->save();
```

**3. Logic Perpindahan Step:**
```php
$maxStepOrder = $submission->workflowSteps->max('step_order');
$isFinal = $submission->current_step >= $maxStepOrder;

if ($isFinal) {
    // Final step - selesaikan workflow
    $submission->status = 'Approved by ' . $currentDivName;
} else {
    // Next step
    $nextStepOrder = $submission->current_step + 1;
    $submission->current_step = $nextStepOrder;
    $submission->status = 'Waiting to ' . $nextDivName . ' Division';
}
```

### 4.2 Status Flow

| Current Step | Action | Next Status | Current Step Value |
|--------------|--------|-------------|-------------------|
| Step 1 | Approve | Waiting to Step 2 | 2 |
| Step 2 | Approve | Waiting to Step 3 | 3 |
| Step N | Approve | Approved by [Division] | N (Final) |
| Any Step | Reject | Rejected | Current Step |
| Any Step | Request Next | Waiting to Next | Current Step + 1 |

---

## 5. Sistem Permission

### 5.1 Hierarki Permission

**1. Level Permission:**
- **Workflow Level**: Definisi permission di setiap workflow step
- **Subdivision Level**: Permission global untuk subdivision
- **User Level**: Permission berdasarkan role dan division user

**2. Permission Types:**
- `can_view`: Melihat submission
- `can_approve`: Menyetujui submission
- `can_reject`: Menolak submission
- `can_request_next`: Melanjutkan ke step berikutnya
- `can_edit`: Mengedit submission
- `can_delete`: Menghapus submission

### 5.2 Validasi Permission

**1. Saat Approve:**
```php
// Check workflow step permission
$workflowStep = $submission->workflow->steps
    ->where('step_order', $submission->current_step)
    ->first();

if (!$workflowStep || ($user->role !== 'admin' && $user->division_id !== $workflowStep->division_id)) {
    abort(403, 'Aksi hanya dapat dilakukan oleh divisi pemilik langkah ini.');
}

// Check subdivision permission
$permission = SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
    ->where('can_approve', true)
    ->first();

if (!$permission) {
    abort(403, 'Anda tidak memiliki izin untuk menyetujui pengajuan ini.');
}
```

**2. Logic Permission Check:**
- **Admin Role**: Bypass division check
- **Division Match**: User harus berada di division yang sesuai dengan step
- **Subdivision Permission**: User harus memiliki permission yang sesuai di subdivisionnya
- **Step Status**: Hanya bisa action pada step dengan status 'pending'

### 5.3 Permission Matrix

| User Role | Division | Subdivision Permission | Action Allowed |
|-----------|----------|------------------------|----------------|
| Admin | Any | Any | All actions (bypass) |
| Staff | HR | can_approve=true | Approve HR steps |
| Manager | Finance | can_reject=true | Reject Finance steps |
| Director | Any | can_view=true | View all submissions |

---

## 6. Query & Load Optimization

### 6.1 Service Pattern

**1. SubmissionQueryService:**
- Menghandle query kompleks untuk submission list
- Menggunakan eager loading untuk menghindari N+1
- Implementasi permission checking dengan cache

**2. SubmissionListService:**
- Menghandle data formatting untuk frontend
- Filter berdasarkan user permission
- Pagination dan sorting

### 6.2 Eager Loading Pattern

```php
// Optimal query untuk submission display
$submission = Submission::with([
    'user:id,name,email,division_id',
    'division:id,name', 
    'workflow:id,name,document_id',
    'workflow.document:id,name',
    'workflow.steps:id,workflow_id,step_order,division_id',
    'workflow.steps.division:id,name'
])->findOrFail($id);
```

---

## 7. Special Features

### 7.1 Dynamic Document Fields

**1. Document Type System:**
- Setiap workflow terikat ke document type
- Document memiliki dynamic fields yang dapat dikonfigurasi
- Fields disimpan dalam `data_json` column

**2. Field Types:**
- Text, Number, Date, Select
- Table data (dynamic columns)
- Label (section header)

### 7.2 Series Code Generation

**1. Automatic Numbering:**
```php
// Format: {prefix}{pattern}
// Example: DOC-2025-12-0001
$pattern = $ns->series_pattern ?? "yyyy-mm-####";
$prefix = $ns->prefix ?? "";
$seriesCode = $prefix . date('Y-m-') . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
```

### 7.3 QR Code & Verification

**1. Verification Token:**
- Generate unique token untuk setiap submission
- Digunakan untuk public verification page
- QR code mengandung verification URL

**2. Public Verification:**
- URL: `/verification/{token}`
- Menampilkan detail submission tanpa login
- QR code dapat discan untuk verifikasi

---

## 8. Error Handling & Validation

### 8.1 Common Validations

**1. Workflow Selection:**
- Workflow must exist and active
- Document must be active
- User must have permission to create submission

**2. Step Validation:**
- Current step must be pending
- User must have permission for current step
- Division must match workflow step division

**3. Final Step Validation:**
- All previous steps must be approved
- Cannot approve if any previous step is rejected

### 8.2 Error Scenarios

| Scenario | Error Message | Resolution |
|----------|---------------|------------|
| Invalid workflow | "Workflow tidak ditemukan" | Check workflow_id and active status |
| No permission | "Anda tidak memiliki izin" | Check subdivision permissions |
| Step not pending | "Pengajuan sudah disetujui" | Check current step status |
| Division mismatch | "Aksi hanya dapat dilakukan oleh divisi" | Check user division assignment |

---

## 9. Best Practices

### 9.1 Performance

1. **Eager Loading**: Selalu load relasi yang dibutuhkan
2. **Permission Cache**: Cache permission check untuk frequent access
3. **Index Optimization**: Add indexes untuk frequent queries

### 9.2 Security

1. **Authorization**: Selalu validate permission sebelum action
2. **Data Validation**: Validate semua input data
3. **Audit Trail**: Track semua perubahan status

### 9.3 Maintainability

1. **Service Pattern**: Pisahkan business logic ke service classes
2. **Repository Pattern**: Abstraksi data access
3. **Error Handling**: Consistent error response format

---

## 10. Troubleshooting Guide

### 10.1 Common Issues

**1. Submission tidak muncul di list:**
- Check user permission (can_view)
- Check submission status filter
- Check division assignment

**2. Tidak bisa approve:**
- Check current step status
- Check user subdivision permission
- Check division assignment

**3. Workflow tidak bergerak:**
- Check if current step is final
- Check next step configuration
- Check workflow step ordering

### 10.2 Debug Queries

```php
// Check submission workflow steps
$submission->workflowSteps()->get()->each(function ($step) {
    echo "Step {$step->step_order}: {$step->status} by {$step->approver_id}\n";
});

// Check user permissions
$permissions = SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->first();
```

---

## 11. Future Enhancements

### 11.1 Potential Improvements

1. **Parallel Workflow**: Support multiple approval paths
2. **Conditional Logic**: Step berdasarkan kondisi tertentu
3. **Delegation**: Delegasi approval ke user lain
4. **SLA Tracking**: Track approval time limits
5. **Email Notifications**: Automated notifications untuk setiap step

### 11.2 Scaling Considerations

1. **Queue System**: Async processing untuk heavy operations
2. **Cache Strategy**: Redis untuk permission cache
3. **Database Optimization**: Partitioning untuk large tables
4. **API Rate Limiting**: Prevent abuse

---

## Conclusion

Sistem workflow ApproveIT dirancang dengan pendekatan yang modular dan scalable. Dengan separation of concerns yang jelas antara workflow definition, permission management, dan submission tracking, sistem dapat menangani berbagai skenario persetujuan dokumen dengan fleksibel.

Key strengths:
- **Flexible Workflow Definition**: Mudah dikonfigurasi untuk berbagai kebutuhan
- **Granular Permission**: Kontrol permission yang detail pada setiap level
- **Audit Trail**: Complete tracking untuk compliance
- **Scalable Architecture**: Siap untuk scale dengan volume tinggi
