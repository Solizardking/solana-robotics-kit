# NVIDIA NIM Integration for Solana Automation

## Quick Start

### Prerequisites

- NVIDIA GPU (A100, H100, L40S, or RTX 6000 Ada)
- NVIDIA Driver 550+ with CUDA 12.6+
- Docker with NVIDIA Container Toolkit
- 64GB+ System RAM
- 500GB+ Storage for model cache

### Installation

```bash
# 1. Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker

# 2. Verify GPU access
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu22.04 nvidia-smi

# 3. Clone repository
cd /home/user/SolanaAutomation

# 4. Install Python dependencies
pip install -r requirements-nim.txt

# 5. Build NIM containers
cd nim
docker-compose build

# 6. Start NIM services
docker-compose up -d

# 7. Verify services
docker-compose ps
curl http://localhost:8000/health  # Analyst NIM
curl http://localhost:8001/health  # Researcher NIM
curl http://localhost:8002/health  # Trader NIM
curl http://localhost:8003/health  # Risk/Executor NIM
```

### Configuration

Create `.env` file in `nim/` directory:

```env
# API Keys
ANALYST_NIM_API_KEY=your_analyst_key
RESEARCHER_NIM_API_KEY=your_researcher_key
TRADER_NIM_API_KEY=your_trader_key
RISK_EXECUTOR_NIM_API_KEY=your_risk_executor_key

# Model configurations
GEMINI_MODEL_PATH=/models/gemini-2.0-flash
GPT4O_MODEL_PATH=/models/gpt-4o
GROK3_MODEL_PATH=/models/grok-3
CLAUDE_MODEL_PATH=/models/claude-sonnet-4-5

# Performance tuning
MAX_BATCH_SIZE_ANALYST=32
MAX_BATCH_SIZE_RESEARCHER=16
MAX_BATCH_SIZE_TRADER=8
MAX_BATCH_SIZE_RISK=16

# Resource limits
GPU_MEMORY_FRACTION=0.9
ENABLE_MIXED_PRECISION=true
ENABLE_FLASH_ATTENTION=true
```

## Usage Examples

### Python SDK

```python
from nim.nim_client import create_nim_clients, NIMConfig
import os

# Configure NIM services
nim_config = {
    "analyst": NIMConfig(
        service_url="http://localhost:8000",
        api_key=os.getenv("ANALYST_NIM_API_KEY")
    ),
    "researcher": NIMConfig(
        service_url="http://localhost:8001",
        api_key=os.getenv("RESEARCHER_NIM_API_KEY")
    ),
    "trader": NIMConfig(
        service_url="http://localhost:8002",
        api_key=os.getenv("TRADER_NIM_API_KEY")
    ),
    "risk_executor": NIMConfig(
        service_url="http://localhost:8003",
        api_key=os.getenv("RISK_EXECUTOR_NIM_API_KEY")
    )
}

# Create clients
clients = create_nim_clients(nim_config)

# Run market analysis
market_data = {
    "symbol": "SOL/USD",
    "price": 145.32,
    "volume_24h": 3_500_000_000,
    "price_change_24h": 5.2
}

analysis = await clients["analyst"].market_analysis(market_data)
print(f"Market Analysis: {analysis}")

# Run structured debate
debate = await clients["researcher"].structured_debate(
    market_context={"contract": "Fed cuts rates by March"},
    analyst_summaries=analysis,
    rounds=3
)
print(f"Debate Synthesis: {debate['synthesis']}")

# Calculate trade recommendation
trade_rec = await clients["trader"].recommend_trade(
    market_context=market_data,
    analysis_complete=debate
)
print(f"Trade Recommendation: {trade_rec}")

# Risk check with veto authority
risk_check = await clients["risk_executor"].analyze_risk(
    trade_proposal=trade_rec,
    portfolio_state={"exposure": 0.35, "cash": 100000}
)
print(f"Risk Decision: {risk_check['decision']}")
```

### REST API

