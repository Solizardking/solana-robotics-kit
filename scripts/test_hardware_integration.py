#!/usr/bin/env python3
"""
Hardware Integration Test for Solana Robotics Kit
Tests CUDA, GPU, ROS 2, and hardware connectivity
"""

import sys
import os
import subprocess
import platform
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def print_result(name, status, details=""):
    """Print test result"""
    icon = "✅" if status else "❌"
    print(f"{icon} {name}")
    if details:
        print(f"   {details}")

def test_system_info():
    """Test 1: System Information"""
    print_header("1. System Information")
    
    system = platform.system()
    machine = platform.machine()
    processor = platform.processor()
    
    print_result("System", True, f"{system} {machine}")
    print_result("Processor", True, processor)
    
    # Check if Jetson
    is_jetson = os.path.exists("/etc/nv_tegra_release")
    if is_jetson:
        with open("/etc/nv_tegra_release", "r") as f:
            tegra_release = f.read().strip()
        print_result("Jetson Device", True, tegra_release)
    else:
        print_result("Jetson Device", False, "Not detected")
    
    return is_jetson

def test_cuda():
    """Test 2: CUDA Availability"""
    print_header("2. CUDA & GPU")
    
    # Check nvidia-smi
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            gpu_info = result.stdout.strip().split("\n")[0]
            print_result("nvidia-smi", True, gpu_info)
        else:
            print_result("nvidia-smi", False, "Command failed")
    except FileNotFoundError:
        print_result("nvidia-smi", False, "Not installed")
    except Exception as e:
        print_result("nvidia-smi", False, str(e))
    
    # Check nvcc
    try:
        result = subprocess.run(
            ["nvcc", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version_line = [l for l in result.stdout.split("\n") if "release" in l.lower()][0]
            print_result("nvcc (CUDA Compiler)", True, version_line.strip())
        else:
            print_result("nvcc", False, "Command failed")
    except FileNotFoundError:
        print_result("nvcc", False, "Not installed")
    except Exception as e:
        print_result("nvcc", False, str(e))
    
    # Check PyTorch CUDA
    try:
        import torch
        if torch.cuda.is_available():
            cuda_version = torch.version.cuda
            gpu_count = torch.cuda.device_count()
            print_result("PyTorch CUDA", True, f"Version {cuda_version}, {gpu_count} GPU(s)")
            
            for i in range(gpu_count):
                props = torch.cuda.get_device_properties(i)
                memory_gb = props.total_memory / (1024**3)
                print(f"   GPU {i}: {props.name} ({memory_gb:.2f} GB)")
        else:
            print_result("PyTorch CUDA", False, "CUDA not available")
    except ImportError:
        print_result("PyTorch", False, "Not installed")
    except Exception as e:
        print_result("PyTorch CUDA", False, str(e))

def test_python_environment():
    """Test 3: Python Environment"""
    print_header("3. Python Environment")
    
    python_version = sys.version.split()[0]
    print_result("Python Version", True, python_version)
    
    # Check virtual environment
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    if in_venv:
        print_result("Virtual Environment", True, sys.prefix)
    else:
        print_result("Virtual Environment", False, "Not in venv (recommended)")
    
    # Check key packages
    packages = {
        "numpy": "NumPy",
        "torch": "PyTorch",
        "cv2": "OpenCV",
        "solana": "Solana",
        "pydantic": "Pydantic",
        "httpx": "HTTPX",
    }
    
    for module, name in packages.items():
        try:
            __import__(module)
            print_result(name, True)
        except ImportError:
            print_result(name, False, "Not installed")

def test_ros2():
    """Test 4: ROS 2"""
    print_header("4. ROS 2")
    
    ros2_path = "/opt/ros/humble/setup.bash"
    if os.path.exists(ros2_path):
        print_result("ROS 2 Humble", True, "Installed")
        
        # Try to check ROS_DOMAIN_ID
        ros_domain = os.environ.get("ROS_DOMAIN_ID", "Not set")
        print_result("ROS_DOMAIN_ID", True, ros_domain)
    else:
        print_result("ROS 2 Humble", False, "Not installed")
    
    # Check if sourced
    try:
        result = subprocess.run(
            ["bash", "-c", "source /opt/ros/humble/setup.bash && ros2 --help"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print_result("ROS 2 CLI", True, "Available")
        else:
            print_result("ROS 2 CLI", False, "Not available")
    except Exception as e:
        print_result("ROS 2 CLI", False, str(e))

def test_solana():
    """Test 5: Solana CLI"""
    print_header("5. Solana Blockchain")
    
    # Check solana CLI
    try:
        result = subprocess.run(
            ["solana", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print_result("Solana CLI", True, version)
        else:
            print_result("Solana CLI", False, "Command failed")
    except FileNotFoundError:
        print_result("Solana CLI", False, "Not installed")
    except Exception as e:
        print_result("Solana CLI", False, str(e))
    
    # Check wallet
    wallet_path = os.path.expanduser("~/.config/solana/robot-key.json")
    if os.path.exists(wallet_path):
        try:
            result = subprocess.run(
                ["solana-keygen", "pubkey", wallet_path],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                pubkey = result.stdout.strip()
                print_result("Robot Wallet", True, pubkey[:20] + "...")
            else:
                print_result("Robot Wallet", False, "Invalid key file")
        except Exception as e:
            print_result("Robot Wallet", False, str(e))
    else:
        print_result("Robot Wallet", False, "Not found")

def test_project_structure():
    """Test 6: Project Structure"""
    print_header("6. Project Structure")
    
    required_dirs = [
        "apps/robot-daemon",
        "packages/perception",
        "packages/planning",
        "packages/solana-client",
        "packages/nim-client",
        "scripts",
        "examples",
    ]
    
    for dir_path in required_dirs:
        full_path = project_root / dir_path
        exists = full_path.exists()
        print_result(f"Directory: {dir_path}", exists)
    
    # Check .env
    env_path = project_root / ".env"
    if env_path.exists():
        print_result(".env file", True, "Found")
    else:
        print_result(".env file", False, "Not found (copy from .env.example)")

def test_cuda_operation():
    """Test 7: CUDA Operation"""
    print_header("7. CUDA Operation Test")
    
    try:
        import torch
        
        if not torch.cuda.is_available():
            print_result("CUDA Operation", False, "CUDA not available")
            return
        
        # Simple matrix multiplication
        device = torch.device("cuda")
        x = torch.randn(1000, 1000, device=device)
        y = torch.randn(1000, 1000, device=device)
        z = torch.matmul(x, y)
        
        # Verify result
        if z.shape == (1000, 1000):
            print_result("Matrix Multiplication", True, f"Result shape: {z.shape}")
            
            # Check memory
            memory_allocated = torch.cuda.memory_allocated() / (1024**2)
            memory_reserved = torch.cuda.memory_reserved() / (1024**2)
            print(f"   GPU Memory: {memory_allocated:.2f} MB allocated, {memory_reserved:.2f} MB reserved")
        else:
            print_result("Matrix Multiplication", False, "Unexpected result shape")
            
    except ImportError:
        print_result("CUDA Operation", False, "PyTorch not installed")
    except Exception as e:
        print_result("CUDA Operation", False, str(e))

def main():
    """Run all tests"""
    print("\n" + "╔" + "═" * 58 + "╗")
    print("║" + " " * 15 + "HARDWARE INTEGRATION TEST" + " " * 19 + "║")
    print("║" + " " * 15 + "Solana Robotics Kit" + " " * 25 + "║")
    print("╚" + "═" * 58 + "╝")
    
    is_jetson = test_system_info()
    test_cuda()
    test_python_environment()
    test_ros2()
    test_solana()
    test_project_structure()
    test_cuda_operation()
    
    print_header("Summary")
    print("\n✅ All critical tests completed!")
    print("\nNext steps:")
    print("1. Fix any failed tests above")
    print("2. Configure .env file with your API keys")
    print("3. Run: python examples/quickstart.py")
    print("4. Start robot daemon: python -m apps.robot_daemon.src.daemon")
    print()

if __name__ == "__main__":
    main()
