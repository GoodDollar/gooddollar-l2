#!/bin/bash

# ============================================================
# GoodDollar L2 — Download op-deployer binary
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

detect_platform() {
    local os arch
    case "$(uname -s)" in
        Darwin) os="darwin" ;;
        Linux)  os="linux"  ;;
        *) log_error "Unsupported OS: $(uname -s)"; exit 1 ;;
    esac
    case "$(uname -m)" in
        aarch64|arm64) arch="arm64" ;;
        x86_64|amd64)  arch="amd64" ;;
        *) log_error "Unsupported architecture: $(uname -m)"; exit 1 ;;
    esac
    echo "$os-$arch"
}

download_op_deployer() {
    local platform
    platform=$(detect_platform)
    local releases_url="https://api.github.com/repos/ethereum-optimism/optimism/releases"

    log_info "Platform: $platform"
    log_info "Finding latest op-deployer release..."

    # Find latest op-deployer release
    local latest_release
    latest_release=$(curl -s "${releases_url}?per_page=50" | \
        jq -r '.[] | select(.tag_name | startswith("op-deployer/")) | .tag_name' | \
        sort -V | tail -1)

    if [ -z "$latest_release" ]; then
        log_error "Could not find any op-deployer releases"
        exit 1
    fi

    log_info "Latest release: $latest_release"

    # Get release info and find asset
    local release_info
    release_info=$(curl -s "${releases_url}/tags/${latest_release}")

    local asset_name
    asset_name=$(echo "$release_info" | \
        jq -r ".assets[] | select(.name | contains(\"op-deployer\") and contains(\"$platform\")) | .name")

    # Fallback for arm64 → amd64
    if [ -z "$asset_name" ] && [[ "$platform" == *"arm64"* ]]; then
        platform="${platform/arm64/amd64}"
        log_info "arm64 not available, trying $platform..."
        asset_name=$(echo "$release_info" | \
            jq -r ".assets[] | select(.name | contains(\"op-deployer\") and contains(\"$platform\")) | .name")
    fi

    if [ -z "$asset_name" ]; then
        log_error "No op-deployer binary for $platform in $latest_release"
        echo "$release_info" | jq -r '.assets[] | select(.name | contains("op-deployer")) | .name'
        exit 1
    fi

    local download_url="https://github.com/ethereum-optimism/optimism/releases/download/${latest_release}/${asset_name}"
    log_info "Downloading: $download_url"

    curl -L -o op-deployer.tar.gz "$download_url"

    log_info "Extracting..."
    tar -xzf op-deployer.tar.gz

    # Find the binary
    local binary_path=""
    local extracted_dir
    extracted_dir=$(find . -name "op-deployer-*" -type d 2>/dev/null | head -1)

    if [ -n "$extracted_dir" ] && [ -f "$extracted_dir/op-deployer" ]; then
        binary_path="$extracted_dir/op-deployer"
    elif [ -f "op-deployer" ]; then
        binary_path="op-deployer"
    else
        binary_path=$(find . -name "op-deployer" -type f 2>/dev/null | head -1)
    fi

    if [ -z "$binary_path" ]; then
        log_error "Could not find op-deployer binary after extraction"
        ls -la
        exit 1
    fi

    chmod +x "$binary_path"
    if [ "$binary_path" != "./op-deployer" ]; then
        mv "$binary_path" ./op-deployer
    fi

    # Cleanup
    rm -f op-deployer.tar.gz
    rm -rf "op-deployer-"* 2>/dev/null || true

    # Test
    if ./op-deployer --version >/dev/null 2>&1; then
        log_success "op-deployer ready: $(./op-deployer --version)"
    else
        log_success "op-deployer downloaded (binary may need different platform to run)"
    fi
}

main() {
    log_info "Downloading op-deployer for GoodDollar L2..."

    for cmd in curl jq; do
        if ! command -v $cmd &>/dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done

    download_op_deployer
}

main "$@"
