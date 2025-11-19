# Developer Setup Guide - E-Approval System

**Last Updated:** November 19, 2025

This guide helps developers set up their local development environment for the E-Approval System project.

---

## 📋 Prerequisites

### Required Software

-   **PHP** 8.2+ ([Download](https://www.php.net/downloads))
-   **Composer** 2.0+ ([Download](https://getcomposer.org/download/))
-   **Node.js** 16+ ([Download](https://nodejs.org/))
-   **npm** 8+ (comes with Node.js)
-   **Git** ([Download](https://git-scm.com/))
-   **MySQL** 8.0+ OR **SQLite** (built-in with PHP)

### Optional Tools

-   **Docker** & **Docker Compose** (for containerized setup)
-   **VS Code** (recommended editor)
-   **Postman** (for API testing)
-   **TablePlus** or **MySQL Workbench** (database management)

### Recommended VS Code Extensions

-   PHP Intelephense
-   Laravel Artisan
-   Laravel Blade Snippets
-   ES7+ React/Redux/React-Native snippets
-   Tailwind CSS IntelliSense
-   Prettier
-   ESLint

---

## 🔧 Step-by-Step Setup

### 1. Clone Repository

```bash
# Using HTTPS
git clone https://github.com/Herdiansyh/Web_ApproveltV2.git
cd Web_ApproveltV2

# Or using SSH
git clone git@github.com:Herdiansyh/Web_ApproveltV2.git
cd Web_ApproveltV2

# Switch to development branch
git checkout QrCode
```

### 2. Install PHP Dependencies

```bash
# Install Composer dependencies
composer install

# If you encounter issues
composer clear-cache
composer update
```

### 3. Setup Environment File

```bash
# Copy example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Configure Database

#### Option A: Using MySQL

Edit `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=approveit_dev
DB_USERNAME=root
DB_PASSWORD=your_password
```

Create database:

```bash
# Linux/Mac
mysql -u root -p -e "CREATE DATABASE approveit_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Or use GUI tool like MySQL Workbench
```

#### Option B: Using SQLite

Edit `.env` file:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

Create database file:

```bash
touch database/database.sqlite
```

### 5. Run Database Migrations

```bash
# Run all migrations
php artisan migrate

# Or reset and seed with sample data
php artisan migrate:fresh --seed
```

Verify migrations:

```bash
php artisan migrate:status
```

### 6. Install Node Dependencies

```bash
# Install npm packages
npm install

# If you have issues with node-gyp on Windows
npm install --global windows-build-tools
npm install
```

### 7. Build Frontend Assets

```bash
# Development build (with source maps)
npm run build

# Or start Vite dev server with watch
npm run dev
```

### 8. Verify Installation

```bash
# Check PHP version
php --version

# Check Composer
composer --version

# Check Node
node --version
npm --version

# Check Laravel installation
php artisan --version
```

---

## 🚀 Starting Development Servers

### Option 1: Multiple Terminal Windows (Recommended)

**Terminal 1: Laravel Development Server**

```bash
php artisan serve
# Server runs at http://localhost:8000
```

**Terminal 2: Vite Dev Server**

```bash
npm run dev
# Vite runs at http://localhost:5173
# Auto-reloads on React/JS changes
```

**Terminal 3: Queue Worker (Optional)**

```bash
php artisan queue:listen
# Processes background jobs
```

**Terminal 4: Tail Logs (Optional)**

```bash
php artisan pail
# Shows real-time logs
```

### Option 2: Using Concurrently Script

```bash
# Install concurrently globally (optional)
npm install -g concurrently

# Or use from npm scripts
composer run dev
```

### Option 3: Docker Setup (Optional)

If you have Docker installed:

```bash
# Build and start containers
docker-compose up -d

# Run migrations in container
docker-compose exec app php artisan migrate:fresh --seed

# Access application at http://localhost:8000
```

---

## 📁 Project Layout for Development

```
Web_ApproveltV2/
├── app/                    # Backend code
│   ├── Http/Controllers/   # Request handlers
│   ├── Models/             # Database models
│   ├── Jobs/               # Queue jobs
│   └── Notifications/      # Email notifications
├── resources/
│   ├── js/                 # React components & pages
│   │   ├── Pages/          # Page components
│   │   ├── Components/     # Reusable components
│   │   └── Layouts/        # Page layouts
│   └── css/                # Tailwind CSS
├── database/
│   ├── migrations/         # Database schema
│   ├── factories/          # Test data factories
│   └── seeders/            # Initial data seeders
├── routes/
│   ├── web.php             # Web routes
│   └── auth.php            # Auth routes
├── tests/                  # Test files
├── storage/                # Uploaded files & logs
├── .env                    # Environment variables
├── composer.json           # PHP dependencies
└── package.json            # Node dependencies
```

---

## 🔑 Default Test Credentials

After running seeders, you can login with:

**Admin Account:**

```
Email: admin@example.com
Password: password
```

**User Account:**

```
Email: user@example.com
Password: password
```

**Manager Account (Approver):**

```
Email: manager@example.com
Password: password
```

---

## 💡 Common Development Tasks

### Creating a New Feature

#### 1. Create Database Schema

```bash
# Generate migration
php artisan make:migration create_orders_table

# Edit database/migrations/YYYY_MM_DD_*_create_orders_table.php
# Define table structure

# Run migration
php artisan migrate
```

#### 2. Create Model

```bash
# Generate model
php artisan make:model Order

# Edit app/Models/Order.php
# Add relationships and methods
```

#### 3. Create Controller

```bash
# Generate resourceful controller (CRUD)
php artisan make:controller OrderController -r

# Edit app/Http/Controllers/OrderController.php
# Implement index, show, create, store, edit, update, destroy
```

#### 4. Create Policy (Authorization)

```bash
# Generate policy
php artisan make:policy OrderPolicy

# Edit app/Policies/OrderPolicy.php
# Implement view, create, update, delete methods
```

#### 5. Add Routes

```php
// routes/web.php
Route::resource('orders', OrderController::class)->middleware('auth');
// This automatically creates routes:
// GET    /orders              -> index
// POST   /orders              -> store
// GET    /orders/create       -> create
// GET    /orders/{id}         -> show
// PUT    /orders/{id}         -> update
// DELETE /orders/{id}         -> destroy
```

#### 6. Create React Pages

```bash
# Create new pages
mkdir -p resources/js/Pages/Orders
touch resources/js/Pages/Orders/Index.jsx
touch resources/js/Pages/Orders/Show.jsx
touch resources/js/Pages/Orders/Create.jsx
```

#### 7. Test Your Feature

```bash
# Run tests
php artisan test

# Run specific test
php artisan test tests/Feature/OrderTest.php
```

### Working with Database

```bash
# Connect to database (tinker)
php artisan tinker

# List all users
>>> User::all()

# Create record
>>> Order::create(['name' => 'Order 1', 'user_id' => 1])

# Query records
>>> Order::where('status', 'pending')->get()

# Update record
>>> $order = Order::find(1); $order->update(['status' => 'completed'])

# Delete record
>>> Order::find(1)->delete()

# Exit tinker
>>> exit
```

### Debugging Code

#### PHP Debugging

```php
// In controller or model
Log::debug('Message', ['variable' => $value]);

// Dump and die
dd($variable);

// Just dump
dump($variable);

// Check if variable contains something
ray($variable);
```

#### React Debugging

```jsx
// In React component
console.log("Variable:", variable);
console.error("Error:", error);

// Debugger
debugger; // Pause execution in DevTools
```

#### Browser DevTools

-   **Network Tab**: Check API requests/responses
-   **Console Tab**: View JavaScript errors
-   **React DevTools**: Inspect component state/props
-   **Redux DevTools**: (if using Redux)

### Testing

```bash
# Run all tests
php artisan test

# Run tests with coverage
php artisan test --coverage

# Run specific test class
php artisan test tests/Feature/SubmissionTest.php

# Run specific test method
php artisan test --filter test_user_can_create_submission

# Run tests in parallel
php artisan test --parallel

# Stop on first failure
php artisan test --stop-on-failure
```

### Code Formatting

```bash
# Format PHP code (Laravel Pint)
./vendor/bin/pint

# Format with specific rule set
./vendor/bin/pint --preset laravel

# Check without formatting
./vendor/bin/pint --test

# Format JavaScript (Prettier)
npx prettier --write resources/js

# Check without formatting
npx prettier --check resources/js
```

### Manage Database

```bash
# Show migrations status
php artisan migrate:status

# Rollback last batch
php artisan migrate:rollback

# Rollback all
php artisan migrate:reset

# Fresh migrate (reset + migrate)
php artisan migrate:fresh

# Fresh migrate with seeders
php artisan migrate:fresh --seed

# Refresh (rollback + migrate)
php artisan migrate:refresh

# Run seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=UserSeeder
```

---

## 🔍 Useful Artisan Commands

```bash
# List all commands
php artisan list

# Get help for a command
php artisan help migrate

# Tinker (interactive shell)
php artisan tinker

# Cache
php artisan cache:clear
php artisan config:cache
php artisan view:clear

# Queue
php artisan queue:listen
php artisan queue:work
php artisan queue:failed
php artisan queue:retry all
php artisan queue:flush

# Make commands
php artisan make:model Order -a          # Model + migration + controller + factory + seeder
php artisan make:controller UserController -r  # Resource controller
php artisan make:migration create_users_table
php artisan make:seeder UserSeeder
php artisan make:request StoreOrderRequest
php artisan make:policy OrderPolicy
php artisan make:job SendEmail
php artisan make:event OrderCreated
php artisan make:listener SendOrderNotification
php artisan make:mail OrderCreatedMail
php artisan make:notification OrderNotification

# Maintenance
php artisan down                         # Put app in maintenance mode
php artisan up                          # Bring app back up
php artisan optimize                    # Optimize app
php artisan storage:link                # Link public/storage to storage/app/public
```

---

## 🐛 Troubleshooting Development

### PHP Issues

**"PHP 8.2 not found"**

```bash
# Check PHP version
php --version

# If wrong version, use absolute path
/usr/local/bin/php --version

# Or update PATH environment variable
```

**"Class not found" errors**

```bash
# Clear autoloader cache
composer dump-autoload

# Or with optimization
composer dump-autoload --optimize
```

### Node/npm Issues

**"npm ERR! ERESOLVE unable to resolve dependency tree"**

```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Or clear npm cache
npm cache clean --force
npm install
```

**"Module not found" errors**

```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**"Connection refused" to MySQL**

```bash
# Check MySQL is running
sudo service mysql status

# Or on Mac
brew services list

# If not running, start it
sudo service mysql start
```

**"SQLSTATE[HY000]: General error: 1 out of memory"**

```bash
# Use SQLite instead for development
# Or increase MySQL memory limits
```

### Vite/Build Issues

**"Failed to resolve module"**

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall and rebuild
npm install
npm run build
```

**"Port 5173 already in use"**

```bash
# Kill process using port
# On Mac/Linux
lsof -i :5173
kill -9 <PID>

# On Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 🤝 Git Workflow

### Feature Branch Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
```

### Keeping Branch Updated

```bash
# Fetch latest changes from main
git fetch origin main

# Rebase your branch
git rebase origin/main

# Or merge if rebase has conflicts
git merge origin/main
```

### Before Committing

```bash
# Format code
./vendor/bin/pint
npx prettier --write .

# Run tests
php artisan test

# Check for issues
npm run lint
```

---

## 📚 Learning Resources

### Documentation

-   [Laravel Documentation](https://laravel.com/docs)
-   [React Documentation](https://react.dev)
-   [Inertia.js Documentation](https://inertiajs.com/)
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Video Tutorials

-   [Laracasts](https://laracasts.com) - Laravel & PHP tutorials
-   [egghead.io](https://egghead.io) - React tutorials
-   [YouTube](https://www.youtube.com) - Search for Laravel + React

### Communities

-   [Laravel Subreddit](https://www.reddit.com/r/laravel/)
-   [React Discord](https://discord.gg/react)
-   [Laravel Slack Channel](https://larachat.co/)

---

## ✅ Development Checklist

-   [ ] Clone repository and switch to QrCode branch
-   [ ] Install PHP dependencies (composer install)
-   [ ] Install Node dependencies (npm install)
-   [ ] Setup .env file with APP_KEY
-   [ ] Configure database connection
-   [ ] Run migrations (php artisan migrate)
-   [ ] Run seeders (php artisan migrate:fresh --seed)
-   [ ] Build frontend assets (npm run build)
-   [ ] Start Laravel server (php artisan serve)
-   [ ] Start Vite dev server (npm run dev)
-   [ ] Test login with default credentials
-   [ ] Verify all pages load correctly
-   [ ] Create a test submission
-   [ ] Approve the submission

---

**Happy developing! 🚀**

For questions or issues, check the main documentation in `DOCUMENTATION.md`.
