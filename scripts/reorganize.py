#!/usr/bin/env python3
"""
Solana Robotics Kit - Architecture Reorganization Script
Safely reorganizes the codebase into a clean, scalable structure
"""

import os
import shutil
import json
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).parent.parent

# Mapping of old paths to new paths
MIGRATION_MAP: Dict[str, str] = {
    # Blockchain
    "programs": "blockchain/programs",
    "packages/solana-client": "blockchain/clients/solana-client",
    "packages/solana_client": "blockchain/clients/solana-client",
    "packages/token_creator": "blockchain/tokens/token-creator",
    "packages/kit-token": "blockchain/tokens/kit-token",
    "packages/robot-passport": "blockchain/passport",
    
    # AI
    "MeloTTS": "ai/voice/melotts",
    "OpenVoice": "ai/voice/openvoice",
    "packages/nim-client": "ai/nvidia/nim-client",
    "nim_integration": "ai/nvidia/integration",
    "packages/perception": "ai/vision/perception",
    "packages/planning": "ai/reasoning/planning",
    
    # Robotics
    "apps/robot-daemon": "robotics/control/daemon",
    "a2a": "robotics/coordination/a2a",
    "avatar_companion": "robotics/avatars/companion",
    
    # Apps
    "apps/operator-console": "apps/console",
    "apps/trading_agent_server": "apps/trading",
    "apps/autonomous_launchpad": "apps/launchpad",
    
    # Web
    "website": "web/robot",
    
    # Tools
    "ralph": "tools/ralph",
    
    # Assets
    "checkpoints": "assets/models/checkpoints/checkpoints",
    "checkpoints_v2 2": "assets/models/checkpoints/checkpoints-v2",
}

# Files to move individually
FILE_MIGRATIONS: List[Tuple[str, str]] = [
    ("QUICK_START.md", "docs/getting-started/QUICK_START.md"),
    ("README_START.md", "docs/getting-started/README_START.md"),
    ("SETUP_GUIDE.md", "docs/getting-started/SETUP_GUIDE.md"),
    ("docs/ARCHITECTURE.md", "docs/architecture/ARCHITECTURE.md"),
    ("docs/SOLANA_ROBOTICS_KIT.md", "docs/architecture/SOLANA_ROBOTICS_KIT.md"),
    ("docs/NVIDIA_NIM_INTEGRATION.md", "docs/guides/NVIDIA_NIM_INTEGRATION.md"),
    ("docs/ORIN_NANO_SETUP.md", "docs/guides/ORIN_NANO_SETUP.md"),
]

def create_structure():
    """Create the new directory structure"""
    directories = [
        "core/config", "core/utils", "core/types", "core/exceptions",
        "blockchain/programs/robot_registry",
        "blockchain/programs/task_marketplace",
        "blockchain/programs/action_log",
        "blockchain/clients",
        "blockchain/tokens",
        "blockchain/passport",
        "ai/voice/openvoice",
        "ai/voice/melotts",
        "ai/vision/cosmos",
        "ai/vision/perception",
        "ai/reasoning/nemotron",
        "ai/reasoning/planning",
        "ai/nvidia",
        "ai/agents",
        "robotics/hardware/jetson",
        "robotics/hardware/sensors",
        "robotics/control/ros2",
        "robotics/coordination/a2a",
        "robotics/avatars/assets",
        "apps/console",
        "apps/daemon",
        "apps/trading",
        "apps/launchpad",
        "apps/desktop",
        "web/console",
        "web/passport",
        "web/robot",
        "tools/cli",
        "tools/scripts",
        "tools/ralph",
        "examples",
        "docs/getting-started",
        "docs/architecture",
        "docs/api",
        "docs/guides",
        "tests/unit",
        "tests/integration",
        "tests/e2e",
        "configs/devnet",
        "configs/mainnet",
        "configs/jetson",
        "assets/models/checkpoints",
        "assets/images",
    ]
    
    for directory in directories:
        (ROOT / directory).mkdir(parents=True, exist_ok=True)
        # Create __init__.py for Python packages
        if not directory.startswith("docs") and not directory.startswith("tests"):
            init_file = ROOT / directory / "__init__.py"
            if not init_file.exists():
                init_file.touch()

