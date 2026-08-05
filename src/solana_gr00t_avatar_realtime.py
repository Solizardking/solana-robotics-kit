#!/usr/bin/env python3
"""
Solana GR00T Realtime Avatar with Deepgram STT + HeyGen Avatar + LiveKit
Real-time conversational AI avatar with WebRTC streaming
"""

import os
import json
import asyncio
import queue
import threading
import logging
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# FastAPI and WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Deepgram WebSocket client
try:
    import websocket as ws_client
    WEBSOCKET_CLIENT_AVAILABLE = True
except ImportError:
    WEBSOCKET_CLIENT_AVAILABLE = False
    logger.warning("websocket-client not available. Install with: pip install websocket-client")

# Environment variables
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
HEYGEN_SERVER_URL = os.getenv("HEYGEN_SERVER_URL", "https://api.heygen.com")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://localhost:7880")

from .config import (
    CLAWD_TOKEN_MINT,
    CLAWD_TOKEN_SYMBOL,
    clawd_system_prompt,
    resolve_avatar_assets_dir,
)

# HeyGen Knowledge Base Configuration
KB_NAME = "Solana GR00T Trading Assistant"
KB_OPENING = (
    f"Hello! I'm GR00T, your Solana trading assistant powered by {CLAWD_TOKEN_SYMBOL}. "
    "How can I help you today?"
)
KB_PROMPT = clawd_system_prompt()

# Headers for HeyGen API
HEADERS_HEYGEN = {
    "X-Api-Key": HEYGEN_API_KEY,
    "Content-Type": "application/json"
}

# Global knowledge base ID cache
_KB_ID: Optional[str] = None

# Initialize FastAPI app
app = FastAPI(title="Solana GR00T Realtime Avatar", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RealtimeAvatar:
    """
    Thin wrapper so `from src import RealtimeAvatar` works.

    The FastAPI app is the primary surface; this class exposes start/config helpers.
    """

    def __init__(self, port: Optional[int] = None):
        self.port = int(port or os.getenv("AVATAR_PORT", "5002"))
        self.app = app
        self.clawd_mint = CLAWD_TOKEN_MINT
        self.clawd_symbol = CLAWD_TOKEN_SYMBOL

    def start(self, host: str = "0.0.0.0") -> None:
        import uvicorn

        logger.info(f"🚀 Starting Solana GR00T Realtime Avatar on {host}:{self.port}")
        logger.info(f"   $CLAWD mint: {self.clawd_mint}")
        uvicorn.run(self.app, host=host, port=self.port)


@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": "solana-gr00t-avatar-realtime",
        "clawd_mint": CLAWD_TOKEN_MINT,
        "symbol": CLAWD_TOKEN_SYMBOL,
        "deepgram": bool(DEEPGRAM_API_KEY),
        "heygen": bool(HEYGEN_API_KEY),
    }


# Validate required environment variables
if not DEEPGRAM_API_KEY:
    logger.warning("⚠️  DEEPGRAM_API_KEY not set - speech-to-text will not work")
if not HEYGEN_API_KEY:
    logger.warning("⚠️  HEYGEN_API_KEY not set - avatar generation will not work")
if not all([DEEPGRAM_API_KEY, HEYGEN_API_KEY]):
    logger.error("❌ Missing required API keys. Please set DEEPGRAM_API_KEY and HEYGEN_API_KEY in .env file")


def float_to_16bit_pcm(float32_array):
    """Convert float32 audio array to 16-bit PCM"""
    import numpy as np
    int16_max = 32767
    int16_min = -32768
    pcm = np.clip(float32_array * int16_max, int16_min, int16_max).astype(np.int16)
    return pcm.tobytes()


