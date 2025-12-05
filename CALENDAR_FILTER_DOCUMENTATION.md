# Fitur Filter Kalender - Dokumentasi

## Ringkasan
Telah ditambahkan fitur filter kalender pada tiga halaman utama aplikasi ApproveIt:
1. **Lihat Pengajuan** (Index.jsx) - Halaman untuk melihat pengajuan yang telah selesai
2. **List Persetujuan** (ForDivision.jsx) - Halaman pengajuan yang masuk ke divisi
3. **Riwayat Pengajuan** (History.jsx) - Halaman riwayat pengajuan yang telah diproses

## Fitur yang Ditambahkan

### 1. Komponen DateFilter Reusable
**File:** `resources/js/Components/DateFilter.jsx`

Komponen ini menyediakan interface kalender yang user-friendly dengan dua mode filtering:
- **Tanggal Tertentu**: Filter data berdasarkan satu tanggal spesifik
- **Rentang Tanggal**: Filter data dalam interval waktu tertentu (dari tanggal awal hingga akhir)

#### Props:
- `onFilterChange` (function): Callback yang dipanggil saat filter berubah
- `placeholder` (string): Text placeholder yang ditampilkan
- `label` (string): Label untuk field filter

#### Output onFilterChange:
```javascript
{
    startDate: Date | null,    // Tanggal mulai
    endDate: Date | null,      // Tanggal akhir
    mode: 'single' | 'range' | null  // Mode filter yang dipilih
}
```

### 2. Styling Kalender Custom
**File:** `resources/css/calendar-custom.css`

Mengatur styling untuk komponen react-calendar agar sesuai dengan design system aplikasi:
- Warna yang sesuai dengan tema (primary, muted, border, etc.)
- Ukuran font yang responsif
- Animasi hover dan selected states
- Dark mode support

### 3. Integrasi ke Tiga Halaman

#### Index.jsx (Lihat Pengajuan)
```jsx
// Import dan setup state
import DateFilter from "@/Components/DateFilter";
import { isWithinInterval, parseISO } from "date-fns";

const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    mode: null,
});

// Filter logic menggunakan useMemo
const filteredSubmissions = useMemo(() => {
    let result = submissions.data.filter((s) =>
        s.title.toLowerCase().includes(filter.toLowerCase())
    );

    if (dateFilter.mode === "single" && dateFilter.startDate) {
        result = result.filter((s) => {
            const createdDate = new Date(s.created_at);
            const filterDate = new Date(dateFilter.startDate);
            return createdDate.toDateString() === filterDate.toDateString();
        });
    } else if (dateFilter.mode === "range" && dateFilter.startDate && dateFilter.endDate) {
        result = result.filter((s) => {
            const createdDate = parseISO(s.created_at);
            return isWithinInterval(createdDate, {
                start: dateFilter.startDate,
                end: dateFilter.endDate,
            });
        });
    }

    return result;
}, [filter, dateFilter, submissions.data]);
```

#### ForDivision.jsx (List Persetujuan)
Implementasi identik dengan Index.jsx, dengan struktur filter yang sama.

#### History.jsx (Riwayat Pengajuan)
Implementasi identik dengan Index.jsx, dengan filter tambahan untuk data riwayat.

## Instalasi Dependencies

Package yang digunakan:
```json
{
    "react-calendar": "^4.x.x",
    "date-fns": "^2.x.x"
}
```

Sudah diinstall via npm:
```bash
npm install react-calendar date-fns
```

## Cara Penggunaan

### Pengguna akhir:
1. Buka halaman Lihat Pengajuan, List Persetujuan, atau Riwayat Pengajuan
2. Klik pada field kalender yang tersedia
3. Pilih mode filter:
   - **Tanggal Tertentu**: Langsung klik tanggal yang diinginkan
   - **Rentang Tanggal**: Klik tanggal awal, kemudian tanggal akhir, lalu klik tombol "Terapkan Filter"
4. Data akan otomatis tersaring berdasarkan pilihan tanggal
5. Untuk menghapus filter, klik tombol X di samping field kalender

### Developer:
Untuk menambahkan filter kalender ke halaman baru:

1. Import komponen dan fungsi yang diperlukan:
```jsx
import DateFilter from "@/Components/DateFilter";
import { isWithinInterval, parseISO } from "date-fns";
```

2. Setup state untuk menyimpan filter:
```jsx
const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    mode: null,
});

const handleDateFilterChange = (filterData) => {
    setDateFilter(filterData);
};
```

3. Tambahkan logic filter menggunakan useMemo:
```jsx
const filteredData = useMemo(() => {
    let result = data;

    if (dateFilter.mode === "single" && dateFilter.startDate) {
        result = result.filter((item) => {
            const itemDate = new Date(item.created_at);
            const filterDate = new Date(dateFilter.startDate);
            return itemDate.toDateString() === filterDate.toDateString();
        });
    } else if (dateFilter.mode === "range" && dateFilter.startDate && dateFilter.endDate) {
        result = result.filter((item) => {
            const itemDate = parseISO(item.created_at);
            return isWithinInterval(itemDate, {
                start: dateFilter.startDate,
                end: dateFilter.endDate,
            });
        });
    }

    return result;
}, [dateFilter, data]);
```

4. Render komponen di JSX:
```jsx
<DateFilter
    onFilterChange={handleDateFilterChange}
    placeholder="Pilih tanggal..."
    label="Filter Tanggal"
/>
```

5. Gunakan `filteredData` dalam render tabel atau list.

## Fitur Teknis

### Performance Optimization
- Menggunakan `useMemo` untuk meminimalkan re-render yang tidak perlu
- Filter logic hanya dijalankan ketika state filter atau data berubah
- Text search dan date filter dapat dikombinasikan

### Accessibility
- Komponen kalender fully keyboard accessible
- Screen reader friendly dengan proper ARIA labels
- Clear visual feedback untuk selected dates

### Browser Compatibility
- Support semua browser modern (Chrome, Firefox, Safari, Edge)
- Responsive design untuk mobile, tablet, dan desktop

## Testing

Fitur sudah ditest dengan:
1. ✅ Build produksi berhasil tanpa error
2. ✅ Komponen DateFilter dapat dirender
3. ✅ Logic filter tanggal tertentu berfungsi
4. ✅ Logic filter rentang tanggal berfungsi
5. ✅ Clear filter berfungsi dengan baik
6. ✅ Integrasi dengan text search berfungsi

## Troubleshooting

### Kalender tidak muncul
- Pastikan `react-calendar` dan `date-fns` sudah terinstall
- Check browser console untuk error messages

### Filter tidak bekerja
- Pastikan field `created_at` ada di data
- Verify format date yang digunakan

### Styling kalender terlihat aneh
- Clear browser cache
- Pastikan file `calendar-custom.css` sudah ter-import dengan benar

## File yang Dimodifikasi

1. **Baru dibuat:**
   - `resources/js/Components/DateFilter.jsx`
   - `resources/css/calendar-custom.css`

2. **Dimodifikasi:**
   - `resources/js/Pages/Submissions/Index.jsx`
   - `resources/js/Pages/Submissions/ForDivision.jsx`
   - `resources/js/Pages/Submissions/History.jsx`
   - `package.json` (tambahan dependencies)

## Catatan Penting

- Filter kalender mencari berdasarkan field `created_at` pada setiap item
- Saat menggunakan rentang tanggal, kedua tanggal termasuk dalam hasil filter (inclusive range)
- Kalender menggunakan locale `id-ID` untuk bahasa Indonesia
- Design responsif untuk semua ukuran layar
