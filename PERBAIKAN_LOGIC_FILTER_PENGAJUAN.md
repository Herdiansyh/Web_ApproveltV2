# 🔧 PERBAIKAN: LOGIC FILTER PENGAJUAN MASUK & KELUAR

**Tanggal Perbaikan:** 12 Desember 2025  
**Status:** ✅ Selesai  
**Build Status:** ✅ Berhasil

---

## 📋 Masalah yang Diperbaiki

Sebelumnya, kedua halaman menampilkan data yang sama. Kini sudah diperbaiki dengan logic filter yang berbeda sesuai fungsi masing-masing.

---

## 🔄 PERBEDAAN LOGIC

### 1️⃣ PENGAJUAN MASUK (Incoming) 📥

**File:** `SubmissionController::forDivision()`

**Fungsi:**
```
Menampilkan pengajuan yang MEMBUTUHKAN AKSI dari user saat ini
```

**Kriteria Filter:**
```php
->where(function ($q) use ($user, $divisionId, $canApprove) {
    // Hanya tampilkan jika:
    // 1. User punya permission approve/reject
    if ($user->role === 'admin' || $canApprove) {
        // 2. DAN user TERLIBAT di step yang sedang aktif
        $q->whereNotNull('workflow_id')
          ->whereHas('workflow.steps', function ($subQ) use ($divisionId) {
              $subQ->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                   ->where('workflow_steps.division_id', $divisionId);
          });
    }
})
```

**Hasil Query SQL (Simplified):**
```sql
SELECT * FROM submissions
WHERE 
  -- Status waiting (active)
  status IN ('pending', 'waiting_approval')
  
  -- User punya permission approve
  AND user_subdivision_has_can_approve = true
  
  -- Workflow step saat ini adalah divisi user
  AND EXISTS (
    SELECT 1 FROM workflow_steps
    WHERE workflow_steps.workflow_id = submissions.workflow_id
    AND workflow_steps.step_order = submissions.current_step
    AND workflow_steps.division_id = user.division_id
  )
```

**Contoh Kasus yang Tampil:**
```
1. Employee A buat submission → kirim ke Manager
   - Manager login: ✅ TAMPIL (manager punya can_approve, step saat ini divisi manager)
   - Employee A login: ❌ TIDAK tampil (employee tidak punya can_approve)
   - Finance login: ❌ TIDAK tampil (step saat ini bukan finance)

2. Manager buat submission → kirim ke Finance
   - Finance login: ✅ TAMPIL (finance punya can_approve, step saat ini divisi finance)
   - Manager login: ❌ TIDAK tampil (step saat ini bukan manager)
   - Direktur login: ❌ TIDAK tampil (step saat ini bukan direktur)
```

---

### 2️⃣ PENGAJUAN KELUAR (Outgoing) 📤

**File:** `SubmissionController::outgoing()`

**Fungsi:**
```
Menampilkan pengajuan yang DIBUAT USER tapi 
MENUNGGU APPROVAL dari pihak lain (user tidak perlu ambil aksi)
```

**Kriteria Filter:**
```php
->where('user_id', $user->id)  // Dibuat oleh user sendiri
->whereDoesntHave('workflow.steps', function ($q) use ($divisionId) {
    // User TIDAK terlibat di step yang sedang aktif
    $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
      ->where('workflow_steps.division_id', $divisionId);
})
```

**Hasil Query SQL (Simplified):**
```sql
SELECT * FROM submissions
WHERE 
  -- Status waiting (active)
  status IN ('pending', 'waiting_approval')
  
  -- Dibuat oleh user sendiri
  AND user_id = auth_user_id
  
  -- User TIDAK terlibat di step saat ini
  AND NOT EXISTS (
    SELECT 1 FROM workflow_steps
    WHERE workflow_steps.workflow_id = submissions.workflow_id
    AND workflow_steps.step_order = submissions.current_step
    AND workflow_steps.division_id = user.division_id
  )
```