def move_directory(src: str, dst: str) -> bool:
    """Safely move a directory"""
    src_path = ROOT / src
    dst_path = ROOT / dst
    
    if not src_path.exists():
        return False
    
    if dst_path.exists():
        print(f"  ⚠️  {dst} already exists, skipping {src}")
        return False
    
    print(f"  📦 {src} → {dst}")
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src_path), str(dst_path))
    return True

def move_file(src: str, dst: str) -> bool:
    """Safely move a file"""
    src_path = ROOT / src
    dst_path = ROOT / dst
    
    if not src_path.exists():
        return False
    
    if dst_path.exists():
        print(f"  ⚠️  {dst} already exists, skipping {src}")
        return False
    
    print(f"  📄 {src} → {dst}")
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src_path), str(dst_path))
    return True

def move_agents():
    """Move agent files to appropriate locations"""
    agents_dir = ROOT / "agents"
    if not agents_dir.exists():
        return
    
    ai_agents_dir = ROOT / "ai" / "agents"
    ai_agents_dir.mkdir(parents=True, exist_ok=True)
    
    for file in agents_dir.glob("*.py"):
        dst = ai_agents_dir / file.name
        if not dst.exists():
            print(f"  📄 agents/{file.name} → ai/agents/{file.name}")
            shutil.move(str(file), str(dst))
    
    # Remove empty agents directory
    try:
        agents_dir.rmdir()
    except OSError:
        pass

def move_scripts():
    """Move scripts to tools/scripts"""
    scripts_dir = ROOT / "scripts"
    tools_scripts_dir = ROOT / "tools" / "scripts"
    tools_scripts_dir.mkdir(parents=True, exist_ok=True)
    
    if scripts_dir.exists():
        for file in scripts_dir.glob("*"):
            if file.is_file() and file.name != "reorganize.py" and file.name != "reorganize.sh":
                dst = tools_scripts_dir / file.name
                if not dst.exists():
                    print(f"  📄 scripts/{file.name} → tools/scripts/{file.name}")
                    shutil.move(str(file), str(dst))

def move_src_files():
    """Move src/ files to appropriate locations"""
    src_dir = ROOT / "src"
    if not src_dir.exists():
        return
    
    for file in src_dir.glob("*.py"):
        filename = file.name
        if "groot" in filename.lower() or "avatar" in filename.lower():
            dst = ROOT / "robotics" / "avatars" / filename
        else:
            dst = ROOT / "examples" / filename
        
        if not dst.exists():
            print(f"  📄 src/{filename} → {dst.relative_to(ROOT)}")
            shutil.move(str(file), str(dst))
    
    # Remove empty src directory
    try:
        src_dir.rmdir()
    except OSError:
        pass

def main():
    print("🏗️  Solana Robotics Kit - Architecture Reorganization")
    print("=" * 60)
    print()
    
    print("📁 Creating new directory structure...")
    create_structure()
    print("✅ Directory structure created")
    print()
    
    print("🔄 Starting file migration...")
    print()
    
    # Move directories
    print("📦 Moving directories...")
    for src, dst in MIGRATION_MAP.items():
        move_directory(src, dst)
    print()
    
    # Move individual files
    print("📄 Moving individual files...")
    for src, dst in FILE_MIGRATIONS:
        move_file(src, dst)
    print()
    
    # Move agents
    print("🤖 Moving AI agents...")
    move_agents()
    print()
    
    # Move scripts
    print("🛠️  Moving scripts...")
    move_scripts()
    print()
    
    # Move src files
    print("📝 Moving src/ files...")
    move_src_files()
    print()
    
    print("✅ Reorganization complete!")
    print()
    print("📝 Next steps:")
    print("  1. Review the new structure")
    print("  2. Update import paths in all files")
    print("  3. Update documentation references")
    print("  4. Test all functionality")
    print("  5. Commit changes")
    print()
    print("⚠️  Note: Some files may need manual review and adjustment.")
    print("   See ARCHITECTURE_PLAN.md for details.")

if __name__ == "__main__":
    main()