async def ensure_kb_id() -> str:
    """Ensure HeyGen knowledge base exists and return its ID"""
    global _KB_ID
    
    if _KB_ID:
        return _KB_ID
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # List existing knowledge bases
        try:
            list_resp = await client.get(
                f"{HEYGEN_SERVER_URL}/v1/streaming/knowledge_base/list",
                headers=HEADERS_HEYGEN,
            )
            list_resp.raise_for_status()
            
            kb_list = list_resp.json().get("data", [])
            for kb in kb_list:
                if kb.get("name") == KB_NAME:
                    _KB_ID = kb["id"]
                    logger.info(f"Found existing knowledge base: {_KB_ID}")
                    return _KB_ID
            
            # Create new knowledge base
            logger.info(f"Creating new knowledge base: {KB_NAME}")
            create_resp = await client.post(
                f"{HEYGEN_SERVER_URL}/v1/streaming/knowledge_base/create",
                headers=HEADERS_HEYGEN,
                json={
                    "name": KB_NAME,
                    "opening": KB_OPENING,
                    "prompt": KB_PROMPT
                },
            )
            create_resp.raise_for_status()
            _KB_ID = create_resp.json()["data"]["id"]
            logger.info(f"Created knowledge base: {_KB_ID}")
            return _KB_ID
            
        except Exception as e:
            logger.error(f"Error managing knowledge base: {e}")
            raise


