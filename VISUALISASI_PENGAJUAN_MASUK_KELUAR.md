# 📊 VISUALISASI: PENGAJUAN MASUK vs KELUAR

**Dibuat:** 12 Desember 2025

---

## 🎯 QUICK REFERENCE

### Pengajuan Masuk (📥 Incoming)
```
User yang login: Manager
├─ Punya permission approve? ✅ YES
├─ Terlibat di step saat ini? ✅ YES (step 1 = Manager)
└─ TAMPIL di Pengajuan Masuk? ✅ YES
   "Ada dokumen di meja saya yang butuh approval"
```

### Pengajuan Keluar (📤 Outgoing)
```
User yang login: Employee A
├─ Pembuat? ✅ YES (saya yang bikin)
├─ Terlibat di step saat ini? ❌ NO (step 1 = Manager)
└─ TAMPIL di Pengajuan Keluar? ✅ YES
   "Saya kirim dokumen, tunggu approval dari manager"
```

---

## 🔄 WORKFLOW EXAMPLES

### Example 1: Simple Case (Employee → Manager)

```
┌──────────────────────────────────────────────────────┐
│ SUBMISSION CREATED BY EMPLOYEE                       │
│ Title: "Permohonan Cuti 2 Minggu"                   │
│ Status: WAITING                                      │
│ Current Step: 1 (Manager)                           │
└──────────────────────────────────────────────────────┘

EMPLOYEE LOGIN:
├─ Pengajuan Masuk:     ❌ TIDAK TAMPIL (tidak punya can_approve)
└─ Pengajuan Keluar:    ✅ TAMPIL
                        "Sudah saya kirim, tunggu manager approve"

MANAGER LOGIN:
├─ Pengajuan Masuk:     ✅ TAMPIL
│                       "Ada permohonan cuti yg perlu saya approve"
└─ Pengajuan Keluar:    ❌ TIDAK TAMPIL (tidak dibuat manager)

FINANCE LOGIN:
├─ Pengajuan Masuk:     ❌ TIDAK TAMPIL (step ini bukan finance)
└─ Pengajuan Keluar:    ❌ TIDAK TAMPIL (tidak dibuat finance)
```

---

### Example 2: Multi-Step (Employee → Manager → Finance)

```
STEP 1: MANAGER (current_step = 1)
────────────────────────────────

SUBMISSION: "Permohonan Training"
Created by: Employee A
Status: WAITING
Current Step: Manager

DASHBOARD:
┌────────────────────────────────┐
│ EMPLOYEE A:                    │
│ ✅ Pengajuan Keluar            │
│    - Step saat ini: Manager    │
│    - User divisi: Employee     │
│    - Tidak terlibat → Keluar   │
└────────────────────────────────┘

┌────────────────────────────────┐
│ MANAGER:                       │
│ ✅ Pengajuan Masuk             │
│    - Step saat ini: Manager    │
│    - User divisi: Manager      │
│    - Terlibat → Masuk          │
│    - Punya can_approve: YES    │
│                                │
│ 📋 ACTIONS AVAILABLE:          │
│ • Approve                      │
│ • Reject                       │
└────────────────────────────────┘

┌────────────────────────────────┐
│ FINANCE:                       │
│ ❌ Tidak ada di mana pun       │
│    - Step saat ini: Manager    │
│    - User divisi: Finance      │
│    - Belum terlibat            │
└────────────────────────────────┘


STEP 2: FINANCE (current_step = 2) [Manager approve]
──────────────────────────────────────

DASHBOARD:
┌────────────────────────────────┐
│ EMPLOYEE A:                    │
│ ✅ Pengajuan Keluar            │
│    - Step saat ini: Finance    │
│    - User divisi: Employee     │
│    - Tidak terlibat → Keluar   │
│    - Status: "Waiting approval │
│              from Finance"     │
└────────────────────────────────┘

┌────────────────────────────────┐
│ MANAGER:                       │
│ ✅ Pengajuan Keluar            │
│    - Step saat ini: Finance    │
│    - User divisi: Manager      │
│    - Tidak terlibat → Keluar   │
│    - Status: "Approved,        │
│              waiting Finance"  │
└────────────────────────────────┘

┌────────────────────────────────┐
│ FINANCE:                       │
│ ✅ Pengajuan Masuk             │
│    - Step saat ini: Finance    │
│    - User divisi: Finance      │
│    - Terlibat → Masuk          │
│    - Punya can_approve: YES    │
│                                │
│ 📋 ACTIONS AVAILABLE:          │
│ • Approve                      │
│ • Reject                       │
└────────────────────────────────┘


STEP 3: COMPLETED (Status = Approved)
──────────────────────────────────────

DASHBOARD:
┌────────────────────────────────┐
│ EMPLOYEE A:                    │
│ ❌ Pengajuan Keluar            │
│ ❌ Pengajuan Masuk             │
│ ✅ Riwayat Persetujuan (DONE)  │
│    - Status: Approved          │
│    - Approved at: 2025-12-12   │
│    - Action: Download result   │
└────────────────────────────────┘

┌────────────────────────────────┐
│ MANAGER:                       │
│ ❌ Pengajuan Keluar            │
│ ❌ Pengajuan Masuk             │
│ ✅ Riwayat Persetujuan (DONE)  │
│    - Status: Approved          │
│    - Approved by Finance       │
│    - Action: View history      │
└────────────────────────────────┘

┌────────────────────────────────┐
│ FINANCE:                       │
│ ❌ Pengajuan Masuk             │
│ ❌ Pengajuan Keluar            │
│ ✅ Riwayat Persetujuan (DONE)  │
│    - Status: Approved          │
│    - Approved at: 2025-12-12   │
│    - Action: Download result   │
└────────────────────────────────┘
```

