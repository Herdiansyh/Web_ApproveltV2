# Docker Quick Reference

## Setup Awal (Hanya Sekali)

```bash
# 1. Copy dan configure .env
cp .env.example .env

# Edit .env (gunakan text editor):
# DB_HOST=db
# DB_DATABASE=approveit
# DB_USERNAME=approveit
# DB_PASSWORD=secret

# 2. Build images
docker-compose build

# 3. Start containers
docker-compose up -d

# 4. Setup Laravel
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate --force

# Buka http://localhost
```

## Daily Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# View logs
docker-compose logs -f app       # Laravel app
docker-compose logs -f nginx     # Web server
docker-compose logs -f node      # Vite dev server
docker-compose logs -f db        # Database

# Run artisan commands
docker-compose exec app php artisan tinker
docker-compose exec app php artisan migrate
docker-compose exec app php artisan cache:clear

# Run composer commands
docker-compose exec app composer install
docker-compose exec app composer require vendor/package

# Run npm commands
docker-compose exec node npm install
docker-compose exec node npm run build

# Database access
docker-compose exec db mysql -u approveit -p approveit
```

## Ports

- **80** → Nginx Web Server → http://localhost
- **5173** → Vite Dev Server → http://localhost:5173
- **3306** → MySQL Database (internal)
- **9000** → PHP-FPM (internal)

## Architecture

```
Browser
   │
   ├─→ http://localhost:80 (Nginx)
   │      ├─→ Static Files (CSS/JS/Images)
   │      └─→ PHP Requests → :9000 (PHP-FPM)
   │
   └─→ http://localhost:5173 (Vite Dev, optional)
```

## Containers

1. **app** - PHP-FPM (Laravel)
2. **nginx** - Web Server
3. **node** - Vite Development Server
4. **db** - MySQL Database

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | `docker-compose logs db` - tunggu DB ready |
| Permission denied | `docker-compose exec app chmod -R 0775 storage` |
| Assets not loading | `docker-compose exec node npm run build` |
| Port already in use | Ubah port di docker-compose.yml |
| Database password salah | Cek .env vs docker-compose.yml |

## Volume Mapping

```
./                    → /var/www/html
./vendor              → /var/www/html/vendor
./storage             → /var/www/html/storage
db_data               → /var/lib/mysql
```

## Cleanup

```bash
# Remove containers (keep volumes/data)
docker-compose down

# Remove everything (DANGER!)
docker-compose down -v

# Rebuild clean
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Network

Internal network: `approveit`
- app dapat diakses dari nginx di `app:9000`
- db dapat diakses dari app di `db:3306`
- node dapat diakses dari nginx di `node:5173` (untuk HMR)
