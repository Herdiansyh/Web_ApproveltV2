<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Document;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        Document::insert([
            [
                'name' => 'Surat Permintaan Pembelian',
                'description' => 'Dokumen untuk pengajuan pembelian barang',
                'division_id' => 1 // atau ID divisi yang sesuai
            ],
            [
                'name' => 'Form Cuti',
                'description' => 'Dokumen pengajuan cuti karyawan',
                'division_id' => 1 // atau ID divisi yang sesuai
            ],
            [
                'name' => 'Kontrak Kerjasama',
                'description' => 'Dokumen perjanjian antara dua pihak',
                'division_id' => 1 // atau ID divisi yang sesuai
            ], ]);
    }
}