@app.get("/")
async def root():
    """Root endpoint - serve HTML client"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Solana GR00T Realtime Avatar</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
        <style>
            body { background: #0a0a0a; color: #14F195; font-family: 'Inter', sans-serif; }
            .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
            .avatar-video { width: 100%; max-width: 800px; border-radius: 12px; border: 2px solid #14F195; }
            .status { padding: 1rem; background: rgba(20, 241, 149, 0.1); border-radius: 8px; margin: 1rem 0; }
            button { background: linear-gradient(135deg, #14F195, #9945FF); padding: 0.75rem 1.5rem; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; }
            button:hover { opacity: 0.9; }
            button:disabled { opacity: 0.5; cursor: not-allowed; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="text-4xl font-bold mb-4">🌱 Solana GR00T Realtime Avatar</h1>
            <div id="status" class="status">Initializing...</div>
            <video id="mediaElement" class="avatar-video" autoplay playsinline></video>
            <div class="mt-4">
                <button id="startBtn" onclick="startSession()">Start Session</button>
                <button id="stopBtn" onclick="stopSession()" disabled>Stop Session</button>
            </div>
        </div>
        <script src="/static/client.js"></script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.post("/api/get_token")
async def get_token():
    """Get HeyGen session token"""
    if not HEYGEN_API_KEY:
        raise HTTPException(status_code=500, detail="HEYGEN_API_KEY not configured")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.post(
                f"{HEYGEN_SERVER_URL}/v1/streaming.create_token",
                headers=HEADERS_HEYGEN
            )
            r.raise_for_status()
            return JSONResponse(r.json())
        except Exception as e:
            logger.error(f"Error getting token: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/new_session")
async def new_session(payload: dict):
    """Create new HeyGen avatar session"""
    session_token = payload.get("session_token")
    if not session_token:
        raise HTTPException(status_code=400, detail="Missing session_token")
    
    kb_id = await ensure_kb_id()
    
    body = {
        "version": "v2",
        "avatar_id": payload.get("avatar_id", "default"),
        "knowledge_base_id": kb_id,
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.post(
                f"{HEYGEN_SERVER_URL}/v1/streaming.new",
                headers={"Authorization": f"Bearer {session_token}"},
                json=body,
            )
            r.raise_for_status()
            return JSONResponse(r.json())
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/speech")
async def ws_speech(websocket: WebSocket):
    """WebSocket endpoint for real-time speech processing"""
    await websocket.accept()
    
    params = websocket.query_params
    session_token = params.get("session_token")
    session_id = params.get("session_id")
    
    if not session_token or not session_id:
        await websocket.close(code=4001, reason="Missing session_token or session_id")
        return
    
    if not DEEPGRAM_API_KEY:
        await websocket.close(code=4002, reason="DEEPGRAM_API_KEY not configured")
        return
    
    send_queue = queue.Queue(maxsize=1000)
    stop_flag = threading.Event()
    full_transcript = ""
    loop = asyncio.get_event_loop()
    dg_ws = None
    
    def dg_on_open(ws):
        """Deepgram WebSocket opened"""
        logger.info("Deepgram WebSocket connected")
        nonlocal dg_ws
        dg_ws = ws
        
        def pump_audio():
            """Pump audio data to Deepgram"""
            while not stop_flag.is_set():
                try:
                    data = send_queue.get(timeout=0.1)
                    if data is None:
                        break
                    ws.send(data, opcode=ws_client.ABNF.OPCODE_BINARY)
                except queue.Empty:
                    continue
                except Exception as e:
                    logger.error(f"Error sending audio to Deepgram: {e}")
                    break
        
        threading.Thread(target=pump_audio, daemon=True).start()
    
    def dg_on_message(ws, message):
        """Handle Deepgram transcription response"""
        nonlocal full_transcript
        try:
            data = json.loads(message)
            transcript = data.get("channel", {}).get("alternatives", [{}])[0].get("transcript", "")
            
            if transcript:
                asyncio.run_coroutine_threadsafe(
                    websocket.send_json({"type": "partial_transcript", "text": transcript}),
                    loop
                )
                full_transcript += transcript + " "
            
            if data.get("is_final"):
                final_text = full_transcript.strip()
                full_transcript = ""
                
                async def handle_final():
                    """Handle final transcript and send to HeyGen"""
                    try:
                        await websocket.send_json({"type": "final_transcript", "text": final_text})
                        logger.info(f"Final transcript: {final_text}")
                        
                        # Send to HeyGen
                        async with httpx.AsyncClient(timeout=300.0) as client:
                            r = await client.post(
                                f"{HEYGEN_SERVER_URL}/v1/streaming.task",
                                headers={"Authorization": f"Bearer {session_token}"},
                                json={
                                    "session_id": session_id,
                                    "text": final_text,
                                    "task_type": "chat"
                                },
                            )
                            r.raise_for_status()
                            response_data = r.json()
                            await websocket.send_json({"type": "heygen_response", "data": response_data})
                            logger.info("HeyGen response received")
                    except Exception as e:
                        logger.error(f"Error handling final transcript: {e}")
                        await websocket.send_json({"type": "error", "error": str(e)})
                
                asyncio.run_coroutine_threadsafe(handle_final(), loop)
                
        except Exception as e:
            logger.error(f"Error processing Deepgram message: {e}")
    
    def dg_on_error(ws, error):
        """Handle Deepgram WebSocket errors"""
        logger.error(f"Deepgram WebSocket error: {error}")
    
    def dg_on_close(ws, close_status_code, close_msg):
        """Handle Deepgram WebSocket close"""
        logger.info("Deepgram WebSocket closed")
        stop_flag.set()
    
    # Connect to Deepgram
    if not WEBSOCKET_CLIENT_AVAILABLE:
        await websocket.close(code=4003, reason="websocket-client not available")
        return
    
    dg_url = f"wss://api.deepgram.com/v1/listen?model=nova-2&language=en&punctuate=true&interim_results=true"
    dg_headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}"
    }
    
    try:
        dg_ws = ws_client.WebSocketApp(
            dg_url,
            header=dg_headers,
            on_open=dg_on_open,
            on_message=dg_on_message,
            on_error=dg_on_error,
            on_close=dg_on_close
        )
        
        # Run Deepgram WebSocket in background thread
        def run_dg_ws():
            dg_ws.run_forever()
        
        dg_thread = threading.Thread(target=run_dg_ws, daemon=True)
        dg_thread.start()
        
        # Wait for Deepgram connection
        await asyncio.sleep(1)
        
        # Handle incoming audio from browser
        try:
            while True:
                data = await websocket.receive_bytes()
                
                if stop_flag.is_set():
                    break
                
                # Convert to 16-bit PCM if needed
                try:
                    import numpy as np
                    # Assume incoming data is float32, convert to int16
                    float32_array = np.frombuffer(data, dtype=np.float32)
                    pcm_data = float_to_16bit_pcm(float32_array)
                    send_queue.put(pcm_data)
                except Exception as e:
                    # If conversion fails, send raw data
                    logger.warning(f"Audio conversion failed, sending raw: {e}")
                    send_queue.put(data)
                    
        except WebSocketDisconnect:
            logger.info("Client disconnected")
        finally:
            stop_flag.set()
            if dg_ws:
                dg_ws.close()
            send_queue.put(None)  # Signal pump thread to stop
            
    except Exception as e:
        logger.error(f"Error in speech WebSocket: {e}")
        await websocket.close(code=4004, reason=str(e))


# Serve static files (for client.js)
static_dir = resolve_avatar_assets_dir()
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


if __name__ == "__main__":
    RealtimeAvatar().start()
