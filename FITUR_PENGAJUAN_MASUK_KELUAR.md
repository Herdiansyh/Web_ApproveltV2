# 📋 FITUR PERUBAHAN TAMPILAN PENGAJUAN

**Tanggal Implementasi:** 12 Desember 2025  
**Status:** ✅ Selesai

---

## 📝 Ringkasan Perubahan

Fitur ini mengubah alur tampilan list persetujuan pengajuan dari satu menu menjadi dua menu terpisah:

1. **Pengajuan Masuk** - Submission yang user harus ambil tindakan (approve/reject)
2. **Pengajuan Keluar** - Submission yang user buat tapi menunggu approval dari pihak lain

---

## 🔄 Alur Kerja Setelah Implementasi

### User membuka menu Sidebar:

```
📥 Pengajuan Masuk  ← Submissions yang butuh user ambil aksi
📤 Pengajuan Keluar ← Submissions yang user buat, menunggu approval
📄 Lihat Pengajuan  ← (Tidak berubah) Semua submission user
📜 Riwayat Persetujuan ← (Tidak berubah) Completed submissions
```

---

## 📊 KATEGORI SUBMISSION

### Pengajuan Masuk (submissions.forDivision)
**Karakteristik:**
- ✅ Status: `waiting` (belum completed)
- ✅ User punya **permission approve/reject**
- ✅ User **terlibat dalam workflow step saat ini**
- ✅ User **harus mengambil tindakan**

**Contoh:**
```
Manager divisi HR mendapat pengajuan untuk approval.
Status: waiting, current_step: 1 (di divisi HR)
Manager HR: permission can_approve = true
→ Masuk kategori "Pengajuan Masuk" ✅
```

### Pengajuan Keluar (submissions.outgoing)
**Karakteristik:**
- ✅ Status: `waiting` (belum completed)
- ✅ **Dibuat oleh user sendiri** (user_id = auth user)
- ✅ User **tidak punya permission approve** ATAU
- ✅ User **tidak terlibat dalam workflow step saat ini**
- ✅ User **hanya menunggu approval dari pihak lain**

**Contoh:**
```
Employee membuat submission dan mengirim untuk approval.
Status: waiting, current_step: 1 (di divisi Manager)
Employee: permission can_approve = false
→ Masuk kategori "Pengajuan Keluar" ✅

Atau:

Manager membuat submission untuk approval manager lain.
Status: waiting, current_step: 2 (di divisi Finance)
Manager: permission can_approve = true, 
         tapi current_step divisinya bukan Finance
→ Masuk kategori "Pengajuan Keluar" ✅
```

---

## 🔧 PERUBAHAN KODE

### 1. **Sidebar.jsx** - Update Navigation Menu

**File:** [resources/js/Components/Sidebar.jsx](resources/js/Components/Sidebar.jsx)

**Perubahan:**
```jsx
// SEBELUM:
- "Lihat List Persetujuan" → submissions.forDivision

// SESUDAH:
- "Pengajuan Masuk" → submissions.forDivision
- "Pengajuan Keluar" → submissions.outgoing
```

### 2. **web.php** - Tambah Route Baru

**File:** [routes/web.php](routes/web.php)

**Perubahan:**
```php
// DITAMBAH:
Route::get('/submissions/outgoing', [SubmissionController::class, 'outgoing'])
    ->name('submissions.outgoing');
```

### 3. **SubmissionController.php** - Method Outgoing Baru

**File:** [app/Http/Controllers/SubmissionController.php](app/Http/Controllers/SubmissionController.php)

**Perubahan:**
```php
/**
 * Pengajuan Keluar = Submission dibuat oleh user + status waiting
 * + User tidak punya permission approve/reject ATAU tidak terlibat di step saat ini
 */
public function outgoing(Request $request)
{
    // Logic:
    // 1. Filter: where('user_id', $user->id) - dibuat user
    // 2. Filter: active() - status waiting
    // 3. Filter: 
    //    - Jika user TIDAK punya can_approve → semua masuk kategori outgoing
    //    - Jika user PUNYA can_approve → exclude yang dia terlibat di current step
    
    $submissions = $query->latest()->paginate(10);
    
    return Inertia::render('Submissions/Outgoing', [
        'submissions' => $submissions,
        'userDivision' => $user->division,
        'statusFilter' => $statusFilter,
        'availablePrefixes' => $availablePrefixes,
    ]);
}
```

**Logic Filter:**
```php
->where('user_id', $user->id)  // Dibuat oleh user
->where(function ($q) use ($user, $canApprove, $divisionId) {
    if (!$canApprove) {
        // User tidak punya permission → semua pengajuan masuk outgoing
        $q->whereRaw('1=1');
    } else {
        // User punya permission → exclude yang dia terlibat di step saat ini
        $q->whereDoesntHave('workflow.steps', function ($q) use ($divisionId) {
            $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
              ->where('workflow_steps.division_id', $divisionId);
        });
    }
})
```

### 4. **ForDivision.jsx** - Update Title/Label

**File:** [resources/js/Pages/Submissions/ForDivision.jsx](resources/js/Pages/Submissions/ForDivision.jsx)

**Perubahan:**
```jsx
// SEBELUM:
<h2>📁 Pengajuan Masuk ke Divisi Saya</h2>
<div>📁 Daftar Pengajuan Diproses</div>

// SESUDAH:
<h2>📥 Pengajuan Masuk</h2>
<div>📥 Daftar Pengajuan yang Butuh Tindakan</div>
```

### 5. **Outgoing.jsx** - Update Component

