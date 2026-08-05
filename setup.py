#!/usr/bin/env python3
"""
Solana Robotics Kit - Setup Configuration
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_path = Path(__file__).parent / "README.md"
long_description = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""

# Read requirements
requirements_path = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_path.exists():
    with open(requirements_path) as f:
        requirements = [
            line.strip() 
            for line in f 
            if line.strip() and not line.startswith("#")
        ]

setup(
    name="solana-robotics-kit",
    version="1.0.0",
    author="8bit & @0rdlibrary",
    author_email="contact@solana-robotics.io",
    description="Autonomous AI Robots Powered by NVIDIA GR00T & Solana Blockchain",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/8bitsats/solana-robotics-kit",
    project_urls={
        "Bug Tracker": "https://github.com/8bitsats/solana-robotics-kit/issues",
        "Documentation": "https://github.com/8bitsats/solana-robotics-kit/tree/main/docs",
        "Source Code": "https://github.com/8bitsats/solana-robotics-kit",
    },
    packages=find_packages(exclude=["tests", "tests.*", "examples"]),
    package_dir={
        "solana_robotics_kit": "src",
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Robotics",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    keywords=[
        "solana",
        "robotics",
        "nvidia",
        "groot",
        "ai",
        "blockchain",
        "trading",
        "autonomous",
        "jetson",
        "cosmos",
        "nemotron",
    ],
    python_requires=">=3.10",
    install_requires=[
        "python-dotenv>=1.0.0",
        "pydantic>=2.0.0",
        "httpx>=0.25.0",
        "aiohttp>=3.9.0",
        "solana>=0.30.0",
        "solders>=0.18.0",
        "openai>=1.6.0",
        "numpy>=1.24.0",
        "pillow>=10.0.0",
        "fastapi>=0.104.0",
        "uvicorn>=0.24.0",
        "websockets>=12.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.11.0",
            "ruff>=0.1.6",
            "mypy>=1.7.0",
        ],
        "voice": [
            "livekit>=0.8.0",
            "sounddevice>=0.4.6",
            "soundfile>=0.12.1",
        ],
        "vision": [
            "opencv-python>=4.8.0",
            "torch>=2.0.0",
            "torchvision>=0.15.0",
        ],
        "trading": [
            "ccxt>=4.1.0",
            "pandas>=2.1.0",
            "ta>=0.10.2",
        ],
        "full": [
            # All extras combined
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.11.0",
            "ruff>=0.1.6",
            "livekit>=0.8.0",
            "sounddevice>=0.4.6",
            "opencv-python>=4.8.0",
            "torch>=2.0.0",
            "ccxt>=4.1.0",
            "pandas>=2.1.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "solana-robot=src.quickstart_groot:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
