# main.py - FastAPI Application Entry Point
"""
Main FastAPI application for Solana-Automation platform.
Provides RESTful API endpoints for agent orchestration, browser automation,
blockchain operations, and payment management.
"""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import api_router
from config.settings import (
    CORS_ORIGINS,
    DEBUG,
    ENVIRONMENT,
    HOST,
    PORT,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting up Solana-Automation API server...")
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"Debug mode: {DEBUG}")
    
    # TODO: Initialize database connections if needed
    # await initialize_db()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Solana-Automation API server...")
    # TODO: Cleanup database connections if needed
    # await shutdown_db()


# Create FastAPI application
app = FastAPI(
    title="Solana-Automation API",
    description="Multi-agent AI platform for Solana blockchain operations",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint providing API information."""
    return {
        "name": "Solana-Automation API",
        "version": "1.0.0",
        "status": "online",
        "environment": ENVIRONMENT,
        "docs": "/docs",
        "health": "/health",
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "environment": ENVIRONMENT}


# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info" if not DEBUG else "debug",
    )

