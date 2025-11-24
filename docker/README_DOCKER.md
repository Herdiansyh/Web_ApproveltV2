# Docker Setup untuk Laravel + Inertia + React

Panduan lengkap untuk menjalankan aplikasi E-Approval di Docker dengan PHP-FPM, Nginx, Node.js, dan MySQL.

## Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                  Nginx (Port 80)                    │
│              Web Server & Reverse Proxy              │
└────────┬──────────────────────────────┬──────────────┘
         │                              │
         │ (PHP socket)                 │ (HMR/Assets)
         │                              │
    ┌────▼──────────────┐      ┌────────▼────────────┐
    │  PHP-FPM (9000)   │      │ Node.js (5173)      │
    │   app container   │      │  Vite Dev Server    │
    └────┬──────────────┘      └─────────────────────┘
         │
         │ (TCP 3306)
         │
    ┌────▼──────────────┐
    │  MySQL (3306)     │
    │  db container     │
    └───────────────────┘
```

## Persiapan Awal

1. **Copy `.env` untuk development:**
   ```bash
   cp .env.example .env
   ```

2. **Update variable di `.env`:**
   ```bash
   APP_ENV=local
   APP_DEBUG=true
   APP_URL=http://localhost

   DB_CONNECTION=mysql
   DB_HOST=db
   DB_PORT=3306
   DB_DATABASE=approveit
   DB_USERNAME=approveit
   DB_PASSWORD=secret

   CACHE_STORE=database
   SESSION_DRIVER=database
   QUEUE_CONNECTION=database
   ```

## Build & Start Containers

### 1. Build Images

```bash
# Build semua images (app, nginx, node, db)
docker-compose build

# Build spesifik (optional)
docker-compose build app    # PHP-FPM
docker-compose build node   # Vite
```

### 2. Start Containers

```bash
# Start semua services di background
docker-compose up -d

# Cek status containers
docker-compose ps

# View logs
docker-compose logs -f        # semua services
docker-compose logs -f app    # hanya app
docker-compose logs -f nginx  # hanya nginx
docker-compose logs -f node   # hanya node
docker-compose logs -f db     # hanya db
```

### 3. Generate App Key

```bash
docker-compose exec app php artisan key:generate
```

### 4. Run Database Migrations

```bash
# Tunggu DB siap (~10-15 detik setelah start)
docker-compose exec app php artisan migrate --force

# Seed database (optional)
docker-compose exec app php artisan db:seed
```

## Akses Aplikasi

- **Web Application:** http://localhost
- **Vite Dev Server:** http://localhost:5173
  - Assets akan di-serve otomatis dari `http://localhost` (Nginx menghandle HMR)
  - Port 5173 tersedia untuk debugging langsung Vite jika diperlukan

## Development Workflow

### Menggunakan Vite Dev Server

Node container sudah menjalankan `npm run dev` secara default:

```bash
# Dev server sudah running, cukup edit files dan auto-reload akan terjadi
# Assets akan ter-build dan serve melalui Vite dev server
# Nginx akan proxy request ke PHP-FPM dan static files dari public/build
```

### Production Build (Build Assets)

Jika ingin build assets sekali untuk production:

```bash
# Build assets (menghasilkan public/build/)
docker-compose exec node npm run build

# Atau run command langsung di node container
docker-compose run --rm node npm run build
```

### Composer Commands

```bash
# Install/update dependencies
docker-compose exec app composer install
docker-compose exec app composer update

# Require package baru
docker-compose exec app composer require package/name
docker-compose exec app composer require --dev package/name
```

### Laravel Artisan Commands

```bash
# Tinker (interactive shell)
docker-compose exec app php artisan tinker

# Cache
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:cache

# Storage link
docker-compose exec app php artisan storage:link

# Generate permission indexes (optimization)
docker-compose exec app php artisan migrate
```

### NPM Commands

```bash
# Install dependencies
docker-compose exec node npm install

# Install package baru
docker-compose exec node npm install package-name

# Dev server (sudah running)
# Stop: Ctrl+C dalam logs

# Build untuk production
docker-compose exec node npm run build
```

## MySQL Database Access

### Dari Host Machine

```bash
# Koneksi MySQL dari command line (pastikan MySQL client terinstal)
mysql -h 127.0.0.1 -P 3306 -u approveit -p
# Password: secret

# Atau gunakan tools seperti:
# - MySQL Workbench
# - DBeaver
# - TablePlus
```

### Dari dalam Container

```bash
docker-compose exec db mysql -u approveit -p approveit
# Password: secret
```

## Cleanup & Restart

```bash
# Stop containers
docker-compose stop

# Restart containers (maintain volumes)
docker-compose start
docker-compose restart

# Remove containers (keep volumes)
docker-compose down

# Remove containers + volumes (DANGER - hapus database!)
docker-compose down -v

# Rebuild dari fresh
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
docker-compose exec app php artisan migrate --force
```

## Troubleshooting

### "Connection refused" ke MySQL

```bash
# Tunggu DB siap
docker-compose logs db | grep "ready for connections"

# Cek health
docker-compose exec db mysqladmin -u root -proot ping
```

### PHP-FPM error atau laravel error

```bash
# Lihat error log
docker-compose logs app

# Cek permission storage
docker-compose exec app ls -la storage/
docker-compose exec app chmod -R 0775 storage bootstrap/cache
```

### Node/Vite tidak build assets

```bash
# Rebuild node image
docker-compose build node --no-cache
docker-compose up -d node

# Manual build
docker-compose exec node npm run build

# Cek build output
docker-compose exec app ls -la public/build/
```

### Port sudah digunakan

Jika port 80, 3306, atau 5173 sudah digunakan:

**docker-compose.yml:** Ubah port mapping (contoh):
```yaml
ports:
  - "8080:80"      # Nginx
  - "3307:3306"    # MySQL
  - "5174:5173"    # Vite
```

Kemudian update `APP_URL` di `.env`:
```
APP_URL=http://localhost:8080
```

## File-file Docker

- **Dockerfile** - PHP-FPM image
- **Dockerfile.node** - Node.js image untuk Vite
- **docker/nginx.conf** - Konfigurasi Nginx
- **docker-compose.yml** - Services configuration
- **.dockerignore** - Files untuk exclude dari build context

## Performance Tips

1. **Cache Layer:**
   - Gunakan `CACHE_STORE=redis` jika perlu performance lebih baik
   - Tambahkan service `redis` di docker-compose.yml jika diperlukan

2. **Database:**
   - Jangan lupa jalankan migration dengan indexes
   - Gunakan database backups

3. **Assets:**
   - Production build (npm run build) akan menghasilkan assets yang optimal
   - Nginx sudah configured dengan gzip compression

4. **Logs:**
   - Monitor logs untuk debugging: `docker-compose logs -f`
   - Customize log level di `.env` dengan `LOG_LEVEL`

## Production Deployment

Untuk production:

1. Ubah `APP_ENV=production` dan `APP_DEBUG=false` di `.env`
2. Gunakan secret/strong passwords untuk DB dan APP_KEY
3. Build assets sekali: `docker exec node npm run build`
4. Pertimbangkan menggunakan container registry (Docker Hub, ECR, etc.)
5. Setup proper reverse proxy (Traefik, HAProxy) untuk HTTPS
6. Backup database secara regular

---

Untuk pertanyaan atau issue, cek logs dengan `docker-compose logs -f [service-name]`

