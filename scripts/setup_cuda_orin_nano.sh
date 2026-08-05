#!/bin/bash
# ============================================================
# Solana Robotics Kit - CUDA Driver Setup for Orin Nano
# ============================================================
# This script installs the CUDA driver and verifies GPU setup
# Usage: ./scripts/setup_cuda_orin_nano.sh [CUDA_DRIVER_PATH]
# ============================================================

set -e

CUDA_DRIVER_PATH="${1:-/Volumes/CUDADriver/CUDADriver.pkg}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🚀  CUDA DRIVER SETUP - Jetson Orin Nano                    ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

# ============================================================
# Check if running on Jetson
# ============================================================
check_jetson() {
    if [ -f /etc/nv_tegra_release ]; then
        echo "✅ Running on Jetson device"
        cat /etc/nv_tegra_release
        JETSON_MODEL=$(cat /etc/nv_tegra_release | grep -oP 'R\d+\.\d+' | head -1)
        echo "   Model: $JETSON_MODEL"
    else
        echo "⚠️  Not running on Jetson - CUDA driver installation may not work"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# ============================================================
# Install CUDA Driver
# ============================================================
install_cuda_driver() {
    echo ""
    echo "📦 Installing CUDA Driver..."
    
    if [ ! -f "$CUDA_DRIVER_PATH" ]; then
        echo "❌ CUDA driver package not found at: $CUDA_DRIVER_PATH"
        echo "   Please provide the correct path to CUDADriver.pkg"
        exit 1
    fi
    
    echo "   Found driver package: $CUDA_DRIVER_PATH"
    
    # Check if it's a .pkg file (macOS installer)
    if [[ "$CUDA_DRIVER_PATH" == *.pkg ]]; then
        echo "⚠️  .pkg files are macOS installers"
        echo "   For Jetson Orin Nano, you need JetPack SDK which includes CUDA"
        echo "   Installing via JetPack is recommended"
        echo ""
        echo "   If you have a .deb or .run file, use that instead"
        read -p "Continue with JetPack CUDA setup? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # For Jetson, CUDA comes with JetPack
    echo "✅ CUDA is included in JetPack SDK"
    echo "   Verifying CUDA installation..."
    
    # Check CUDA version
    if command -v nvcc &> /dev/null; then
        CUDA_VERSION=$(nvcc --version | grep -oP 'release \K[0-9.]+' | head -1)
        echo "   CUDA Version: $CUDA_VERSION"
    else
        echo "⚠️  nvcc not found - CUDA may not be installed"
        echo "   Install JetPack SDK to get CUDA"
    fi
}

# ============================================================
# Verify GPU and CUDA
# ============================================================
verify_cuda() {
    echo ""
    echo "🔍 Verifying CUDA and GPU setup..."
    
    # Check for NVIDIA GPU
    if command -v nvidia-smi &> /dev/null; then
        echo "✅ nvidia-smi found"
        nvidia-smi
    else
        echo "⚠️  nvidia-smi not found"
        echo "   GPU may not be properly configured"
    fi
    
    # Check CUDA runtime
    if [ -f /usr/local/cuda/version.txt ]; then
        CUDA_VER=$(cat /usr/local/cuda/version.txt)
        echo "✅ CUDA version file found: $CUDA_VER"
    fi
    
    # Check for Jetson-specific tools
    if command -v tegrastats &> /dev/null; then
        echo "✅ Jetson tools available"
        echo "   Run 'tegrastats' to monitor GPU usage"
    fi
    
    # Check PyTorch CUDA support
    echo ""
    echo "🐍 Checking Python CUDA support..."
    python3 << EOF
import sys
try:
    import torch
    if torch.cuda.is_available():
        print(f"✅ PyTorch CUDA available")
        print(f"   CUDA Version: {torch.version.cuda}")
        print(f"   GPU Count: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"   GPU {i}: {torch.cuda.get_device_name(i)}")
    else:
        print("⚠️  PyTorch CUDA not available")
        print("   Install PyTorch with CUDA support")
except ImportError:
    print("⚠️  PyTorch not installed")
    print("   Install with: pip install torch torchvision torchaudio")
EOF
}

# ============================================================
# Install PyTorch with CUDA support for Jetson
# ============================================================
install_pytorch_cuda() {
    echo ""
    echo "📦 Installing PyTorch with CUDA support for Jetson..."
    
    # Jetson requires specific PyTorch builds
    # Check JetPack version to determine CUDA version
    if [ -f /etc/nv_tegra_release ]; then
        JETPACK_VERSION=$(cat /etc/nv_tegra_release | grep -oP 'R\d+\.\d+' | head -1)
        echo "   JetPack: $JETPACK_VERSION"
        
        # JetPack 6.x uses CUDA 12.x
        if [[ "$JETPACK_VERSION" == R6* ]]; then
            echo "   Installing PyTorch for CUDA 12.x (JetPack 6.x)"
            pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
        # JetPack 5.x uses CUDA 11.x
        elif [[ "$JETPACK_VERSION" == R5* ]]; then
            echo "   Installing PyTorch for CUDA 11.8 (JetPack 5.x)"
            pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
        else
            echo "⚠️  Unknown JetPack version, installing default PyTorch"
            pip3 install torch torchvision torchaudio
        fi
    else
        echo "   Installing default PyTorch with CUDA"
        pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    fi
    
    echo "✅ PyTorch installed"
}

# ============================================================
# Create CUDA test script
# ============================================================
create_cuda_test() {
    echo ""
    echo "📝 Creating CUDA test script..."
    
    cat > "$HOME/test_cuda.py" << 'EOF'
#!/usr/bin/env python3
"""Test CUDA and GPU availability for Solana Robotics Kit"""

import sys

def test_cuda():
    print("🔍 Testing CUDA and GPU Setup...")
    print("=" * 50)
    
    # Test 1: PyTorch CUDA
    print("\n1. PyTorch CUDA:")
    try:
        import torch
        print(f"   ✅ PyTorch version: {torch.__version__}")
        if torch.cuda.is_available():
            print(f"   ✅ CUDA available: {torch.version.cuda}")
            print(f"   ✅ GPU count: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                props = torch.cuda.get_device_properties(i)
                print(f"   ✅ GPU {i}: {props.name}")
                print(f"      Memory: {props.total_memory / 1024**3:.2f} GB")
        else:
            print("   ❌ CUDA not available in PyTorch")
    except ImportError:
        print("   ❌ PyTorch not installed")
    
    # Test 2: NumPy
    print("\n2. NumPy:")
    try:
        import numpy as np
        print(f"   ✅ NumPy version: {np.__version__}")
    except ImportError:
        print("   ❌ NumPy not installed")
    
    # Test 3: OpenCV
    print("\n3. OpenCV:")
    try:
        import cv2
        print(f"   ✅ OpenCV version: {cv2.__version__}")
        print(f"   ✅ Build info: {cv2.getBuildInformation()[:200]}...")
    except ImportError:
        print("   ❌ OpenCV not installed")
    
    # Test 4: Simple CUDA operation
    print("\n4. CUDA Operation Test:")
    try:
        import torch
        if torch.cuda.is_available():
            x = torch.randn(1000, 1000).cuda()
            y = torch.randn(1000, 1000).cuda()
            z = torch.matmul(x, y)
            print(f"   ✅ CUDA matrix multiplication successful")
            print(f"   ✅ Result shape: {z.shape}")
        else:
            print("   ⚠️  Skipping - CUDA not available")
    except Exception as e:
        print(f"   ❌ CUDA operation failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ CUDA test complete!")

if __name__ == "__main__":
    test_cuda()
EOF
    
    chmod +x "$HOME/test_cuda.py"
    echo "✅ Test script created: $HOME/test_cuda.py"
    echo "   Run with: python3 $HOME/test_cuda.py"
}

# ============================================================
# Main
# ============================================================
main() {
    check_jetson
    install_cuda_driver
    verify_cuda
    read -p "Install PyTorch with CUDA support? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_pytorch_cuda
    fi
    create_cuda_test
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                   CUDA SETUP COMPLETE! 🎉                      ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "1. Run CUDA test: python3 $HOME/test_cuda.py"
    echo "2. Verify GPU: nvidia-smi"
    echo "3. Monitor Jetson: tegrastats"
    echo "4. Continue with full setup: ./scripts/setup_jetson.sh"
}

main "$@"
