# 📋 PERBAIKAN LOGIKA PENGAJUAN MASUK DAN KELUAR

**Tanggal:** 16 Desember 2025  
**Status:** ✅ Selesai

---

## 🎯 Ringkasan Perbaikan

Memperbaiki logika penampilan data antara "Pengajuan Masuk" dan "Pengajuan Keluar" setelah pemisahan tampilan. Perbaikan memastikan bahwa:

1. ✅ User selalu melihat pengajuan mereka sendiri di "Pengajuan Keluar"
2. ✅ User dari divisi yang sama dengan `can_view` permission dapat melihat pengajuan di divisi tersebut di "Pengajuan Keluar"
3. ✅ User melihat pengajuan di "Pengajuan Masuk" jika active workflow step ditujukan ke divisinya dan mereka punya permission action (approve/reject/request_next)
4. ✅ Permission dan workflow yang ada tidak berubah

---

## 🔧 PERUBAHAN KODE

### File: `app/Http/Controllers/SubmissionController.php`

#### 1. Method `forDivision()` - Pengajuan Masuk

**Perubahan:**

-   ✅ Tambah check untuk ketiga permission action: `can_approve`, `can_reject`, `can_request_next`
-   ✅ Gunakan `getMultiplePermissions()` untuk efisiensi
-   ✅ Jika user memiliki SALAH SATU dari ketiga permission tersebut, tampilkan submission

**Kode Lama:**

```php
$canApprove = $subdivisionId
    ? $this->permissionService->hasPermission($subdivisionId, 'can_approve')
    : false;

$query = $this->queryService->baseQuery()
    ->active()
    ->where(function ($q) use ($user, $divisionId, $canApprove) {
        if ($user->role === 'admin' || $canApprove) {
            // ...
        }
    });
```

**Kode Baru:**

```php
// Check if user has any action permission (approve, reject, or request_next)
$hasActionPermission = false;
if ($user->role === 'admin') {
    $hasActionPermission = true;
} elseif ($subdivisionId) {
    $actionPerms = $this->permissionService->getMultiplePermissions(
        $subdivisionId,
        ['can_approve', 'can_reject', 'can_request_next']
    );
    $hasActionPermission = in_array(true, $actionPerms);
}

$query = $this->queryService->baseQuery()
    ->active()
    ->where(function ($q) use ($user, $divisionId, $hasActionPermission) {
        if ($user->role === 'admin' || $hasActionPermission) {
            // ...
        }
    });
```

---

#### 2. Method `outgoing()` - Pengajuan Keluar

**Perubahan:**

-   ✅ Tampilkan submission yang dibuat oleh user ATAU dari divisi yang sama dengan `can_view` permission
-   ✅ EXCLUDE submission jika current step = divisi user (kecuali pembuat)
-   ✅ Logika yang benar: pembuat selalu melihat pengajuannya

**Kode Lama:**

```php
$query = $this->queryService->baseQuery()
    ->active()
    ->where('user_id', $user->id)  // Hanya milik user
    ->whereDoesntHave('workflow.steps', function ($q) use ($divisionId) {
        $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
          ->where('workflow_steps.division_id', $divisionId);
    })
```

**Kode Baru:**

```php
// Check if user has can_view permission
$canView = $subdivisionId
    ? $this->permissionService->hasPermission($subdivisionId, 'can_view')
    : false;

$query = $this->queryService->baseQuery()
    ->active()
    ->where(function ($q) use ($user, $divisionId, $canView) {
        // Pengajuan dibuat oleh user sendiri
        $q->where('user_id', $user->id);

        // ATAU pengajuan dari divisi yang sama dengan can_view permission
        if ($canView) {
            $q->orWhere(function ($or) use ($divisionId, $user) {
                $or->where('division_id', $divisionId)
                   ->where('user_id', '!=', $user->id)  // Bukan pembuat
                   ->whereNotNull('workflow_id');
            });
        }
    })
    // EXCLUDE jika current step = divisi user (kecuali pembuat)
    ->where(function ($q) use ($user, $divisionId) {
        $q->where('user_id', $user->id)  // Pembuat selalu lihat
          ->orWhereDoesntHave('workflow.steps', function ($subQ) use ($divisionId) {
              // Bukan pembuat: exclude jika terlibat di step saat ini
              $subQ->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                   ->where('workflow_steps.division_id', $divisionId);
          });
    })
```

---

## 📊 LOGIKA BISNIS

### Pengajuan Masuk (submissions.forDivision)

User akan melihat submission jika:

1. Status submission: `waiting` (belum selesai)
2. **DAN** workflow step saat ini ditujukan ke divisi user
3. **DAN** user memiliki SALAH SATU permission action:
    - `can_approve` ✅
    - `can_reject` ✅
    - `can_request_next` ✅

**Contoh:**

```
User: Manager HR (division_id: 1, subdivision_id: 5)
Permissions: can_approve = true

Submission A:
- status: waiting
- current_step: 1 (step 1 = divisi HR)
- workflow step 1 → division_id = 1 (HR)
→ ✅ TAMPIL di "Pengajuan Masuk" (Manager dapat approve)

Submission B:
- status: waiting
- current_step: 2 (step 2 = divisi Finance)
- workflow step 2 → division_id = 2 (Finance)
→ ❌ TIDAK TAMPIL (bukan divisi Manager)
```

---

### Pengajuan Keluar (submissions.outgoing)

User akan melihat submission jika:

