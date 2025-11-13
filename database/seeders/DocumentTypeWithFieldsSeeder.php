<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Division;
use App\Models\Document;
use App\Models\DocumentField;

class DocumentTypeWithFieldsSeeder extends Seeder
{
    public function run(): void
    {
        // Define doctypes with fields
        $doctypes = [
            [
                'name' => 'Form Cuti',
                'description' => 'Dokumen pengajuan cuti karyawan',
                'division' => 'HR',
                'fields' => [
                    ['name' => 'jenis_cuti', 'label' => 'Jenis Cuti', 'type' => 'select', 'required' => true, 'order' => 1, 'options' => [
                        'Cuti Tahunan', 'Cuti Sakit', 'Cuti Melahirkan', 'Cuti Menikah', 'Cuti Keperluan Lainnya'
                    ]],
                    ['name' => 'tanggal_mulai', 'label' => 'Tanggal Mulai', 'type' => 'date', 'required' => true, 'order' => 2],
                    ['name' => 'tanggal_selesai', 'label' => 'Tanggal Selesai', 'type' => 'date', 'required' => true, 'order' => 3],
                    ['name' => 'lama_cuti', 'label' => 'Lama Cuti (hari)', 'type' => 'number', 'required' => false, 'order' => 4],
                    ['name' => 'alasan_cuti', 'label' => 'Alasan Cuti', 'type' => 'textarea', 'required' => true, 'order' => 5],
                    ['name' => 'kontak_selama_cuti', 'label' => 'Kontak Selama Cuti', 'type' => 'text', 'required' => false, 'order' => 6],
                ],
            ],
            [
                'name' => 'Surat Permintaan Pembelian',
                'description' => 'Dokumen untuk pengajuan pembelian barang',
                'division' => 'Operations',
                'fields' => [
                    ['name' => 'nama_barang', 'label' => 'Nama Barang', 'type' => 'text', 'required' => true, 'order' => 1],
                    ['name' => 'jumlah', 'label' => 'Jumlah', 'type' => 'number', 'required' => true, 'order' => 2],
                    ['name' => 'alasan', 'label' => 'Alasan Pembelian', 'type' => 'textarea', 'required' => true, 'order' => 3],
                    ['name' => 'perkiraan_biaya', 'label' => 'Perkiraan Biaya', 'type' => 'number', 'required' => false, 'order' => 4],
                    ['name' => 'vendor_disarankan', 'label' => 'Vendor Disarankan', 'type' => 'text', 'required' => false, 'order' => 5],
                ],
            ],
        ];

        foreach ($doctypes as $dt) {
            $division = Division::where('name', $dt['division'])->first();
            if (!$division) {
                // Skip if division missing
                continue;
            }

            $document = Document::firstOrCreate(
                ['name' => $dt['name']],
                [
                    'description' => $dt['description'] ?? null,
                    'division_id' => $division->id,
                ]
            );

            // Seed fields
            $orderBase = 0;
            foreach ($dt['fields'] as $f) {
                $payload = [
                    'label' => $f['label'],
                    'type' => $f['type'],
                    'required' => (bool)($f['required'] ?? false),
                    'order' => $f['order'] ?? (++$orderBase),
                    'options_json' => isset($f['options']) ? json_encode(array_values($f['options'])) : null,
                ];

                $existing = DocumentField::where('document_id', $document->id)
                    ->where('name', $f['name'])
                    ->first();

                if ($existing) {
                    $existing->update($payload);
                } else {
                    $document->fields()->create(array_merge(['name' => $f['name']], $payload));
                }
            }
        }
    }
}
