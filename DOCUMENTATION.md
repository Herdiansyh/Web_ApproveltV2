# E-Approval System - Project Documentation

**Project Name:** Website ApproveIt v2  
**Repository:** Web_ApproveltV2  
**Current Branch:** QrCode  
**Framework:** Laravel 12 + React (Inertia.js)  
**PHP Version:** ^8.2  
**License:** MIT

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Installation & Setup](#installation--setup)
4. [Database Structure](#database-structure)
5. [Project Structure](#project-structure)
6. [Core Features](#core-features)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Authentication & Authorization](#authentication--authorization)
10. [Workflow Management](#workflow-management)
11. [PDF Generation & Signing](#pdf-generation--signing)
12. [Development Guide](#development-guide)
13. [Testing](#testing)

---

## Project Overview

E-Approval System adalah aplikasi berbasis web yang dirancang untuk mengelola proses persetujuan dokumen secara digital. Sistem ini memungkinkan pengguna untuk mengajukan dokumen, melacak status persetujuan, dan memberikan persetujuan atau penolakan sesuai dengan workflow yang telah ditentukan.

### Key Features:

-   **Digital Approval Workflow**: Sistem approval multi-step dengan role-based permissions
-   **Document Management**: Mengelola berbagai jenis dokumen dengan template yang dapat dikustomisasi
-   **PDF Generation**: Menghasilkan PDF dari template dengan field yang dapat diisi
-   **Digital Signature**: Implementasi tanda tangan digital dengan QR code
-   **Audit Trail**: Pencatatan lengkap setiap perubahan status dan approval
-   **Notification System**: Notifikasi real-time untuk setiap perubahan status submission
-   **User & Role Management**: Manajemen pengguna dengan division dan subdivision hierarchy
-   **Dashboard Analytics**: Dashboard dengan statistik approval dan submission

---

## System Architecture

### Technology Stack

**Backend:**

-   Laravel Framework 12.x
-   PHP 8.2+
-   MySQL/SQLite Database
-   Laravel Eloquent ORM
-   Laravel Sanctum (API Authentication)
-   Laravel Queue (Background Jobs)

**Frontend:**

-   React 18.2
-   Inertia.js (Server-driven UI)
-   Tailwind CSS 3.2
-   Vite 7.0 (Build Tool)
-   shadcn/ui (UI Components)
-   Lucide React (Icons)

**Additional Libraries:**

-   FPDF/FPDI (PDF Generation)
-   Browsershot (Website to PDF conversion)
-   Simple QRCode (QR Code Generation)
-   React Hook Form (Form Management)
-   Zod (Schema Validation)
-   SweetAlert2 (Alerts)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer (React)                  │
│  ├─ Layouts (AuthenticatedLayout, GuestLayout)           │
│  ├─ Pages (Auth, Dashboard, Submissions, Documents)      │
│  └─ Components (Sidebar, Form Controls, Modal)           │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP Requests (Inertia)
┌──────────────────────────▼──────────────────────────────┐
│              Server Layer (Laravel)                      │
│  ├─ Routes (web.php, auth.php)                           │
│  ├─ Controllers (Business Logic)                         │
│  ├─ Models (Data Structure)                              │
│  ├─ Services (Reusable Logic)                            │
│  └─ Jobs (Queue Processing)                              │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│            Data Layer (Database)                         │
│  ├─ Users & Authentication                               │
│  ├─ Division & Subdivision Hierarchy                     │
│  ├─ Documents & Templates                                │
│  ├─ Workflows & Workflow Steps                           │
│  ├─ Submissions & Approval History                       │
│  └─ Files & Digital Signatures                           │
└─────────────────────────────────────────────────────────┘
```

---

## Installation & Setup

### Prerequisites

-   PHP 8.2+
-   Composer
-   Node.js 16+ & npm
-   MySQL 8.0+ (atau SQLite)
-   Git

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/Herdiansyh/Web_ApproveltV2.git
cd Web_ApproveltV2
git checkout QrCode
```

#### 2. Install PHP Dependencies

```bash
composer install
```

#### 3. Environment Setup

```bash
cp .env.example .env
php artisan key:generate
```

#### 4. Configure Database

Edit `.env` file dan sesuaikan database connection:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=approveit
DB_USERNAME=root
DB_PASSWORD=
```

#### 5. Run Database Migrations

```bash
php artisan migrate
# atau jika perlu reset dan seed data
php artisan migrate:fresh --seed
```

#### 6. Install Node Dependencies

```bash
npm install
```

#### 7. Build Frontend Assets

```bash
# Development mode (with watch)
npm run dev

# Production build
npm run build
```

#### 8. Serve Application

```bash
# Run Laravel development server
php artisan serve

# Run queue listener (in another terminal)
php artisan queue:listen

# Run Vite dev server (in another terminal)
npm run dev
```

Application akan berjalan di `http://localhost:8000`

### Quick Setup Command

```bash
composer run setup
```

Perintah ini akan otomatis:

-   Install dependencies
-   Copy `.env.example` ke `.env`
-   Generate app key
-   Run migrations
-   Install npm packages
-   Build frontend assets

---

## Database Structure

### Entity Relationship Diagram

```
Users
  ├─ division_id → Divisions
  ├─ subdivision_id → Subdivisions
  └─ Submissions (has many)

Divisions
  ├─ Subdivisions (has many)
  ├─ Workflows (dari divisi ini)
  └─ WorkflowSteps (langkah dari divisi ini)

Subdivisions
  └─ WorkflowStepPermissions (can_approve, can_view, can_edit, can_delete)

Documents
  ├─ DocumentFields (field yang ada di dokumen)
  ├─ DocumentNameSeries (serial number)
  ├─ Workflows (workflow untuk dokumen)
  └─ Submissions (pengajuan dokumen)

Workflows
  ├─ WorkflowSteps (langkah approval)
  ├─ Submissions
  └─ division_from_id, division_to_id

WorkflowSteps
  ├─ workflow_id
  ├─ division_id
  ├─ step_order
  ├─ can_edit, can_delete
  └─ WorkflowStepPermissions

Submissions
  ├─ user_id → Users
  ├─ workflow_id → Workflows
  ├─ document_id → Documents
  ├─ SubmissionFiles (file attachment)
  ├─ SubmissionWorkflowSteps (riwayat approval)
  ├─ Approvals
  └─ StampedFiles (PDF dengan tanda tangan)
```

### Key Tables

#### 1. **users**

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  division_id BIGINT,
  subdivision_id BIGINT,
  role ENUM('admin', 'user', 'approver'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 2. **divisions**

Hirarki organisasi - divisi level tertinggi

```sql
CREATE TABLE divisions (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 3. **subdivisions**

Sub-divisi dalam setiap divisi

```sql
CREATE TABLE subdivisions (
  id BIGINT PRIMARY KEY,
  division_id BIGINT,
  name VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 4. **documents**

Tipe dokumen yang dapat diajukan

```sql
CREATE TABLE documents (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 5. **workflows**

Alur approval untuk setiap dokumen

```sql
CREATE TABLE workflows (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  document_id BIGINT,
  division_from_id BIGINT,
  division_to_id BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  total_steps INT,
  flow_definition JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 6. **workflow_steps**

Setiap step dalam workflow

```sql
CREATE TABLE workflow_steps (
  id BIGINT PRIMARY KEY,
  workflow_id BIGINT,
  division_id BIGINT,
  step_order INT,
  name VARCHAR(255),
  can_edit BOOLEAN DEFAULT TRUE,
  can_delete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 7. **submissions**

Pengajuan dokumen oleh user

```sql
CREATE TABLE submissions (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  document_id BIGINT,
  workflow_id BIGINT,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50), -- 'draft', 'submitted', 'approved', 'rejected'
  current_step INT,
  series_code VARCHAR(255),
  verification_token VARCHAR(255),
  qr_code_path VARCHAR(255),
  data_json JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 8. **submission_workflow_steps**

Riwayat approval untuk setiap submission

```sql
CREATE TABLE submission_workflow_steps (
  id BIGINT PRIMARY KEY,
  submission_id BIGINT,
  step_order INT,
  status VARCHAR(50), -- 'pending', 'approved', 'rejected'
  approver_id BIGINT,
  approval_note TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 9. **submission_files**

File yang diupload dalam submission

```sql
CREATE TABLE submission_files (
  id BIGINT PRIMARY KEY,
  submission_id BIGINT,
  file_path VARCHAR(255),
  original_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 10. **stamped_files**

PDF yang sudah di-stamp dengan tanda tangan digital

```sql
CREATE TABLE stamped_files (
  id BIGINT PRIMARY KEY,
  submission_id BIGINT,
  approver_id BIGINT,
  file_path VARCHAR(255),
  signature_image_path VARCHAR(255),
  qr_code_path VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Project Structure

### Backend Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── SubmissionController.php      # CRUD & workflow approval
│   │   ├── DocumentController.php        # Dokumen & template
│   │   ├── WorkflowController.php        # Workflow management
│   │   ├── DivisionController.php        # Divisi management
│   │   ├── SubdivisionController.php     # Sub-divisi management
│   │   ├── UserController.php            # User management
│   │   ├── WorkflowStepPermissionController.php
│   │   ├── VerificationController.php    # Email verification
│   │   ├── ProfileController.php         # User profile
│   │   └── Admin/
│   │       └── TemplateController.php    # Template management
│   ├── Middleware/
│   │   ├── CheckRole.php                 # Role-based access
│   │   ├── RoleMiddleware.php            # Middleware untuk role
│   │   └── HandleInertiaRequests.php     # Inertia setup
│   ├── Requests/
│   │   ├── ProfileUpdateRequest.php
│   │   └── Auth/LoginRequest.php
│   └── Kernel.php
├── Models/
│   ├── User.php
│   ├── Division.php
│   ├── Subdivision.php
│   ├── Document.php
│   ├── DocumentField.php
│   ├── DocumentNameSeries.php
│   ├── Workflow.php
│   ├── WorkflowStep.php
│   ├── WorkflowStepPermission.php
│   ├── Submission.php
│   ├── SubmissionFile.php
│   ├── SubmissionWorkflowStep.php
│   ├── Approval.php
│   ├── StampedFile.php
│   ├── Template.php
│   ├── TemplateField.php
│   └── Notification.php (via Laravel Notifications)
├── Jobs/
│   ├── GeneratePdfFromTemplate.php       # Generate PDF dari template
│   └── StampPdfOnDecision.php            # Stamp PDF dengan signature
├── Notifications/
│   └── SubmissionStatusUpdated.php       # Notification ke user
└── Policies/
    ├── SubmissionPolicy.php              # Authorization untuk submission
    └── DocumentPolicy.php                # Authorization untuk document

database/
├── migrations/                            # Schema files
├── factories/                             # Test data factories
└── seeders/                               # Database seeders

routes/
├── web.php                                # Main routes
├── auth.php                               # Auth routes
└── console.php                            # Artisan commands

config/
├── app.php
├── auth.php
├── database.php
├── filesystems.php
└── [other config files]

storage/
├── app/
│   ├── private/
│   │   ├── submissions/                   # Submitted files
│   │   └── signatures/                    # Signature images
│   └── public/
│       ├── submissions/                   # Public submission files
│       └── qrcodes/                       # Generated QR codes
└── logs/
```

### Frontend Structure

```
resources/
├── js/
│   ├── app.jsx                            # Entry point
│   ├── bootstrap.js                       # Axios setup
│   ├── Layouts/
│   │   ├── AuthenticatedLayout.jsx        # Layout untuk authenticated users
│   │   └── GuestLayout.jsx                # Layout untuk public pages
│   ├── Pages/
│   │   ├── Auth/                          # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── ConfirmPassword.jsx
│   │   │   ├── EmailVerificationPrompt.jsx
│   │   │   └── VerifyEmail.jsx
│   │   ├── Dashboard.jsx                  # Main dashboard
│   │   ├── Submissions/
│   │   │   ├── Index.jsx                  # List submissions
│   │   │   ├── Create.jsx                 # Create submission
│   │   │   ├── Show.jsx                   # View submission detail
│   │   │   └── Edit.jsx                   # Edit submission
│   │   ├── Documents/
│   │   │   ├── Index.jsx
│   │   │   ├── Create.jsx
│   │   │   └── Edit.jsx
│   │   ├── Workflows/
│   │   │   ├── Index.jsx
│   │   │   ├── Create.jsx
│   │   │   └── Edit.jsx
│   │   ├── Profile/                       # User profile pages
│   │   │   └── Edit.jsx
│   │   ├── Pengajuan.jsx                  # Submission list page
│   │   └── Welcome.jsx                    # Landing page
│   ├── Components/
│   │   ├── Sidebar.jsx                    # Navigation sidebar
│   │   ├── Modal.jsx                      # Modal component
│   │   ├── InputLabel.jsx                 # Form label
│   │   ├── TextInput.jsx                  # Text input
│   │   ├── PrimaryButton.jsx              # Button
│   │   ├── ui/                            # shadcn/ui components
│   │   │   ├── card.jsx
│   │   │   ├── button.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   ├── label.jsx
│   │   │   └── [other ui components]
│   │   └── [other components]
│   └── Hooks/                             # Custom React hooks
├── css/
│   └── app.css                            # Main stylesheet (Tailwind)
└── views/
    └── app.blade.php                      # Main Blade template
```

---

## Core Features

### 1. User Management & Authentication

**Features:**

-   User registration & login
-   Email verification
-   Password reset
-   Role-based access control (Admin, User, Approver)
-   Division & Subdivision hierarchy
-   Profile management

**Key Files:**

-   `app/Http/Controllers/Auth/*` - Authentication controllers
-   `app/Models/User.php` - User model with relations
-   `app/Policies/*` - Authorization policies

### 2. Document Management

**Features:**

-   Create & manage document types
-   Define document fields (text, number, date, etc.)
-   Document templates with field mapping
-   Auto-generate document serial numbers
-   Document versioning

**Key Files:**

-   `app/Http/Controllers/DocumentController.php`
-   `app/Models/Document.php`
-   `app/Models/DocumentField.php`
-   `app/Models/Template.php`

### 3. Workflow Management

**Features:**

-   Define multi-step approval workflows
-   Set workflow permissions per subdivision
-   Permissions: can_approve, can_view, can_edit, can_delete
-   Track workflow progress (current_step)
-   Support multiple workflows per document

**Key Files:**

-   `app/Http/Controllers/WorkflowController.php`
-   `app/Models/Workflow.php`
-   `app/Models/WorkflowStep.php`
-   `app/Models/WorkflowStepPermission.php`

**Workflow Flow:**

```
1. User submits document → Submission created with status 'submitted'
2. System moves to first step (current_step = 1)
3. Responsible division gets notification
4. Approver reviews and approves/rejects
5. System moves to next step or completes
6. Audit trail recorded in submission_workflow_steps
```

### 4. Submission & Approval Process

**Features:**

-   Submit document for approval
-   Track approval status at each step
-   Add approval notes/comments
-   Approve or reject with reason
-   View approval history
-   Automatic status updates

**Statuses:**

-   `draft` - Belum disubmit
-   `submitted` - Menunggu approval
-   `approved` - Semua step selesai disetujui
-   `rejected` - Ditolak pada salah satu step

**Key Files:**

-   `app/Http/Controllers/SubmissionController.php`
-   `app/Models/Submission.php`
-   `app/Models/SubmissionWorkflowStep.php`

### 5. PDF Generation & Digital Signature

**Features:**

-   Generate PDF dari template dokumen
-   Fill document fields with submission data
-   Digital signature with image stamp
-   QR code embedding for verification
-   Watermark support
-   Automatic PDF stamping on approval

**Key Files:**

-   `app/Jobs/GeneratePdfFromTemplate.php`
-   `app/Jobs/StampPdfOnDecision.php`
-   `app/Http/Controllers/SubmissionController.php` (generatePdf method)

**Technology:**

-   FPDF/FPDI untuk PDF manipulation
-   SimpleSoftwareIO/QrCode untuk QR generation
-   Browsershot untuk website to PDF conversion

### 6. Notification System

**Features:**

-   Email notifications on submission status change
-   Notify approvers when action needed
-   Notify submitter on approval/rejection
-   In-app notifications (future)

**Key Files:**

-   `app/Notifications/SubmissionStatusUpdated.php`
-   Queue configured for async processing

### 7. File Management

**Features:**

-   Upload multiple files with submission
-   Secure storage (private/public)
-   File type validation
-   Generate stamped PDFs after approval
-   QR code for verification

**Storage Structure:**

```
storage/app/
├── private/submissions/  # User uploaded files (tidak public)
├── private/signatures/   # Signature images
└── public/
    ├── submissions/      # Generated documents
    └── qrcodes/          # QR code images
```

---

## API Endpoints

### Authentication Routes

```
POST   /register                    # Register user
POST   /login                       # Login
POST   /logout                      # Logout
POST   /forgot-password             # Request password reset
POST   /reset-password              # Reset password
GET    /verify-email/{token}        # Verify email (public)
POST   /email/verification-notification  # Resend verification
```

### Dashboard & Profile

```
GET    /dashboard                   # Main dashboard
GET    /profile                     # Edit profile page
POST   /profile                     # Update profile
POST   /password                    # Update password
```

### Submission Routes

```
GET    /submissions                 # List user's submissions
POST   /submissions                 # Create new submission
GET    /submissions/{id}            # View submission detail
PUT    /submissions/{id}            # Update submission (draft only)
DELETE /submissions/{id}            # Delete submission (draft only)
POST   /submissions/{id}/submit     # Submit for approval
POST   /submissions/{id}/approve    # Approve submission
POST   /submissions/{id}/reject     # Reject submission
GET    /submissions/{id}/pdf        # Download PDF
```

### Document Routes

```
GET    /documents                   # List all documents
POST   /documents                   # Create document type
GET    /documents/{id}              # View document detail
PUT    /documents/{id}              # Update document
DELETE /documents/{id}              # Delete document
```

### Workflow Routes

```
GET    /workflows                   # List workflows
POST   /workflows                   # Create workflow
GET    /workflows/{id}              # View workflow detail
PUT    /workflows/{id}              # Update workflow
DELETE /workflows/{id}              # Delete workflow
GET    /workflows/{id}/steps        # Get workflow steps
```

### Admin Routes

```
GET    /divisions                   # List divisions
POST   /divisions                   # Create division
GET    /subdivisions                # List subdivisions
POST   /subdivisions                # Create subdivision
GET    /users                       # List users
POST   /users                       # Create user
PUT    /users/{id}                  # Update user
```

---

## Frontend Components

### Layout Components

#### AuthenticatedLayout

Wrapper untuk semua pages yang memerlukan authentication.

```jsx
<AuthenticatedLayout header="Page Title">
    {/* Page content */}
</AuthenticatedLayout>
```

#### GuestLayout

Wrapper untuk public pages (auth pages).

### Form Components

#### TextInput

Standard text input field dengan styling Tailwind.

#### InputLabel

Label untuk form inputs.

#### PrimaryButton

Primary action button.

#### Modal

Dialog modal untuk confirmasi atau forms.

### UI Components (shadcn/ui)

-   `Card` - Container for content
-   `Button` - Various button variants
-   `Dialog` - Modal dialog
-   `Select` - Dropdown select
-   `Checkbox` - Checkbox input
-   `Label` - Form label
-   `Tooltip` - Tooltip on hover
-   `Separator` - Visual separator

### Custom Components

#### Sidebar

Navigation sidebar dengan collapsible menu.

**Props:**

-   Menampilkan user info
-   Navigation links berdasarkan user role
-   Logout button

#### SubmissionForm

Form untuk create/edit submission dengan dynamic fields.

---

## Authentication & Authorization

### Authentication Flow

1. **Registration**

    - User mengisi form registrasi
    - System membuat user account
    - Email verification dikirim
    - User harus verify email sebelum login

2. **Login**

    - User masukkan email & password
    - System validate credentials
    - Session/token dibuat
    - Redirect ke dashboard

3. **Session Management**
    - Menggunakan Laravel sessions
    - CSRF protection enabled
    - Sanctum untuk API (jika needed)

### Authorization (Policies)

#### SubmissionPolicy

```php
// Siapa yang dapat view submission
can('view', submission)
  ├─ Owner (user_id == auth()->id())
  ├─ Approver di step saat ini
  └─ Admin

// Siapa yang dapat edit
can('edit', submission)
  ├─ Owner (hanya jika status = 'draft')
  └─ Approver dengan can_edit permission

// Siapa yang dapat delete
can('delete', submission)
  ├─ Owner (hanya jika status = 'draft')
  └─ Approver dengan can_delete permission

// Siapa yang dapat approve
can('approve', submission)
  ├─ Approver di step saat ini
  ├─ Subdivision harus memiliki can_approve permission
  └─ Division harus match dengan step.division_id
```

#### DocumentPolicy

```php
// Permissions untuk document operations
```

### Role-Based Access

**Roles:**

1. **Admin** - Full access, manage users, workflows, documents
2. **User** - Submit documents, view own submissions
3. **Approver** - Review and approve submissions (berdasarkan workflow permissions)

**Permission Check:**

```php
// Middleware untuk check role
Route::middleware(['auth', CheckRole::class])->group(function () {
    // Protected routes
});
```

---

## Workflow Management

### Workflow Structure

```
Document (e.g., "Leave Request")
├── Workflow #1: "Standard Leave (HR → Manager → Director)"
│   ├── Step 1: Division = HR (can_approve, can_edit, can_delete)
│   ├── Step 2: Division = Manager (can_approve, can_view)
│   └── Step 3: Division = Director (can_approve, can_view)
└── Workflow #2: "Emergency Leave (Manager → Director)"
    ├── Step 1: Division = Manager
    └── Step 2: Division = Director
```

### Workflow Permissions

Setiap subdivision di dalam workflow step dapat memiliki permissions:

-   `can_approve` - Dapat approve/reject di step ini
-   `can_view` - Dapat melihat submission
-   `can_edit` - Dapat edit submission di step ini
-   `can_delete` - Dapat delete submission

**Example:**

```
Workflow: "Leave Request"
├── Step 1: HR Division
│   └── Subdivision: HR Staff
│       ├── can_approve: true
│       ├── can_view: true
│       ├── can_edit: true
│       └── can_delete: true
├── Step 2: Manager Division
│   └── Subdivision: Department Manager
│       ├── can_approve: true
│       ├── can_view: true
│       ├── can_edit: false
│       └── can_delete: false
```

### Approval Flow

1. **User submits submission**

    ```php
    $submission->status = 'submitted';
    $submission->current_step = 1;
    ```

2. **System notifies step 1 approvers**

    - Find workflow step 1
    - Get division from step
    - Find users di division tersebut dengan can_approve permission
    - Send notification

3. **Approver approves**

    ```php
    // Record approval
    SubmissionWorkflowStep::create([
        'submission_id' => $id,
        'step_order' => 1,
        'status' => 'approved',
        'approver_id' => auth()->id(),
        'approval_note' => $request->note
    ]);

    // Move to next step
    if (hasNextStep) {
        $submission->current_step = 2;
        // Notify next step approvers
    } else {
        $submission->status = 'approved';
        // Mark as complete
    }
    ```

4. **Rejection process**

    ```php
    // Record rejection
    SubmissionWorkflowStep::create([
        'submission_id' => $id,
        'step_order' => 1,
        'status' => 'rejected',
        'approver_id' => auth()->id(),
        'approval_note' => $reason
    ]);

    $submission->status = 'rejected';
    // Notify submitter
    ```

---

## PDF Generation & Signing

### PDF Generation Process

1. **Get Template**

    - Fetch template dari document type
    - Get template field mappings

2. **Fill Template**

    - Ambil data dari submission (data_json)
    - Map ke template fields
    - Generate PDF dengan FPDF

3. **Job Processing**

    ```php
    // app/Jobs/GeneratePdfFromTemplate.php
    $submission = Submission::find($submissionId);
    $template = $submission->document->template;
    $data = $submission->data_json;

    // Generate PDF
    $pdf = new PDF();
    // ... fill fields from $data
    $path = 'storage/submissions/' . uniqid() . '.pdf';
    $pdf->Output($path);
    ```

### Digital Signature Process

1. **On Approval**

    ```php
    // Ketika approver approve, trigger StampPdfOnDecision job
    StampPdfOnDecision::dispatch($submission, $approver);
    ```

2. **Generate Signature Image**

    - Use user's signature image (atau generate placeholder)
    - Convert ke PNG

3. **Stamp PDF**

    ```php
    // app/Jobs/StampPdfOnDecision.php
    $pdf = new PDF_Parser($originalPdf);

    // Add signature image
    $pdf->Image(
        $signaturePath,
        x: $watermark_x,
        y: $watermark_y,
        w: $watermark_width,
        h: $watermark_height
    );

    // Add QR code untuk verification
    $qr = QrCode::format('png')->size(100)->generate($verificationToken);
    $pdf->Image($qr, x: 150, y: 270);

    // Save stamped PDF
    $stampedPath = 'storage/submissions/stamped_' . uniqid() . '.pdf';
    $pdf->Output($stampedPath);
    ```

4. **Verification**
    - QR code di PDF contains token
    - User scan QR → visit `/verify/{token}`
    - Show submission details dan approval chain

---

## Development Guide

### Setting Up Development Environment

1. **Clone & Install**

    ```bash
    git clone https://github.com/Herdiansyh/Web_ApproveltV2.git
    cd Web_ApproveltV2
    git checkout QrCode
    composer install
    npm install
    ```

2. **Environment Configuration**

    ```bash
    cp .env.example .env
    php artisan key:generate
    # Edit .env dengan database config
    ```

3. **Database Setup**

    ```bash
    php artisan migrate:fresh --seed
    ```

4. **Start Development Servers**

    ```bash
    # Terminal 1: Laravel server
    php artisan serve

    # Terminal 2: Vite dev server
    npm run dev

    # Terminal 3: Queue worker
    php artisan queue:listen

    # Terminal 4: Pail logs (optional)
    php artisan pail
    ```

### Creating a New Feature

#### 1. Create Database Migration

```bash
php artisan make:migration create_my_table
# Edit database/migrations/YYYY_MM_DD_*_create_my_table.php
php artisan migrate
```

#### 2. Create Model

```bash
php artisan make:model MyModel
# Edit app/Models/MyModel.php dengan relationships
```

#### 3. Create Controller

```bash
php artisan make:controller MyController -r
# Implement index, show, create, store, edit, update, destroy
```

#### 4. Create Policy (if authorization needed)

```bash
php artisan make:policy MyPolicy
# Implement authorization methods
```

#### 5. Create Routes

```php
// routes/web.php
Route::resource('my-resource', MyController::class);
```

#### 6. Create Frontend Pages

```bash
# Create in resources/js/Pages/MyResource/
touch resources/js/Pages/MyResource/Index.jsx
touch resources/js/Pages/MyResource/Show.jsx
touch resources/js/Pages/MyResource/Create.jsx
```

### Useful Artisan Commands

```bash
# Database
php artisan migrate              # Run migrations
php artisan migrate:rollback     # Rollback last migration
php artisan migrate:refresh      # Rollback all & re-run
php artisan migrate:fresh --seed # Fresh DB with seeders
php artisan db:seed             # Run seeders
php artisan tinker              # Interactive shell

# Generate
php artisan make:model User     # Create model
php artisan make:controller UsersController -r  # Create controller with CRUD
php artisan make:migration create_users_table   # Create migration
php artisan make:policy UserPolicy              # Create policy
php artisan make:request StoreUserRequest       # Create form request
php artisan make:job SendEmail                  # Create job

# Queue
php artisan queue:listen        # Listen for jobs
php artisan queue:work          # Start queue worker
php artisan queue:failed        # Show failed jobs

# Maintenance
php artisan cache:clear         # Clear cache
php artisan config:cache        # Cache configuration
php artisan view:clear          # Clear view cache

# Development
php artisan serve               # Start dev server
php artisan tinker              # Interactive shell
```

### Code Style & Standards

**PHP:**

-   Follow PSR-12 coding standard
-   Use Laravel conventions
-   Type hints for all methods
-   Document complex logic with comments

**JavaScript/React:**

-   Use modern ES6+ syntax
-   Functional components with hooks
-   Props validation dengan PropTypes atau TypeScript
-   Consistent naming (camelCase for variables)

**Database:**

-   Use migrations untuk semua schema changes
-   Foreign keys harus explicit
-   Use meaningful column names

### Debugging

**Laravel:**

```php
// Log to storage/logs/
Log::debug('Debug message', ['data' => $variable]);
Log::info('Info message');
Log::warning('Warning message');
Log::error('Error message');

// Dump and die
dd($variable);
dump($variable); // continues execution
```

**React:**

```jsx
// Console logging
console.log("variable:", variable);
console.error("error:", error);

// React DevTools
// Install React DevTools browser extension
```

**Network:**

-   Use browser DevTools Network tab
-   Check request/response headers
-   Monitor API responses

---

## Testing

### Setting Up Tests

```bash
# PHPUnit for Laravel tests
php artisan test

# Run specific test file
php artisan test tests/Feature/SubmissionTest.php

# Run with coverage
php artisan test --coverage
```

### Writing Tests

#### Feature Tests (API/Controller)

```php
// tests/Feature/SubmissionTest.php
use Tests\TestCase;

class SubmissionTest extends TestCase
{
    public function test_user_can_create_submission()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)
            ->post('/submissions', [
                'title' => 'Test',
                'document_id' => 1,
            ]);

        $response->assertRedirect('/submissions');
        $this->assertDatabaseHas('submissions', ['title' => 'Test']);
    }
}
```

#### Unit Tests (Models/Services)

```php
// tests/Unit/SubmissionTest.php
use Tests\TestCase;
use App\Models\Submission;

class SubmissionTest extends TestCase
{
    public function test_submission_belongs_to_user()
    {
        $submission = Submission::factory()->create();
        $this->assertNotNull($submission->user);
    }
}
```

### Test Configuration

```xml
<!-- phpunit.xml -->
<env name="APP_ENV" value="testing"/>
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
<env name="CACHE_STORE" value="array"/>
```

---

## Common Tasks

### How to Add a New Document Type

1. **Create Migration**

    ```bash
    php artisan make:migration create_leave_request_document
    ```

2. **Create Document & Template**

    ```php
    // In seeder or via admin panel
    $document = Document::create([
        'name' => 'Leave Request',
        'description' => 'Employee leave request form',
    ]);

    $template = Template::create([
        'document_id' => $document->id,
        'name' => 'Standard Leave Template',
        'html_template' => '<html>...</html>', // HTML template
    ]);

    // Add fields
    DocumentField::create([
        'document_id' => $document->id,
        'name' => 'Leave Type',
        'field_key' => 'leave_type',
        'field_type' => 'select',
        'is_required' => true,
    ]);
    ```

3. **Create Workflow**

    ```php
    $workflow = Workflow::create([
        'name' => 'Leave Request Workflow',
        'document_id' => $document->id,
        'division_from_id' => $hrDivision->id,
        'total_steps' => 2,
    ]);

    // Add steps
    WorkflowStep::create([
        'workflow_id' => $workflow->id,
        'division_id' => $managerDivision->id,
        'step_order' => 1,
        'name' => 'Manager Approval',
    ]);

    WorkflowStep::create([
        'workflow_id' => $workflow->id,
        'division_id' => $directorDivision->id,
        'step_order' => 2,
        'name' => 'Director Approval',
    ]);
    ```

### How to Add a New User

```php
// Via tinker or service
$user = User::create([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => Hash::make('password'),
    'division_id' => $division->id,
    'subdivision_id' => $subdivision->id,
]);

// Or via artisan command
php artisan make:user john@example.com
```

### How to Export Submissions to Excel

```php
// Create export job
php artisan make:job ExportSubmissions

// Use Laravel Excel or custom CSV generation
$submissions = Submission::all();
$csv = new CsvWriter();
$csv->write($submissions);
```

---

## Troubleshooting

### Common Issues

#### 1. PDF Generation Fails

-   Check storage/app/private/submissions directory permissions
-   Ensure FPDF/FPDI libraries installed
-   Check temp directory permissions

#### 2. Queue Jobs Not Processing

```bash
# Check if queue worker running
php artisan queue:listen

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

#### 3. File Upload Issues

-   Check upload directory permissions
-   Verify MAX_FILE_SIZE in .env
-   Check disk configuration in config/filesystems.php

#### 4. Email Not Sending

```bash
# Check mail configuration
# Edit .env: MAIL_MAILER, MAIL_HOST, MAIL_FROM_ADDRESS

# Test mail
php artisan tinker
>>> Mail::raw('test', function($msg) { $msg->to('test@example.com'); })
```

### Debug Mode

Enable debug mode in .env:

```env
APP_DEBUG=true
APP_ENV=local
```

This will show detailed error messages (use only in development).

---

## Performance Optimization

### Database Optimization

```php
// Use eager loading to avoid N+1 queries
$submissions = Submission::with('user', 'workflow', 'workflowSteps')->get();

// Use pagination for large datasets
$submissions = Submission::paginate(15);

// Add database indexes in migrations
$table->index('user_id');
$table->index('status');
```

### Caching

```php
// Cache expensive queries
$submissions = Cache::remember(
    'user_submissions_' . auth()->id(),
    now()->addHours(1),
    function () {
        return Submission::where('user_id', auth()->id())->get();
    }
);
```

### Asset Optimization

```bash
# Production build minifies CSS/JS
npm run build

# Check build output size
npm run build -- --analyze
```

---

## Deployment

### Production Checklist

-   [ ] Set `APP_ENV=production` in .env
-   [ ] Set `APP_DEBUG=false` in .env
-   [ ] Run `php artisan config:cache`
-   [ ] Run `php artisan route:cache`
-   [ ] Run `php artisan view:cache`
-   [ ] Run `npm run build`
-   [ ] Set proper file permissions for storage/
-   [ ] Configure mail service (SMTP)
-   [ ] Set up queue worker (supervisord, systemd)
-   [ ] Configure backup strategy
-   [ ] Set up monitoring & error tracking (Sentry, etc.)

### Environment Setup

```env
# Production .env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://approveit.example.com

DB_HOST=prod-db-server
DB_DATABASE=approveit_prod

MAIL_DRIVER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

QUEUE_CONNECTION=database
```

---

## Resources & References

### Documentation

-   [Laravel Docs](https://laravel.com/docs)
-   [Inertia.js Docs](https://inertiajs.com/)
-   [React Docs](https://react.dev)
-   [Tailwind CSS](https://tailwindcss.com)

### Libraries

-   [FPDF/FPDI](https://tcpdf.org/)
-   [SimpleSoftwareIO QrCode](https://github.com/SimpleSoftwareIO/simple-qrcode)
-   [Browsershot](https://spatie.be/docs/browsershot/)

### Git Branches

-   `main` - Production branch
-   `QrCode` - Development branch (current)
-   `dev`, `dev2` - Feature branches
-   `workflow`, `workflowv2` - Workflow feature branches

---

## Contributors & Support

**Repository Owner:** Herdiansyh  
**Repository:** https://github.com/Herdiansyh/Web_ApproveltV2

For issues, feature requests, or contributions, please open an issue on GitHub.

---

**Last Updated:** November 19, 2025  
**Documentation Version:** 1.0