1. Status submission: `waiting` (belum selesai)
2. **DAN** submission dibuat oleh user sendiri ✅
   **ATAU** submission dibuat oleh user dari divisi yang sama + user punya `can_view` permission ✅
3. **TAPI TIDAK jika:**
    - Submission dibuat oleh user lain AND current step = divisi user
    - (Kecuali user adalah pembuat - pembuat selalu lihat)

**Contoh Skenario 1: User membuat submission**

```
User: Employee A (division_id: 1, user_id: 10)

Submission: dibuat oleh Employee A
- user_id = 10 (Employee A)
- current_step = 1 (Manager)
→ ✅ TAMPIL di "Pengajuan Keluar"
   (Employee A adalah pembuat, selalu lihat)
```

**Contoh Skenario 2: User dari divisi yang sama melihat dengan can_view**

```
User: Manager HR (division_id: 1, subdivision_id: 5)
Permissions: can_view = true

Submission: dibuat oleh Employee B (user_id: 11, division_id: 1)
- user_id = 11 (bukan Manager)
- division_id = 1 (sama dengan Manager)
- current_step = 2 (Finance, bukan HR)
→ ✅ TAMPIL di "Pengajuan Keluar"
   (Manager punya can_view, submission dari divisi yang sama,
    dan Manager tidak terlibat di step saat ini)
```

**Contoh Skenario 3: User dari divisi yang sama TIDAK melihat jika terlibat**

```
User: Manager HR (division_id: 1, subdivision_id: 5)
Permissions: can_view = true

Submission: dibuat oleh Employee B (user_id: 11, division_id: 1)
- user_id = 11 (bukan Manager)
- division_id = 1 (sama dengan Manager)
- current_step = 1 (Manager, yaitu HR)
→ ❌ TIDAK TAMPIL di "Pengajuan Keluar"
   (Manager terlibat di step saat ini → tampil di "Pengajuan Masuk" sebaliknya)
```

---

## 🧪 TESTING CHECKLIST

### Test Case 1: User Pembuat Submission

```
1. Login sebagai Employee A
2. Buat submission ke Manager
3. Buka "📤 Pengajuan Keluar" → ✅ TAMPIL submission A
4. Buka "📥 Pengajuan Masuk" → ❌ TIDAK tampil (bukan manager)
```

### Test Case 2: Manager Melihat Submission untuk Approval

```
1. Login sebagai Manager
2. Buka "📥 Pengajuan Masuk" → ✅ TAMPIL submission dari Employee A
3. Buka "📤 Pengajuan Keluar" → ❌ TIDAK tampil (bukan pembuat, dan Manager ada di step saat ini)
4. Approve submission
5. Status berubah → EXCLUDE dari kedua view (completed)
```

### Test Case 3: User Divisi Sama dengan can_view

```
1. Login sebagai Finance Manager (can_view = true)
2. Employee HR buat submission untuk Finance
3. Finance Manager buka "📤 Pengajuan Keluar" → ✅ TAMPIL
   (dari divisi yang sama, can_view = true, tidak terlibat di step saat ini)
4. Finance Manager buka "📥 Pengajuan Masuk" → ❌ TIDAK tampil
   (can_approve = false, tidak punya action permission)
```

### Test Case 4: Manager dengan can_request_next Permission

```
1. Setup: Manager punya can_request_next = true, can_approve = false
2. Submission dikirim ke Manager untuk step saat ini
3. Manager buka "📥 Pengajuan Masuk" → ✅ TAMPIL
   (can_request_next = true, yaitu action permission)
4. Manager klik "Reviewed" button → Request Next action
5. Submission forward ke step berikutnya
```

### Test Case 5: Multi-step Workflow

```
1. Employee create submission
   - Step 1: Manager
   - Employee: see in "📤 Pengajuan Keluar" ✅

2. Manager approve
   - Step 2: Finance
   - Manager: NOT in "📥 Pengajuan Masuk" (tidak step 2)
   - Manager: NOT in "📤 Pengajuan Keluar" (bukan pembuat)
   - Employee: still in "📤 Pengajuan Keluar" ✅

3. Finance approve
   - Step 3: Direktur
   - Finance: NOT in incoming/outgoing (completed)
   - Employee: still in "📤 Pengajuan Keluar" ✅

4. Direktur approve
   - Status: Approved
   - All: NOT in incoming/outgoing (completed)
```

---

## 📝 NOTES

-   **Permission Checking**: Menggunakan `PermissionCacheService` yang sudah ada (cache 1 jam)
-   **Action Permissions**: `can_approve`, `can_reject`, `can_request_next` semua dianggap sebagai "aksi" yang memenuhi syarat untuk "Pengajuan Masuk"
-   **Creator Priority**: Pembuat submission SELALU melihat submission mereka di "Pengajuan Keluar", terlepas dari workflow step
-   **can_view Permission**: Hanya berlaku untuk melihat pengajuan dari orang lain di divisi yang sama di "Pengajuan Keluar"
-   **No Database Changes**: Perbaikan hanya pada query logic, tidak ada migration

---

## 🔍 VERIFIKASI

✅ Perbaikan hanya mencakup logika pemisahan dan penampilan data  
✅ Tidak mengubah permission system yang sudah ada  
✅ Tidak mengubah workflow logic  
✅ `requestNext` tetap ada dan berfungsi dengan label "Diketahui" (reviewed) di halaman show

---

**Status: READY FOR TESTING** ✅
