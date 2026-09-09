#!/usr/bin/env python3
"""
Comprehensive test script for all Python files in SolanaAutomation
Tests each file's basic functionality and reports status
"""

import os
import sys
import subprocess
import importlib.util
from pathlib import Path
from typing import Dict, List, Tuple

# Color output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.CYAN}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*70}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

def test_file_syntax(filepath: Path) -> Tuple[bool, str]:
    """Test if Python file has valid syntax"""
    try:
        with open(filepath, 'r') as f:
            compile(f.read(), filepath, 'exec')
        return True, "Syntax valid"
    except SyntaxError as e:
        return False, f"Syntax error: {e}"
    except Exception as e:
        return False, f"Error: {e}"

def test_file_imports(filepath: Path) -> Tuple[bool, List[str]]:
    """Test if file can be imported (checks dependencies)"""
    missing_deps = []
    try:
        spec = importlib.util.spec_from_file_location("test_module", filepath)
        if spec and spec.loader:
            # Try to load the module
            module = importlib.util.module_from_spec(spec)
            # Check for common imports
            with open(filepath, 'r') as f:
                content = f.read()
                
            # Check for common dependencies
            deps_to_check = {
                'fastapi': 'fastapi',
                'uvicorn': 'uvicorn',
                'dotenv': 'python-dotenv',
                'solders': 'solders',
                'solana': 'solana',
                'e2b': 'e2b',
                'webview': 'pywebview',
                'pandas': 'pandas',
                'numpy': 'numpy',
                'aiosqlite': 'aiosqlite',
            }
            
            for dep_name, package_name in deps_to_check.items():
                if f'import {dep_name}' in content or f'from {dep_name}' in content:
                    try:
                        __import__(dep_name)
                    except ImportError:
                        missing_deps.append(package_name)
            
            return len(missing_deps) == 0, missing_deps
    except Exception as e:
        return False, [str(e)]
    
    return True, []

def test_executable_script(filepath: Path) -> Tuple[bool, str]:
    """Test if script can be executed (for CLI scripts)"""
    try:
        result = subprocess.run(
            [sys.executable, str(filepath), '--help'],
            capture_output=True,
            text=True,
            timeout=5
        )
        # If it exits with 0 or 1 (help), it's executable
        if result.returncode in [0, 1, 2]:
            return True, "Executable"
        return False, f"Exit code: {result.returncode}"
    except subprocess.TimeoutExpired:
        return False, "Timeout (script may hang)"
    except Exception as e:
        # Some scripts don't have --help, that's OK
        return True, "No --help flag (normal)"

def analyze_file(filepath: Path) -> Dict:
    """Analyze a single file"""
    analysis = {
        'file': filepath.name,
        'path': str(filepath),
        'exists': filepath.exists(),
        'size': filepath.stat().st_size if filepath.exists() else 0,
        'syntax_ok': False,
        'imports_ok': False,
        'executable': False,
        'missing_deps': [],
        'issues': []
    }
    
    if not filepath.exists():
        analysis['issues'].append("File does not exist")
        return analysis
    
    # Test syntax
    syntax_ok, syntax_msg = test_file_syntax(filepath)
    analysis['syntax_ok'] = syntax_ok
    if not syntax_ok:
        analysis['issues'].append(syntax_msg)
    
    # Test imports
    imports_ok, missing_deps = test_file_imports(filepath)
    analysis['imports_ok'] = imports_ok
    analysis['missing_deps'] = missing_deps
    
    # Test if executable (for scripts with if __name__ == "__main__")
    with open(filepath, 'r') as f:
        content = f.read()
        if '__main__' in content:
            exec_ok, exec_msg = test_executable_script(filepath)
            analysis['executable'] = exec_ok
    
    return analysis

