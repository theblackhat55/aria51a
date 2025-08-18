#!/bin/bash
# GRC 3.1 - Complete Enterprise Stack Installation
# Kong Gateway + Keycloak + Risk Management Platform
# Ubuntu/Docker Production-Ready Setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/installation.log"
SERVICES=("postgres" "redis" "kong" "keycloak" "risk-app" "prometheus" "grafana" "nginx")

# Logging function
log() {
    echo -e "${1}" | tee -a "$LOG_FILE"
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

# Banner
show_banner() {
    log "${BLUE}"
    log "╔══════════════════════════════════════════════════════════════════════════════╗"
    log "║                           GRC TIER 3.1 INSTALLER                            ║"
    log "║                   Enterprise Risk Management Platform                        ║"
    log "║                                                                              ║"
    log "║  🔐 Kong Gateway API Management                                              ║"
    log "║  🔑 Keycloak Identity & Access Management                                    ║"
    log "║  📊 Risk Management Application                                              ║"
    log "║  📈 Prometheus + Grafana Monitoring                                         ║"
    log "║  🔒 Production Security & Performance                                        ║"
    log "╚══════════════════════════════════════════════════════════════════════════════╝"
    log "${NC}"
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "This script is designed for Linux systems (Ubuntu/Debian preferred)"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Installing Docker..."
        install_docker
    else
        log_success "Docker is installed: $(docker --version)"
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Installing Docker Compose..."
        install_docker_compose
    else
        log_success "Docker Compose is available"
    fi
    
    # Check available memory
    MEM_TOTAL=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$MEM_TOTAL" -lt 4096 ]; then
        log_warning "System has ${MEM_TOTAL}MB RAM. 4GB+ is recommended for optimal performance."
    else
        log_success "System has ${MEM_TOTAL}MB RAM - sufficient for GRC Tier platform"
    fi
    
    # Check available disk space
    DISK_AVAIL=$(df -m . | awk 'NR==2{printf "%.0f", $4}')
    if [ "$DISK_AVAIL" -lt 10240 ]; then
        log_warning "Available disk space: ${DISK_AVAIL}MB. 10GB+ is recommended."
    else
        log_success "Available disk space: ${DISK_AVAIL}MB - sufficient"
    fi
}

# Install Docker
install_docker() {
    log_info "Installing Docker..."
    
    # Update package database
    sudo apt-get update
    
    # Install dependencies
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    log_success "Docker installed successfully"
    log_warning "Please log out and log back in for Docker group changes to take effect"
}

# Install Docker Compose
install_docker_compose() {
    log_info "Installing Docker Compose..."
    
    # Download Docker Compose
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker Compose installed successfully"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p \
        "$SCRIPT_DIR/logs" \
        "$SCRIPT_DIR/data" \
        "$SCRIPT_DIR/nginx/ssl" \
        "$SCRIPT_DIR/monitoring/dashboards" \
        "$SCRIPT_DIR/backups"
    
    log_success "Directories created"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    SSL_DIR="$SCRIPT_DIR/nginx/ssl"
    
    if [ ! -f "$SSL_DIR/kong.crt" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/kong.key" \
            -out "$SSL_DIR/kong.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        # Set proper permissions
        chmod 600 "$SSL_DIR/kong.key"
        chmod 644 "$SSL_DIR/kong.crt"
        
        log_success "SSL certificates generated"
    else
        log_info "SSL certificates already exist"
    fi
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    sudo apt-get update && sudo apt-get upgrade -y
    log_success "System packages updated"
}

# Configure firewall (optional)
configure_firewall() {
    if command -v ufw &> /dev/null; then
        log_info "Configuring firewall..."
        
        # Allow SSH
        sudo ufw allow ssh
        
        # Allow HTTP/HTTPS
        sudo ufw allow 80
        sudo ufw allow 443
        
        # Allow application ports
        sudo ufw allow 8000  # Kong Gateway
        sudo ufw allow 8001  # Kong Admin
        sudo ufw allow 8002  # Kong Manager
        sudo ufw allow 8080  # Keycloak
        sudo ufw allow 3000  # Risk App
        sudo ufw allow 3001  # Grafana
        sudo ufw allow 9090  # Prometheus
        
        # Enable firewall
        sudo ufw --force enable
        
        log_success "Firewall configured"
    else
        log_info "UFW not installed, skipping firewall configuration"
    fi
}

# Pull Docker images
pull_images() {
    log_info "Pulling Docker images..."
    
    IMAGES=(
        "postgres:15-alpine"
        "redis:7-alpine"
        "kong:3.6-alpine"
        "quay.io/keycloak/keycloak:23.0"
        "nginx:1.24-alpine"
        "prom/prometheus:v2.45.0"
        "grafana/grafana:10.0.0"
        "containrrr/watchtower:latest"
    )
    
    for image in "${IMAGES[@]}"; do
        log_info "Pulling $image..."
        docker pull "$image"
    done
    
    log_success "All Docker images pulled"
}

# Build application image
build_application() {
    log_info "Building Risk Management application..."
    
    cd "$SCRIPT_DIR"
    
    # Build the application
    docker build -f Dockerfile.kong -t risk-management:latest .
    
    log_success "Application built successfully"
}

# Start services
start_services() {
    log_info "Starting GRC Tier services..."
    
    cd "$SCRIPT_DIR"
    
    # Start all services
    docker compose up -d
    
    log_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        local healthy_services=0
        
        for service in "${SERVICES[@]}"; do
            if docker compose ps "$service" | grep -q "healthy\|running"; then
                ((healthy_services++))
            fi
        done
        
        if [ $healthy_services -eq ${#SERVICES[@]} ]; then
            log_success "All services are healthy!"
            return 0
        fi
        
        log_info "Waiting for services to be ready... ($healthy_services/${#SERVICES[@]} healthy)"
        sleep 10
        ((attempt++))
    done
    
    log_error "Services failed to become healthy within the timeout period"
    return 1
}

# Configure Kong
configure_kong() {
    log_info "Configuring Kong Gateway..."
    
    # Wait for Kong Admin API to be available
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:8001/status > /dev/null 2>&1; then
            break
        fi
        log_info "Waiting for Kong Admin API... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Kong Admin API is not responding"
        return 1
    fi
    
    # Create Kong service for Risk Management app
    curl -X POST http://localhost:8001/services \
        -H "Content-Type: application/json" \
        -d '{
            "name": "risk-management-service",
            "protocol": "http",
            "host": "risk-app",
            "port": 3000,
            "path": "/"
        }' > /dev/null 2>&1
    
    # Create Kong routes
    curl -X POST http://localhost:8001/services/risk-management-service/routes \
        -H "Content-Type: application/json" \
        -d '{
            "name": "api-routes",
            "paths": ["/api"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        }' > /dev/null 2>&1
    
    curl -X POST http://localhost:8001/services/risk-management-service/routes \
        -H "Content-Type: application/json" \
        -d '{
            "name": "app-routes",
            "paths": ["/", "/login", "/static"],
            "methods": ["GET", "POST"]
        }' > /dev/null 2>&1
    
    # Enable plugins
    curl -X POST http://localhost:8001/plugins \
        -H "Content-Type: application/json" \
        -d '{
            "name": "cors",
            "config": {
                "origins": ["*"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                "headers": ["Accept", "Authorization", "Content-Type", "X-Requested-With"],
                "credentials": true,
                "max_age": 86400
            }
        }' > /dev/null 2>&1
    
    curl -X POST http://localhost:8001/plugins \
        -H "Content-Type: application/json" \
        -d '{
            "name": "rate-limiting",
            "config": {
                "minute": 100,
                "hour": 1000,
                "day": 10000,
                "policy": "redis",
                "redis_host": "redis",
                "redis_password": "redis_secure_password_2024"
            }
        }' > /dev/null 2>&1
    
    log_success "Kong configured successfully"
}

# Test services
test_services() {
    log_info "Testing services..."
    
    local services_to_test=(
        "http://localhost:80|Nginx Load Balancer"
        "http://localhost:8000|Kong Gateway"
        "http://localhost:8001/status|Kong Admin API"
        "http://localhost:8080/health|Keycloak"
        "http://localhost:3000/api/health|Risk Management App"
        "http://localhost:9090|Prometheus"
        "http://localhost:3001|Grafana"
    )
    
    local failed_tests=0
    
    for service_test in "${services_to_test[@]}"; do
        IFS='|' read -r url name <<< "$service_test"
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$name is responding"
        else
            log_error "$name is not responding at $url"
            ((failed_tests++))
        fi
    done
    
    if [ $failed_tests -eq 0 ]; then
        log_success "All services are responding correctly!"
        return 0
    else
        log_error "$failed_tests service(s) failed health checks"
        return 1
    fi
}

# Show final information
show_final_info() {
    log_success "GRC Tier 3.1 installation completed successfully!"
    log ""
    log "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗"
    log "║                            ACCESS INFORMATION                                ║"
    log "╠══════════════════════════════════════════════════════════════════════════════╣"
    log "║  🌐 Main Application:      http://localhost                                 ║"
    log "║  🔐 Kong Gateway:          http://localhost:8000                            ║"
    log "║  ⚙️  Kong Admin:           http://localhost:8001                            ║"
    log "║  🎛️  Kong Manager:         http://localhost:8002                            ║"
    log "║  🔑 Keycloak:             http://localhost:8080                            ║"
    log "║  📊 Risk Management:      http://localhost:3000                            ║"
    log "║  📈 Prometheus:           http://localhost:9090                            ║"
    log "║  📊 Grafana:              http://localhost:3001                            ║"
    log "╠══════════════════════════════════════════════════════════════════════════════╣"
    log "║                            DEFAULT CREDENTIALS                              ║"
    log "╠══════════════════════════════════════════════════════════════════════════════╣"
    log "║  👤 Risk Management:                                                        ║"
    log "║     • admin / admin_secure_password_2024                                    ║"
    log "║     • avi_security / demo123                                                ║"
    log "║                                                                              ║"
    log "║  🔑 Keycloak Admin:                                                         ║"
    log "║     • admin / admin_secure_password_2024                                    ║"
    log "║                                                                              ║"
    log "║  📊 Grafana:                                                                ║"
    log "║     • admin / admin_secure_password_2024                                    ║"
    log "╠══════════════════════════════════════════════════════════════════════════════╣"
    log "║                            MANAGEMENT COMMANDS                              ║"
    log "╠══════════════════════════════════════════════════════════════════════════════╣"
    log "║  🔄 Restart all services:  docker compose restart                          ║"
    log "║  📋 View logs:             docker compose logs -f [service-name]           ║"
    log "║  🛑 Stop all services:     docker compose down                             ║"
    log "║  🔍 Check status:          docker compose ps                               ║"
    log "║  📊 System resources:      docker stats                                     ║"
    log "╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    log ""
    log_info "Installation log saved to: $LOG_FILE"
    log_info "Configuration files are in: $SCRIPT_DIR"
    log_warning "⚠️  Change default passwords before production deployment!"
    log ""
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Installation failed. Check the log file for details: $LOG_FILE"
        log_info "To debug issues:"
        log_info "  - Check Docker logs: docker compose logs"
        log_info "  - Check service status: docker compose ps"
        log_info "  - Check system resources: docker stats"
    fi
}

# Main installation function
main() {
    # Set up error handling
    trap cleanup EXIT
    
    # Start installation
    log_info "Starting GRC Tier 3.1 installation at $(date)"
    show_banner
    
    # Run installation steps
    check_requirements
    update_system
    create_directories
    generate_ssl_certificates
    configure_firewall
    pull_images
    build_application
    start_services
    wait_for_services
    configure_kong
    test_services
    show_final_info
    
    log_success "Installation completed successfully at $(date)"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi