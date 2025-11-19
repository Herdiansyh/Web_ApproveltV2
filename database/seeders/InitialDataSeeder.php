<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Division;
use App\Models\Subdivision;
use App\Models\SubdivisionPermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create divisions
        $divisions = [
            ['name' => 'Direktur', 'description' => 'Direktur Division'],
            ['name' => 'HR', 'description' => 'Human Resources'],
            ['name' => 'IT', 'description' => 'Information Technology'],
            ['name' => 'Finance', 'description' => 'Finance Department'],
            ['name' => 'Operations', 'description' => 'Operations Department'],
        ];

        foreach ($divisions as $division) {
            Division::create($division);
        }

        // ✅ Create subdivisions
        $subdivisions = [
            // HR
            ['division' => 'HR', 'name' => 'Recruitment', 'description' => 'Handles hiring and onboarding'],
            ['division' => 'HR', 'name' => 'Training', 'description' => 'Employee development and training'],

            // IT
            ['division' => 'IT', 'name' => 'Infrastructure', 'description' => 'Network and hardware management'],
            ['division' => 'IT', 'name' => 'Development', 'description' => 'Software and system development'],

            // Finance
            ['division' => 'Finance', 'name' => 'Accounting', 'description' => 'Handles bookkeeping and reporting'],
            ['division' => 'Finance', 'name' => 'Budgeting', 'description' => 'Manages budgets and expenses'],

            // Operations
            ['division' => 'Operations', 'name' => 'Logistics', 'description' => 'Oversees logistics and warehouse'],
            ['division' => 'Operations', 'name' => 'Procurement', 'description' => 'Purchasing and vendor management'],
        ];

        foreach ($subdivisions as $sub) {
            $created = Subdivision::create([
                'division_id' => Division::where('name', $sub['division'])->first()->id,
                'name' => $sub['name'],
                'description' => $sub['description'],
            ]);
            // Seed default global permissions (all false)
            SubdivisionPermission::firstOrCreate(
                ['subdivision_id' => $created->id],
                [
                    'can_view' => true,
                    'can_approve' => false,
                    'can_reject' => false,
                    'can_request_next' => false,
                    'can_edit' => false,
                    'can_delete' => false,
                ]
            );
        }

        // Create manager account
        User::create([
            'name' => 'Rudi',
            'email' => 'direktur@direktur.com',
            'password' => Hash::make('123123123'),
            'role' => 'Direktur',
            'division_id' => Division::where('name', 'Direktur')->first()->id,
            'email_verified_at' => now(),
        ]);

        // Create admin account
        User::create([
            'name' => 'Budi',
            'email' => 'admin@admin.com',
            'password' => Hash::make('123123123'),
            'role' => 'admin',
            'division_id' => Division::where('name', 'Direktur')->first()->id,
            'email_verified_at' => now(),
        ]);

        // Create some example employees
        $employees = [
            [
                'name' => 'Olive',
                'email' => 'hr@example.com',
                'division' => 'HR'
            ],
            [
                'name' => 'Ramdan',
                'email' => 'it@example.com',
                'division' => 'IT'
            ],
            [
                'name' => 'Ziva',
                'email' => 'finance@example.com',
                'division' => 'Finance'
            ]
        ];

        foreach ($employees as $employee) {
            User::create([
                'name' => $employee['name'],
                'email' => $employee['email'],
                'password' => Hash::make('123123123'),
                'role' => 'employee',
                'division_id' => Division::where('name', $employee['division'])->first()->id,
                'email_verified_at' => now(),
            ]);
        }
    }
}
