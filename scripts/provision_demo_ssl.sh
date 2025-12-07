#!/bin/bash

# SSL Setup Script for Demo Environment
# Run as root: sudo ./scripts/provision_demo_ssl.sh

DOMAIN="orderdemo.zenkar.in"
PORT="3001"
NGINX_CONF="/etc/nginx/sites-available/zenkar-demo"

echo "🔧 Configuring Nginx for $DOMAIN..."

# 1. Create Nginx Config
cat > "$NGINX_CONF" <<EOF
server {
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "📝 Config created at $NGINX_CONF"

# 2. Enable Site (Symlink)
if [ ! -L "/etc/nginx/sites-enabled/zenkar-demo" ]; then
    ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
    echo "🔗 Symlinked to sites-enabled."
fi

# 3. Test & Reload Nginx
echo "🔄 Reloading Nginx..."
if nginx -t; then
    systemctl reload nginx
    echo "✅ Nginx Reloaded."
else
    echo "❌ Nginx Configuration Failed! Check $NGINX_CONF"
    exit 1
fi

# 4. Install Certificate (if Certbot available)
if command -v certbot &> /dev/null; then
    echo "🔒 Installing SSL Certificate..."
    # Attempt to install existing cert if found, or request new
    certbot install --cert-name "$DOMAIN" --nginx
else
    echo "⚠️ Certbot not found. Please install manualy or ensure it's in path."
fi
