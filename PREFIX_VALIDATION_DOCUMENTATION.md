# Validasi Prefix Document Name Series

## Overview

Fitur validasi prefix untuk mencegah duplikasi prefix pada Document Name Series di Website_ApproveIt Project.

## Fitur Utama

### 1. Validasi Unik Prefix
- Setiap document harus memiliki prefix yang unik
- Prefix yang sama tidak dapat digunakan oleh document yang berbeda
- Document yang sama dapat menggunakan prefix yang sama (untuk update)

### 2. Pesan Error User-Friendly
- Menampilkan pesan error yang jelas dalam Bahasa Indonesia
- Error handling di frontend dengan SweetAlert2

### 3. Database Constraint
- Unique constraint di level database pada kolom `prefix`
- Validasi di level aplikasi untuk feedback yang lebih baik

## Implementasi

### Backend

#### 1. Migration
```php
// 2025_11_15_000000_create_document_name_series_table.php
$table->string('prefix')->nullable()->unique();
```

#### 2. Request Validation
```php
// app/Http/Requests/DocumentNameSeriesRequest.php
'prefix' => [
    'nullable',
    'string', 
    'max:50',
    Rule::unique('document_name_series', 'prefix')->ignore($documentId, 'document_id')
],
```

#### 3. Controller Validation
```php
// app/Http/Controllers/DocumentController.php
// Validasi di store() dan update() methods
if ($request->filled('prefix')) {
    $existingPrefix = DocumentNameSeries::where('prefix', $request->prefix)
        ->where('document_id', '!=', $document->id)
        ->exists();
    if ($existingPrefix) {
        throw ValidationException::withMessages([
            'prefix' => 'Prefix sudah digunakan oleh dokumen lain. Silakan pilih prefix yang berbeda.'
        ]);
    }
}
```

### Frontend

#### 1. Error Handling
```javascript
// resources/js/Pages/Admin/Documents/Index.jsx
onError: (errors) => {
    let errorMessage = "Terjadi kesalahan saat memperbarui Name Series.";
    
    if (errors.prefix) {
        errorMessage = errors.prefix;
    }
    
    Swal.fire("Error", errorMessage, "error");
},
```

#### 2. Form Validation
- Real-time validation saat submit
- Clear error messages untuk user

## Test Coverage

### Test Cases
1. **Prefix harus unik antar document**
2. **Prefix boleh sama untuk document yang sama (update)**
3. **Null prefix diperbolehkan**
4. **Validasi saat create document**
5. **Validasi saat update document**

### Run Tests
```bash
php artisan test tests/Feature/DocumentNameSeriesValidationTest.php
```

## Cara Penggunaan

### 1. Create Document
- Saat membuat document baru, admin dapat mengisi prefix
- Sistem akan memvalidasi bahwa prefix belum digunakan
- Jika duplikat, akan muncul pesan error

### 2. Update Document  
- Saat update document, admin dapat mengubah prefix
- Sistem akan validasi bahwa prefix baru belum digunakan document lain
- Document yang sama diperbolehkan menggunakan prefix yang sama

### 3. Update Name Series
- Di halaman document management, ada section Name Series
- Admin dapat mengubah prefix di section tersebut
- Validasi sama berlaku untuk update Name Series

## Error Messages

### Bahasa Indonesia
- `"Prefix sudah digunakan oleh dokumen lain. Silakan pilih prefix yang berbeda."`

### Default Fallback
- `"Terjadi kesalahan saat memperbarui Name Series."`
- `"Terjadi kesalahan saat membuat dokumen."`
- `"Terjadi kesalahan saat memperbarui dokumen."`

## Technical Details

### Database Schema
```sql
CREATE TABLE document_name_series (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT FOREIGN KEY REFERENCES documents(id),
    series_pattern VARCHAR(255) DEFAULT 'yyyy-mm-####',
    prefix VARCHAR(50) UNIQUE NULL,
    current_number BIGINT DEFAULT 0,
    reset_type ENUM('none', 'monthly', 'yearly') DEFAULT 'none',
    last_reset_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Validation Rules
- `prefix`: nullable, string, max:50, unique
- `series_pattern`: required, string, max:255
- `reset_type`: required, in:none,monthly,yearly
- `current_number`: nullable, integer, min:0

## Security Considerations

1. **SQL Injection**: Dilindungi oleh Laravel Query Builder
2. **Authorization**: Hanya admin yang dapat mengubah document settings
3. **Data Integrity**: Unique constraint di level database

## Future Enhancements

1. **Real-time Validation**: Check prefix availability saat user mengetik
2. **Prefix Suggestions**: Suggest available prefixes based on pattern
3. **Bulk Operations**: Validasi untuk bulk document creation/update
4. **Audit Log**: Track perubahan prefix untuk compliance

## Troubleshooting

### Common Issues
1. **Test Fails**: Pastikan factory sudah dibuat dan database sudah di-migrate
2. **Validation Not Working**: Check bahwa DocumentNameSeriesRequest sudah di-import di controller
3. **Frontend Error Not Showing**: Pastikan error handling sudah benar di JavaScript

### Debug Commands
```bash
# Check routes
php artisan route:list | findstr nameSeries

# Run specific test
php artisan test --filter test_prefix_must_be_unique_across_documents

# Check database
php artisan tinker
>>> DocumentNameSeries::all();
```
