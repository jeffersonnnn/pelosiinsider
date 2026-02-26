#!/bin/bash
set -e

echo "=== Nancy Pelosi Trading Desk - VPS Deployment ==="

# 1. Install Bun
if ! command -v bun &> /dev/null; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
  echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
fi

echo "Bun version: $(bun --version)"

# 2. Install Nginx + Certbot
echo "Installing Nginx and Certbot..."
apt update -y
apt install -y nginx certbot python3-certbot-nginx

# 3. Create project directory
mkdir -p /opt/nancypelosi
cd /opt/nancypelosi

echo "=== Project directory ready at /opt/nancypelosi ==="
echo "Next: upload project files, then run deploy/run.sh"