---

## 🧮 LOGIC DECISION TREE

### User login ke Pengajuan Masuk?

```
START: Is this submission in Pengajuan Masuk?
├─ Is status = waiting/active? 
│  └─ NO → Not shown ❌
│  └─ YES → Continue
│
├─ Does user have can_approve permission?
│  └─ NO → Not shown ❌
│  └─ YES (or admin) → Continue
│
├─ Is user's division involved in current step?
│  └─ NO → Not shown ❌
│  └─ YES → SHOW IN PENGAJUAN MASUK ✅
│
END: User sees this in Pengajuan Masuk
```

### User login ke Pengajuan Keluar?

```
START: Is this submission in Pengajuan Keluar?
├─ Is status = waiting/active?
│  └─ NO → Not shown ❌
│  └─ YES → Continue
│
├─ Is this submission created by current user?
│  └─ NO → Not shown ❌
│  └─ YES → Continue
│
├─ Is user's division involved in current step?
│  └─ YES → Not shown ❌ (should be in Pengajuan Masuk)
│  └─ NO → SHOW IN PENGAJUAN KELUAR ✅
│
END: User sees this in Pengajuan Keluar
```

---

## 📈 MATRIX: WHO SEES WHAT

### Scenario: Employee A creates submission, routes to Manager → Finance → CEO

```
                          STEP 1: Manager    STEP 2: Finance    STEP 3: CEO
                          ───────────────    ──────────────     ──────────
Employee A (Pembuat):
├─ Masuk                        ❌                ❌                ❌
└─ Keluar                       ✅                ✅                ✅
                          "Waiting manager"  "Waiting finance"  "Waiting CEO"

Manager (Step 1):
├─ Masuk                        ✅                ❌                ❌
│                          "Approve me!"    (Step bukan manager)
└─ Keluar                       ❌                ❌                ❌
                          (Tidak dibuat manager)

Finance (Step 2):
├─ Masuk                        ❌                ✅                ❌
│                    (Step 1 ≠ Finance)    "Approve me!"    (Step 2 ≠ CEO)
└─ Keluar                       ❌                ❌                ❌
                          (Tidak dibuat finance)

CEO (Step 3):
├─ Masuk                        ❌                ❌                ✅
│                    (Step bukan CEO)            "Approve me!"
└─ Keluar                       ❌                ❌                ❌
                          (Tidak dibuat CEO)

Admin:
├─ Masuk                        ✅                ✅                ✅
│                    (Admin bisa see all steps di Masuk)
└─ Keluar                       ❌                ❌                ❌
                          (Tidak dibuat admin)
```

---

## 🎯 KEY DIFFERENCES TABLE

| Aspek | Pengajuan Masuk | Pengajuan Keluar |
|-------|---|---|
| **Purpose** | Ada dokumen butuh aksi saya | Saya tunggu aksi mereka |
| **Ownership Check** | Tidak perlu | ✅ Harus pembuat sendiri |
| **Permission Check** | ✅ Harus punya can_approve | Tidak perlu |
| **Step Check** | ✅ Harus terlibat di step ini | ✅ Harus TIDAK terlibat |
| **Action Available** | ✅ Approve/Reject | ❌ Hanya view |
| **Urgency** | 🔴 HIGH | 🟡 LOW |
| **Email Notify?** | ✅ Yes (needs action) | ❌ No (just info) |

---

## ⚡ SQL EQUIVALENT

### Pengajuan Masuk Query
```sql
SELECT s.* FROM submissions s
WHERE 
  -- Status waiting
  s.status IN ('pending', 'waiting_approval')
  
  -- Created by anyone
  -- (not filtered by user_id)
  
  -- User has permission
  AND EXISTS (
    SELECT 1 FROM subdivision_permissions sp
    WHERE sp.subdivision_id = ?
    AND sp.can_approve = 1
  )
  
  -- User divisi involved in current step
  AND EXISTS (
    SELECT 1 FROM workflow_steps ws
    WHERE ws.workflow_id = s.workflow_id
    AND ws.step_order = s.current_step
    AND ws.division_id = ?
  )
ORDER BY s.created_at DESC;
```

### Pengajuan Keluar Query
```sql
SELECT s.* FROM submissions s
WHERE 
  -- Status waiting
  s.status IN ('pending', 'waiting_approval')
  
  -- Created by current user
  AND s.user_id = ?
  
  -- User divisi NOT involved in current step
  AND NOT EXISTS (
    SELECT 1 FROM workflow_steps ws
    WHERE ws.workflow_id = s.workflow_id
    AND ws.step_order = s.current_step
    AND ws.division_id = ?
  )
ORDER BY s.created_at DESC;
```

---

**Version:** 1.0  
**Last Updated:** 12 Desember 2025
