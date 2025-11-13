<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Template;
use App\Models\TemplateField;
use Illuminate\Support\Str;

class TemplateStarterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $slug = 'project-summary';

        // Buat template jika belum ada, atau ambil yang sudah ada (idempotent)
        $template = Template::firstOrCreate(
            ['slug' => $slug],
            [
                'name' => 'Project Summary',
                'description' => 'Ringkasan proyek dengan nama proyek, tanggal, dan deskripsi.',
                'template_type' => 'blade',
                'html_view_path' => 'templates.project-summary',
                'config_json' => [
                    'paper' => 'A4',
                    'orientation' => 'portrait',
                ],
                'version' => 1,
                'is_active' => true,
                'created_by' => 1,
            ]
        );

        $fields = [
            [
                'name' => 'project_name',
                'label' => 'Nama Proyek',
                'type' => 'text',
                'required' => true,
                'order' => 1,
            ],
            [
                'name' => 'date',
                'label' => 'Tanggal',
                'type' => 'text',
                'required' => true,
                'order' => 2,
            ],
            [
                'name' => 'description',
                'label' => 'Deskripsi',
                'type' => 'textarea',
                'required' => false,
                'order' => 3,
            ],
        ];

        foreach ($fields as $f) {
            // Pastikan field tercipta / terupdate tanpa gunakan kolom yang tidak ada
            TemplateField::updateOrCreate(
                [
                    'template_id' => $template->id,
                    'name' => $f['name'],
                ],
                [
                    'label' => $f['label'],
                    'type' => $f['type'],
                    'required' => $f['required'],
                    'order' => $f['order'],
                ]
            );
        }
    }
}
