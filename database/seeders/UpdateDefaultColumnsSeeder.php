<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Document;

class UpdateDefaultColumnsSeeder extends Seeder
{
    public function run()
    {
        $documents = Document::all();
        
        foreach ($documents as $document) {
            // Skip if already has default_columns
            if ($document->default_columns) {
                continue;
            }
            
            $document->update([
                'default_columns' => [
                    ['name' => 'Item', 'key' => 'item'],
                    ['name' => 'Jumlah', 'key' => 'jumlah'],
                    ['name' => 'Keterangan', 'key' => 'keterangan']
                ]
            ]);
        }
        
        $this->command->info("Default columns updated for {$documents->count()} documents");
    }
}
