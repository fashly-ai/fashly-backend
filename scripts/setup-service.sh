#!/bin/bash

# Script to set up fashly-backend as a systemd service

set -e

echo "🔧 Setting up Fashly Backend as a systemd service..."

# Configuration
APP_DIR="${APP_DIR:-/opt/fashly-backend}"
SERVICE_NAME="fashly-backend"
SERVICE_USER="${SERVICE_USER:-fashly}"
NODE_PATH="${NODE_PATH:-/usr/bin/node}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Create service user if it doesn't exist
if ! id "$SERVICE_USER" &>/dev/null; then
    print_status "Creating service user: $SERVICE_USER"
    useradd --system --shell /bin/false --home "$APP_DIR" --create-home "$SERVICE_USER"
else
    print_status "Service user $SERVICE_USER already exists"
fi

# Create application directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory: $APP_DIR"
    mkdir -p "$APP_DIR"
fi

# Set ownership
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Create systemd service file
print_status "Creating systemd service file..."

cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=Fashly Backend API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=$APP_DIR/.env
ExecStart=$NODE_PATH $APP_DIR/dist/main.js
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
RestartSec=5
Restart=always
RestartPreventExitStatus=255

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$APP_DIR
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
print_status "Reloading systemd daemon..."
systemctl daemon-reload

# Enable service
print_status "Enabling $SERVICE_NAME service..."
systemctl enable "$SERVICE_NAME"

print_status "✅ Service setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Clone your repository to $APP_DIR"
print_status "2. Create $APP_DIR/.env with your configuration"
print_status "3. Run the deployment script: ./scripts/deploy.sh"
print_status ""
print_status "Useful commands:"
print_status "  sudo systemctl start $SERVICE_NAME    # Start the service"
print_status "  sudo systemctl stop $SERVICE_NAME     # Stop the service"
print_status "  sudo systemctl status $SERVICE_NAME   # Check service status"
print_status "  sudo journalctl -u $SERVICE_NAME -f   # View logs"
