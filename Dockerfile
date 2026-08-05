# Solana Robotics Kit - Production Dockerfile
# Multi-stage build for optimal image size

# ============================================
# Stage 1: Python Builder
# ============================================
FROM python:3.11-slim as python-builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt pyproject.toml setup.py ./
COPY packages/ ./packages/
COPY src/ ./src/
COPY apps/ ./apps/

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip wheel && \
    pip install -e . --no-cache-dir

# ============================================
# Stage 2: Node.js Builder
# ============================================
FROM node:18-slim as node-builder

WORKDIR /build

# Copy operator console
COPY solana-robotics-kit-v0.4/apps/operator_console ./operator_console

WORKDIR /build/operator_console

# Install dependencies and build
RUN npm ci && npm run build || echo "Build step optional"

# ============================================
# Stage 3: Production Image
# ============================================
FROM python:3.11-slim as production

LABEL org.opencontainers.image.title="Solana Robotics Kit"
LABEL org.opencontainers.image.description="Autonomous robots powered by NVIDIA + Solana"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Solana Robotics"
LABEL org.opencontainers.image.source="https://github.com/8bitsats/Solana-Robotics-Kit"
LABEL org.opencontainers.image.licenses="MIT"

# Create non-root user
RUN groupadd --gid 1000 robot && \
    useradd --uid 1000 --gid robot --shell /bin/bash --create-home robot

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for operator console
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Python virtual environment from builder
COPY --from=python-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
WORKDIR /app
COPY --chown=robot:robot . .

# Copy built operator console
COPY --from=node-builder /build/operator_console/.next ./solana-robotics-kit-v0.4/apps/operator_console/.next 2>/dev/null || true
COPY --from=node-builder /build/operator_console/node_modules ./solana-robotics-kit-v0.4/apps/operator_console/node_modules 2>/dev/null || true

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV SOLANA_RPC_URL=https://api.devnet.solana.com

# Switch to non-root user
USER robot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 3000 8000 8080

# Default command
CMD ["python", "-m", "apps.robot_daemon.main", "--help"]

# ============================================
# Stage 4: Development Image
# ============================================
FROM production as development

USER root

# Install development dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)" && \
    echo 'export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"' >> /etc/bash.bashrc

# Install dev Python packages
RUN pip install pytest pytest-asyncio black ruff mypy

USER robot

CMD ["/bin/bash"]

# ============================================
# Stage 5: Jetson Image (NVIDIA)
# ============================================
FROM nvcr.io/nvidia/l4t-pytorch:r35.2.1-pth2.0-py3 as jetson

LABEL org.opencontainers.image.title="Solana Robotics Kit - Jetson"
LABEL org.opencontainers.image.description="NVIDIA Jetson optimized build"

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --upgrade pip && \
    pip3 install -r requirements.txt

# Copy application
COPY . .

ENV PYTHONPATH=/app
ENV SOLANA_RPC_URL=https://api.devnet.solana.com

# Expose ports
EXPOSE 3000 8000 8080

CMD ["python3", "-m", "apps.robot_daemon.main", "--task-runner"]