def main():
    """Main test function"""
    print_header("SOLANA AUTOMATION - FILE ANALYSIS & TESTING")
    
    # Files to test
    files_to_test = [
        "startup_and_utils.py",
        "test_run.py",
        "solana_trading_desktop.py",
        "quickstart_e2b.py",
        "performance_monitor.py",
        "main.py",
        "instructions.py",
        "my_agent.py",
        "generate_wallet.py",
        "generate_jwt_secret.py",
        "examples.py",
        "browser_frontend.py",
        "a2a_service.py",
    ]
    
    project_root = Path(__file__).parent
    results = []
    
    print_info(f"Testing {len(files_to_test)} files in {project_root}\n")
    
    for filename in files_to_test:
        filepath = project_root / filename
        print(f"\n{Colors.BOLD}Testing: {filename}{Colors.RESET}")
        print("-" * 70)
        
        analysis = analyze_file(filepath)
        results.append(analysis)
        
        if not analysis['exists']:
            print_error(f"File not found: {filename}")
            continue
        
        # Report results
        if analysis['syntax_ok']:
            print_success("Syntax: Valid")
        else:
            print_error(f"Syntax: {analysis['issues'][0] if analysis['issues'] else 'Unknown error'}")
        
        if analysis['imports_ok']:
            print_success("Dependencies: All available")
        else:
            if analysis['missing_deps']:
                print_warning(f"Missing dependencies: {', '.join(analysis['missing_deps'])}")
            else:
                print_warning("Import check failed")
        
        if analysis['executable']:
            print_success("Executable: Yes")
        elif '__main__' in open(filepath).read():
            print_info("Executable: Has main block (not tested)")
        
        print_info(f"Size: {analysis['size']:,} bytes")
    
    # Summary
    print_header("TEST SUMMARY")
    
    total = len(results)
    exists = sum(1 for r in results if r['exists'])
    syntax_ok = sum(1 for r in results if r['exists'] and r['syntax_ok'])
    imports_ok = sum(1 for r in results if r['exists'] and r['imports_ok'])
    
    print(f"\n{Colors.BOLD}Overall Statistics:{Colors.RESET}")
    print(f"  Total files: {total}")
    print(f"  Files found: {exists} ({exists/total*100:.1f}%)")
    print(f"  Valid syntax: {syntax_ok}/{exists} ({syntax_ok/exists*100:.1f}% of existing)" if exists > 0 else "  Valid syntax: N/A")
    print(f"  Dependencies OK: {imports_ok}/{exists} ({imports_ok/exists*100:.1f}% of existing)" if exists > 0 else "  Dependencies OK: N/A")
    
    # Files with issues
    files_with_issues = [r for r in results if r['exists'] and (not r['syntax_ok'] or r['issues'])]
    if files_with_issues:
        print(f"\n{Colors.YELLOW}Files with issues:{Colors.RESET}")
        for result in files_with_issues:
            print(f"  • {result['file']}: {', '.join(result['issues'])}")
    
    # Missing dependencies summary
    all_missing = set()
    for r in results:
        all_missing.update(r['missing_deps'])
    
    if all_missing:
        print(f"\n{Colors.YELLOW}Missing dependencies (install with: pip install {' '.join(all_missing)}):{Colors.RESET}")
        for dep in sorted(all_missing):
            print(f"  • {dep}")
    
    # Recommendations
    print_header("RECOMMENDATIONS")
    
    print_info("Files ready to use:")
    ready_files = [r for r in results if r['exists'] and r['syntax_ok'] and r['imports_ok']]
    for r in ready_files:
        print(f"  ✅ {r['file']}")
    
    print_info("\nFiles needing attention:")
    needs_attention = [r for r in results if r['exists'] and (not r['syntax_ok'] or not r['imports_ok'])]
    for r in needs_attention:
        print(f"  ⚠️  {r['file']}: {', '.join(r['issues']) if r['issues'] else 'Missing dependencies'}")
    
    print_info("\nFiles not found:")
    not_found = [r for r in results if not r['exists']]
    for r in not_found:
        print(f"  ❌ {r['file']}")
    
    print(f"\n{Colors.GREEN}Testing complete!{Colors.RESET}\n")

if __name__ == "__main__":
    main()