**File:** [resources/js/Pages/Submissions/Outgoing.jsx](resources/js/Pages/Submissions/Outgoing.jsx)

**Perubahan:**
```jsx
// SEBELUM:
export default function ForDivision({...})

// SESUDAH:
export default function Outgoing({...})

// SEBELUM:
<h2>📁 Pengajuan Masuk ke Divisi Saya</h2>
<div>📁 Daftar Pengajuan Diproses</div>

// SESUDAH:
<h2>📤 Pengajuan Keluar</h2>
<div>📤 Daftar Pengajuan Menunggu Persetujuan</div>
```

---

## ✨ FITUR-FITUR YANG SAMA

Kedua page (ForDivision & Outgoing) memiliki fitur yang sama:

- ✅ **Search** - Cari berdasarkan title
- ✅ **Date Filter** - Filter tanggal single/range
- ✅ **Advanced Filter** - Filter by doctype, prefix, division
- ✅ **Pagination** - Navigasi halaman
- ✅ **Actions** - Edit/Delete (untuk submission yang belum approved)
- ✅ **Status Badge** - Tampil status dengan warna berbeda
- ✅ **Responsive** - Mobile & desktop friendly

---

## 🧪 TESTING CHECKLIST

### Test Case 1: Employee membuat submission
```
1. Login sebagai Employee A
2. Buat submission baru
3. Kirim ke Manager
4. Masuk "📥 Pengajuan Masuk" di sidebar → ❌ TIDAK tampil (bukan manager)
5. Masuk "📤 Pengajuan Keluar" di sidebar → ✅ TAMPIL
6. Status: "Waiting confirmation to Manager"
```

### Test Case 2: Manager approve submission
```
1. Login sebagai Manager
2. Masuk "📥 Pengajuan Masuk" → ✅ TAMPIL submission dari employee
3. Approval form muncul ✅
4. Setelah approve/reject → redirect ke "📥 Pengajuan Masuk"
```

### Test Case 3: Manager membuat submission untuk Direktur
```
1. Login sebagai Manager
2. Buat submission baru, kirim ke Direktur
3. Masuk "📤 Pengajuan Keluar" → ✅ TAMPIL
   (Karena: dibuat manager, tapi current_step di Direktur)
4. Manager tidak bisa approve (bukan step Manager) ✅
```

### Test Case 4: Multi-step workflow
```
1. Employee buat submission
   - Step 1: Manager → Employee lihat di "📤 Pengajuan Keluar"
   
2. Manager approve
   - Step 2: Finance
   - Manager: lihat di "📤 Pengajuan Keluar" (tidak ada di step 2)
   - Employee: lihat di "📤 Pengajuan Keluar" (pembuat)
   
3. Finance approve
   - Step 3: Direktur
   - Finance: lihat di "📤 Pengajuan Keluar" (tidak ada di step 3)
   
4. Direktur approve
   - Status: Approved
   - Semua: tidak tampil di incoming/outgoing (completed)
   - Semua: lihat di "📜 Riwayat Persetujuan"
```

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  SUBMISSION CREATED                                         │
│  (Submission dibuat oleh User A, status: waiting)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─ Assigned to Divisi B
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
    User A                              User B (Divisi B)
    (Employee)                          (Manager)
         │                                     │
         │                                     │
    📤 Outgoing                          📥 Incoming
    "Waiting approval                   "Need my action"
     from Manager"                       "Approve/Reject"
         │                                     │
         │                          ┌──────────┴──────────┐
         │                          │                     │
         │                       Approve              Reject
         │                          │                     │
         │                    ┌──────┴──────┐            │
         │                    │              │            │
         │              Step 2 Finance    Rejected ───┐   │
         │                    │              │        │   │
         │               📤 Outgoing      📤 Outgoing │   │
         │               (Manager)        (Manager)   │   │
         │                                            │   │
         │ (Employee masih di outgoing, awaiting      │   │
         │  approval dari Finance)                    │   │
         │                                            │   │
         └────────────────────┬──────────────────────┬┘   │
                              │                      │    │
                         Final Approval          Rejected │
                         (atau reject)               │    │
                              │                      │    │
                         ✅ Completed              ✅ Rejected
                         📜 Riwayat                📜 Riwayat
```

---

## 🚀 DEPLOYMENT INSTRUCTIONS

1. **Frontend Build**
   ```bash
   npm run build
   # Sudah berhasil, files di public/build/
   ```

2. **No Database Migration Needed**
   - Tidak ada perubahan database schema
   - Query menggunakan relasi yang sudah ada

3. **Clear Cache (Optional)**
   ```bash
   php artisan route:clear
   php artisan view:clear
   ```

4. **Test di Production**
   - Coba akses: `/submissions/division` → Pengajuan Masuk ✅
   - Coba akses: `/submissions/outgoing` → Pengajuan Keluar ✅
   - Check sidebar menu ✅

---

## 📌 NOTES

- **No BC Break** - Endpoint lama `/submissions/division` masih berfungsi
- **Data Filtering di Backend** - Logika sudah di controller, frontend hanya display
- **Permission Check** - Menggunakan `PermissionCacheService` yang sudah ada
- **Pagination** - Sama seperti page lain (10 items per page)
- **Real-time update** - Jika ada approval, refresh page untuk lihat update

---

## 📞 CONTACT & SUPPORT

Jika ada pertanyaan atau issue:
- Check query logic di `SubmissionController::outgoing()`
- Check filter logic di `Outgoing.jsx` & `ForDivision.jsx`
- Check route definition di `routes/web.php`

---

**Status: READY FOR PRODUCTION** ✅
