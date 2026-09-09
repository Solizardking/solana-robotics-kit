FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV CUDA_HOME=/usr/local/cuda

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    git \
    curl \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements
COPY requirements-cosmos.txt /app/
COPY requirements.txt /app/

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements-cosmos.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY cosmos/ /app/cosmos/
COPY config/ /app/config/
COPY utils/ /app/utils/

# Create directories
RUN mkdir -p /app/logs /app/data /app/config

# Set Python path
ENV PYTHONPATH=/app:$PYTHONPATH

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python3 -c "import sys; sys.exit(0)"

# Run the trading agent
CMD ["python3", "-m", "cosmos.integration.solana_cosmos_agent"]
