#!/usr/bin/env bash
# Ubuntu 24.04, executed as the unprivileged deployment account with sudo.
set -euo pipefail
source /etc/os-release
[[ "$ID:$VERSION_ID" == ubuntu:24.04 ]] || { echo "Ubuntu 24.04 required" >&2; exit 2; }
sudo apt-get update
sudo apt-get install -y ca-certificates curl nginx openssl
sudo install -d -m 0755 /etc/apt/keyrings
curl --fail --silent --show-error https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
sudo chmod 0644 /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu noble stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
sudo usermod -aG docker "$(id -un)"
sudo install -d -m 0750 -o "$(id -un)" /opt/itmo-booking
"$(dirname "$0")/init-server-env.sh"
sudo install -m 0644 "$(dirname "$0")/nginx/host.conf" /etc/nginx/conf.d/booking-lab.conf
sudo nginx -t && sudo systemctl reload nginx
