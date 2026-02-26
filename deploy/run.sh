#!/bin/bash
set -e

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

cd /opt/nancypelosi

# Install dependencies
echo "Installing dependencies..."
bun install

# Create data directory
mkdir -p data

# 1. Setup Nginx reverse proxy
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/pelosiinsider <<'NGINX'
server {
    listen 80;
    server_name pelosiinsider.com www.pelosiinsider.com;

    location / {
        proxy_pass http://127.0.0.1:4567;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/pelosiinsider /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 2. Setup systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/nancypelosi.service <<'SERVICE'
[Unit]
Description=Nancy Pelosi Congressional Trading Desk
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nancypelosi
Environment=PATH=/root/.bun/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable nancypelosi
systemctl start nancypelosi

echo ""
echo "=== Deployment complete ==="
echo "Bot running as systemd service"
echo "Dashboard: http://pelosiinsider.com (after DNS)"
echo ""
echo "Useful commands:"
echo "  systemctl status nancypelosi    - check status"
echo "  journalctl -u nancypelosi -f    - view logs"
echo "  systemctl restart nancypelosi   - restart bot"
echo ""
echo "Next: point pelosiinsider.com DNS A record to 187.77.103.205"
echo "Then run: certbot --nginx -d pelosiinsider.com -d www.pelosiinsider.com"