**Contoh Kasus yang Tampil:**
```
1. Employee A buat submission → kirim ke Manager
   - Employee A login: ✅ TAMPIL (dibuat employee, step saat ini manager ≠ employee)
   - Manager login: ❌ TIDAK tampil (tidak dibuat manager)
   - Finance login: ❌ TIDAK tampil (tidak dibuat finance)

2. Manager buat submission → kirim ke Finance (step 2)
   - Manager login: ✅ TAMPIL (dibuat manager, step saat ini finance ≠ manager)
   - Finance login: ❌ TIDAK tampil (tidak dibuat finance)

3. Multi-step workflow:
   - Employee buat → Manager (step 1) → Finance (step 2) → Direktur (step 3)
   
   Saat di step 2 (Finance):
   - Employee login: ✅ TAMPIL (dibuat employee, step ini finance ≠ employee)
   - Manager login: ✅ TAMPIL (dibuat manager, step ini finance ≠ manager)
   - Finance login: ❌ TIDAK tampil (step saat ini adalah finance, jadi masuk incoming)
```

---

## 🎯 COMPARISON TABLE

| Kriteria | Pengajuan Masuk | Pengajuan Keluar |
|----------|---|---|
| Status | Waiting/Active | Waiting/Active |
| Pembuat | Siapa saja | User sendiri |
| Permission | Harus punya can_approve | Tidak ada kriteria |
| Step Saat Ini | User **terlibat** | User **TIDAK terlibat** |
| Aksi User | **Harus approve/reject** | **Menunggu** approval pihak lain |
| Prioritas | **🔴 URGENT** | 🟡 INFO |

---

## 📊 CONTOH FLOW MULTI-STEP

### Skenario: 4-Step Workflow

```
Submission dibuat oleh Employee A
├─ Step 1: Manager (current_step = 1)
├─ Step 2: Finance
├─ Step 3: Direktur
└─ Step 4: CEO

SAAT current_step = 1 (Manager)
────────────────────────────────
📥 Pengajuan Masuk:
  ✅ Manager (punya can_approve, step ini manager)
  
📤 Pengajuan Keluar:
  ✅ Employee A (dibuat employee, step ini manager ≠ employee)
  ❌ Finance (tidak dibuat finance, bukan keluar mereka)
  ❌ Direktur (tidak dibuat direktur, bukan keluar mereka)

❌ TIDAK tampil di mana pun:
  - Finance (step ini bukan finance)
  - Direktur (step ini bukan direktur)
  - CEO (step ini bukan ceo)


SAAT current_step = 2 (Finance) [Manager sudah approve]
────────────────────────────────────────────────────────
📥 Pengajuan Masuk:
  ✅ Finance (punya can_approve, step ini finance)
  
📤 Pengajuan Keluar:
  ✅ Employee A (dibuat employee, step ini finance ≠ employee)
  ✅ Manager (dibuat manager, step ini finance ≠ manager)
  ❌ Direktur (tidak dibuat direktur, bukan keluar mereka)
  
❌ TIDAK tampil di mana pun:
  - Direktur (step ini bukan direktur)
  - CEO (step ini bukan ceo)


SAAT COMPLETED (Status = Approved)
────────────────────────────────────
❌ Tidak tampil di Pengajuan Masuk
❌ Tidak tampil di Pengajuan Keluar
✅ Hanya tampil di "📜 Riwayat Persetujuan"
```

---

## 🔐 PERMISSION CHECKS

### Pengajuan Masuk
```php
// Check 1: User punya permission?
$canApprove = $subdivisionService->hasPermission($user->subdivision_id, 'can_approve');

// Check 2: User divisi terlibat di step saat ini?
->whereHas('workflow.steps', function ($q) {
    $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
      ->where('workflow_steps.division_id', $user->division_id);
})

// BOTH harus TRUE
```

### Pengajuan Keluar
```php
// Check 1: User pembuat?
->where('user_id', $user->id)

// Check 2: User divisi TIDAK terlibat di step saat ini?
->whereDoesntHave('workflow.steps', function ($q) {
    $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
      ->where('workflow_steps.division_id', $user->division_id);
})

// BOTH harus TRUE
```

