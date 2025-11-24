# Dockerfile untuk Laravel dengan PHP-FPM
# Base image: php:8.2-fpm
# Container: app

FROM php:8.2-fpm

WORKDIR /var/www/html

# Install system dependencies dan PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libxml2-dev \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    pdo \
    pdo_mysql \
    gd \
    bcmath \
    ctype \
    fileinfo \
    json \
    curl \
    xml \
    mbstring \
    zip \
    opcache \
    pcntl \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . .

# Install PHP dependencies
RUN composer install --prefer-dist --no-dev --no-scripts --no-interaction --optimize-autoloader

# Create symbolic link untuk storage
RUN php artisan storage:link --force 2>/dev/null || true

# Set permissions untuk storage dan bootstrap cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 0775 /var/www/html/storage /var/www/html/bootstrap/cache

# Install opcache dan konfigurasi
RUN echo "opcache.enable=1\nopcache.memory_consumption=256\nopcache.interned_strings_buffer=16\nopcache.max_accelerated_files=20000\nopcache.validate_timestamps=0\nopcache.revalidate_freq=60" > /usr/local/etc/php/conf.d/opcache.ini

# Expose PHP-FPM port (internal use only, tidak public)
EXPOSE 9000

# Run PHP-FPM
CMD ["php-fpm"]
