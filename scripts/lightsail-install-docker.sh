#!/usr/bin/env bash
# Run ONCE on a fresh Ubuntu Lightsail instance (as root or with sudo).
set -euo pipefail

apt-get update -y
apt-get install -y ca-certificates curl git

# Docker Engine + Compose plugin
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu 2>/dev/null || usermod -aG docker "$SUDO_USER" 2>/dev/null || true

echo "Docker OK: $(docker --version)"
echo "Compose OK: $(docker compose version)"
echo "Log out/in (or reboot) if you need docker without sudo."
