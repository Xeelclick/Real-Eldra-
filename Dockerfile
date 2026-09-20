# ==============================================================================
# Multi-Stage Dockerfile for Eldra Coin (Render & Linux VPS Compatible)
# Stage 1: Build Static Frontend (Vite/React)
# Stage 2: Production PHP 8.2-FPM + Nginx + OPcache High-Throughput Server
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Production Web Server & PHP Runtime ---
FROM php:8.2-fpm-alpine

# Install Nginx, supervisor, and essential runtime dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    mariadb-client \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    && docker-php-ext-install pdo_mysql opcache mbstring

# Production PHP OPcache tuning for high throughput
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=20000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.fast_shutdown=1'; \
} > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Configure Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Configure Supervisor to run both PHP-FPM and Nginx simultaneously
COPY docker/supervisord.conf /etc/supervisord.conf

# Set application directory
WORKDIR /var/www/html

# Copy built frontend assets to webroot
COPY --from=frontend-builder /app/dist /var/www/html

# Copy PHP backend files to /var/www/html/api and includes
COPY php-backend /var/www/html/backend

# Set proper ownership & permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Render binds dynamically on PORT (default 3000 / 80)
EXPOSE 3000

# Start supervisor to keep both Nginx and PHP-FPM running
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