---

## 🧪 TEST CASE

### Test 1: Simple 2-Step Workflow
```
Setup:
- Employee (Division: Employee)
- Manager (Division: Manager)
- Submission dibuat Employee, workflow: Employee → Manager

Saat Current Step = Manager:
  - Employee lihat Pengajuan Keluar: ✅ (dibuat employee, step ini manager)
  - Manager lihat Pengajuan Masuk: ✅ (punya can_approve, step ini manager)
```

### Test 2: Manager Send to Higher Level
```
Setup:
- Manager A (Division: Manager)
- Finance (Division: Finance)
- Submission dibuat Manager A, workflow: Manager → Finance → CEO

Saat Current Step = Finance:
  - Manager A lihat Pengajuan Keluar: ✅ (dibuat manager, step ini finance)
  - Finance lihat Pengajuan Masuk: ✅ (punya can_approve, step ini finance)
  - Manager A lihat Pengajuan Masuk: ❌ (step ini bukan manager)
```

### Test 3: Employee dengan Permission
```
Setup:
- Employee dengan can_approve permission (edge case)
- Submission dibuat Employee lain
- Workflow: Division A → Division B (Employee divisi)

Saat Current Step = Division B:
  - Employee lihat Pengajuan Masuk: ✅ (punya can_approve, terlibat step ini)
  - Employee pembuat lihat Pengajuan Keluar: ✅ (dibuat employee, step ini bukan employee pembuat)
```

---

## 🚀 DEPLOYMENT CHECKLIST

- ✅ PHP Syntax Check: `php -l SubmissionController.php` 
- ✅ Frontend Build: `npm run build`
- ✅ No Database Migration Needed
- ✅ Git Commit: Selesai
- ✅ Route Testing: `/submissions/division` dan `/submissions/outgoing`

---

## 📝 KODE PERUBAHAN

### Method: forDivision()
```php
public function forDivision(Request $request)
{
    // ... setup code ...
    
    // PERUBAHAN: Hanya filter yang user punya can_approve
    // DAN terlibat di step saat ini
    $query = $this->queryService->baseQuery()
        ->active()
        ->where(function ($q) use ($user, $divisionId, $canApprove) {
            if ($user->role === 'admin' || $canApprove) {
                $q->whereNotNull('workflow_id')
                  ->whereHas('workflow.steps', function ($subQ) use ($divisionId) {
                      $subQ->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                           ->where('workflow_steps.division_id', $divisionId);
                  });
            }
        })
        // ... rest of code ...
}
```

### Method: outgoing()
```php
public function outgoing(Request $request)
{
    // ... setup code ...
    
    // PERUBAHAN: Filter yang dibuat user
    // TAPI user TIDAK terlibat di step saat ini
    $query = $this->queryService->baseQuery()
        ->active()
        ->where('user_id', $user->id)  // Dibuat user
        ->whereDoesntHave('workflow.steps', function ($q) use ($divisionId) {
            // User TIDAK terlibat di step saat ini
            $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
              ->where('workflow_steps.division_id', $divisionId);
        })
        // ... rest of code ...
}
```

---

## 🎓 PEMBELAJARAN

### Key Difference
- **forDivision**: Filter berdasarkan **Permission + Involvement**
- **outgoing**: Filter berdasarkan **Ownership + Non-Involvement**

### Query Pattern
- **Inclusion**: `.whereHas()` - untuk step yang user terlibat
- **Exclusion**: `.whereDoesntHave()` - untuk step yang user TIDAK terlibat

### Real-World Analogy
```
📥 Pengajuan Masuk = Inbox di email
   "Ada dokumen di meja saya yang butuh approval"

📤 Pengajuan Keluar = Sent folder di email
   "Saya kirim dokumen, tunggu approval dari mereka"
```

---

**Status:** READY FOR PRODUCTION ✅
