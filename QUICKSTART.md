# Quick Start Guide - E-Approval System

**Last Updated:** November 19, 2025

## 🚀 Getting Started in 5 Minutes

### Prerequisites

-   PHP 8.2+
-   Composer
-   Node.js 16+
-   MySQL 8.0+ or SQLite
-   Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Herdiansyh/Web_ApproveltV2.git
cd Web_ApproveltV2
git checkout QrCode

# 2. Install dependencies
composer install
npm install

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Configure database (edit .env)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_DATABASE=approveit
# DB_USERNAME=root
# DB_PASSWORD=

# 5. Run migrations & seeds
php artisan migrate:fresh --seed

# 6. Build frontend
npm run build

# 7. Start development server
php artisan serve
# App runs at http://localhost:8000
```

### One-Command Setup

```bash
composer run setup
```

---

## 📋 Default Credentials

After running seeds, use these accounts:

**Admin Account:**

-   Email: `admin@example.com`
-   Password: `password`

**Regular User:**

-   Email: `user@example.com`
-   Password: `password`

---

## 🎯 Main Features Overview

### 1. **Submit Documents**

-   Navigate to "Submissions" → "New Submission"
-   Select document type
-   Fill required fields
-   Submit for approval

### 2. **Approve/Reject**

-   View pending approvals in dashboard
-   Click on submission to review
-   Add notes and approve/reject
-   System automatically moves to next step

### 3. **Track Status**

-   Dashboard shows submission statistics
-   View approval history with timestamps
-   Download final stamped PDF

### 4. **Manage Users & Workflows**

-   Admin panel for user management
-   Define approval workflows
-   Set permissions per division/subdivision

---

## 📁 Key Files to Know

| File                                            | Purpose               |
| ----------------------------------------------- | --------------------- |
| `routes/web.php`                                | All routes definition |
| `app/Http/Controllers/SubmissionController.php` | Submission logic      |
| `app/Models/Submission.php`                     | Submission model      |
| `resources/js/Pages/Dashboard.jsx`              | Dashboard page        |
| `resources/js/Pages/Submissions/`               | Submission pages      |
| `database/migrations/`                          | Database schema       |
| `.env`                                          | Configuration file    |

---

## 🛠️ Common Commands

```bash
# Server
php artisan serve              # Start dev server
npm run dev                    # Start Vite dev server

# Database
php artisan migrate            # Run migrations
php artisan migrate:fresh --seed  # Reset DB with sample data
php artisan tinker            # Interactive shell

# Code
php artisan make:model User   # Create model
php artisan make:controller UserController -r  # Create controller
php artisan test              # Run tests

# Queue
php artisan queue:listen      # Listen for background jobs
php artisan queue:failed      # Check failed jobs

# Maintenance
php artisan cache:clear       # Clear cache
php artisan view:clear        # Clear view cache
```

---

## 🌳 Project Structure Quick Look

```
app/
  ├── Http/Controllers/   ← Business logic
  ├── Models/             ← Database models
  └── Jobs/               ← Background jobs

resources/
  ├── js/
  │   ├── Pages/          ← React pages
  │   ├── Components/     ← Reusable components
  │   └── Layouts/        ← Page layouts
  └── css/                ← Tailwind styles

database/
  ├── migrations/         ← Database schema
  └── seeders/            ← Sample data

routes/
  ├── web.php             ← Web routes
  └── auth.php            ← Auth routes
```

---

## 🔐 User Roles

| Role         | Access                                          |
| ------------ | ----------------------------------------------- |
| **Admin**    | Manage users, workflows, documents, full access |
| **User**     | Submit documents, view own submissions          |
| **Approver** | Approve/reject submissions (based on workflow)  |

---

## 📊 Database Models Relationship

```
User (has_many) → Submission
    ↓
Division → WorkflowStep → Workflow
    ↓
Subdivision → WorkflowStepPermission
    ↓
Document → DocumentField

Submission → SubmissionWorkflowStep (approval history)
         → SubmissionFile (attachments)
         → StampedFile (signed PDF)
```

---

## 💡 Understanding the Workflow

### Example: Leave Request Process

```
1. Employee submits leave request
   ↓
2. Manager approves (Step 1)
   ↓
3. Director approves (Step 2)
   ↓
4. HR finalizes and stamps PDF (Step 3)
   ↓
5. Submission marked as "approved"
   ↓
6. QR code generated for verification
```

**Code Flow:**

-   Submit → `SubmissionController@store()` → Create Submission record
-   Approve → `SubmissionController@approve()` → Record approval
-   Move to next step if available
-   Generate PDF and stamp with signature
-   Update status to "approved"

---

## 📝 API Response Format

### Success Response

```json
{
    "message": "Submission approved successfully",
    "data": {
        "id": 1,
        "status": "approved",
        "current_step": 2,
        "updated_at": "2025-11-19T10:30:00Z"
    }
}
```

### Error Response

```json
{
    "message": "Unauthorized",
    "errors": {
        "policy": "You cannot approve this submission"
    }
}
```

---

## 🐛 Troubleshooting

### Composer Install Issues

```bash
# Clear cache
composer clear-cache

# Update dependencies
composer update

# Install fresh
rm composer.lock
composer install
```

### Node Modules Issues

```bash
# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules
npm install
```

### Database Issues

```bash
# Check connection
php artisan tinker
>>> DB::connection()->getPdo();

# Reset database
php artisan migrate:fresh --seed
```

### Permission Issues

```bash
# Fix storage directory permissions (Linux/Mac)
chmod -R 775 storage bootstrap/cache

# On Windows, ensure proper permissions via Properties
```

---

## 📚 Learn More

-   **Full Documentation:** See `DOCUMENTATION.md`
-   **Laravel Docs:** https://laravel.com/docs
-   **React Docs:** https://react.dev
-   **Tailwind CSS:** https://tailwindcss.com

---

## 🎓 Next Steps

1. ✅ Get the app running
2. ✅ Explore the dashboard
3. ✅ Create a test submission
4. ✅ Approve/reject it
5. ✅ Review the code structure
6. ✅ Check out `DOCUMENTATION.md` for advanced topics

---

## 🤝 Need Help?

-   Check `DOCUMENTATION.md` for detailed guides
-   Review Laravel logs: `storage/logs/`
-   Browser DevTools for frontend issues
-   GitHub Issues: https://github.com/Herdiansyh/Web_ApproveltV2/issues

---

**Happy coding! 🚀**