```bash
# Market Analysis
curl -X POST http://localhost:8000/v1/analyst/market \
  -H "Authorization: Bearer $ANALYST_NIM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "market_data": {
      "symbol": "SOL/USD",
      "price": 145.32,
      "volume_24h": 3500000000
    },
    "agent": "TICKER-01"
  }'

# Structured Debate
curl -X POST http://localhost:8001/v1/researcher/debate \
  -H "Authorization: Bearer $RESEARCHER_NIM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "market_context": {"contract": "Fed cuts by March"},
    "analyst_summaries": {...},
    "rounds": 3
  }'

# Trade Recommendation
curl -X POST http://localhost:8002/v1/trader/recommend \
  -H "Authorization: Bearer $TRADER_NIM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "market_context": {...},
    "analysis_complete": {...}
  }'

# Risk Analysis
curl -X POST http://localhost:8003/v1/risk/analyze \
  -H "Authorization: Bearer $RISK_EXECUTOR_NIM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "trade_proposal": {...},
    "portfolio_state": {...}
  }'
```

## Monitoring

### Access Dashboards

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **DCGM GPU Metrics**: http://localhost:9400/metrics

### Key Metrics

```bash
# GPU utilization
curl http://localhost:9400/metrics | grep DCGM_FI_DEV_GPU_UTIL

# Inference latency
curl http://localhost:9090/api/v1/query?query=nim_inference_latency_seconds

# Request rate
curl http://localhost:9090/api/v1/query?query=rate(nim_requests_total[5m])

# Error rate
curl http://localhost:9090/api/v1/query?query=rate(nim_errors_total[5m])
```

## Performance Optimization

### FP8 Quantization

```python
# Enable FP8 for 2x speedup
export ENABLE_FP8_QUANTIZATION=true
export FP8_E4M3=true
```

### Dynamic Batching

```python
# Increase batch size for higher throughput
export MAX_BATCH_SIZE=64
export BATCH_TIMEOUT_MS=100
```

### Multi-Instance GPU (MIG)

```bash
# Partition A100 into 7 smaller instances
sudo nvidia-smi mig -cgi 19,19,19,19,19,19,19 -C

# Assign MIG instances to containers
docker-compose up --scale analyst-nim=7
```

## Troubleshooting

### GPU Not Detected

```bash
# Check NVIDIA driver
nvidia-smi

# Verify container toolkit
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu22.04 nvidia-smi

# Reinstall toolkit if needed
sudo apt-get install --reinstall nvidia-container-toolkit
```

### Out of Memory

```bash
# Reduce batch size
export MAX_BATCH_SIZE=8

# Enable model quantization
export ENABLE_FP8_QUANTIZATION=true

# Use gradient checkpointing
export USE_GRADIENT_CHECKPOINTING=true
```

### Slow Inference

```bash
# Enable TensorRT optimization
export ENABLE_TENSORRT=true

# Use Flash Attention 2
export USE_FLASH_ATTENTION_2=true

# Increase GPU memory fraction
export GPU_MEMORY_FRACTION=0.95
```

## Development

### Adding Custom Agents

1. Create character file in `characters/`
2. Add agent implementation in `agent/`
3. Update NIM configuration
4. Rebuild container

```bash
docker-compose build <service-name>
docker-compose up -d <service-name>
```

### Fine-Tuning with LoRA

```bash
# Train LoRA adapter for domain specialization
python scripts/train_lora.py \
  --base-model google/gemini-2.0-flash \
  --dataset data/solana-markets.jsonl \
  --output models/gemini-solana-lora \
  --rank 8 \
  --alpha 16 \
  --epochs 3
```

## Deployment

### Kubernetes

```bash
# Deploy to production cluster
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/complete-stack.yaml

# Verify deployment
kubectl get pods -n solana-automation
kubectl get services -n solana-automation

# Scale services
kubectl scale deployment analyst-nim --replicas=4 -n solana-automation
```

### Cloud Deployment

#### AWS (EKS with EC2 G5/P4 instances)

```bash
eksctl create cluster \
  --name solana-nim-cluster \
  --region us-east-1 \
  --nodegroup-name gpu-nodes \
  --node-type g5.2xlarge \
  --nodes 4 \
  --nodes-min 2 \
  --nodes-max 8
```

#### GCP (GKE with A100/H100)

```bash
gcloud container clusters create solana-nim-cluster \
  --accelerator type=nvidia-tesla-a100,count=1 \
  --zone us-central1-a \
  --num-nodes 4 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 8
```

## Support

- Documentation: `/docs/NVIDIA_NIM_INTEGRATION.md`
- Issues: https://github.com/8bitsats/SolanaAutomation/issues
- NVIDIA NIM Docs: https://docs.nvidia.com/nim

---

**Powered by NVIDIA NIM**
**Optimized for Solana Automation**
