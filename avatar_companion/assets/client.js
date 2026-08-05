/**
 * Solana GR00T Realtime Avatar Client
 * Handles WebSocket audio streaming, Deepgram STT, and HeyGen avatar
 */

let ws = null;
let sessionToken = null;
let sessionInfo = null;
let mediaRecorder = null;
let audioContext = null;
let sourceNode = null;
let processorNode = null;
let inputStream = null;
let isRecording = false;

const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoEl = document.getElementById('mediaElement');

function updateStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function floatTo16BitPCM(float32Array) {
    const int16Max = 32767;
    const int16Min = -32768;
    const pcm = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(int16Min, Math.min(int16Max, Math.floor(float32Array[i] * int16Max)));
        pcm[i] = s;
    }
    return pcm.buffer;
}

async function startSession() {
    try {
        updateStatus('Getting session token...', 'info');
        
        // Get HeyGen token
        const tokenResp = await fetch('/api/get_token', { method: 'POST' });
        if (!tokenResp.ok) {
            throw new Error('Failed to get token');
        }
        const tokenData = await tokenResp.json();
        sessionToken = tokenData.data?.token || tokenData.token;
        
        if (!sessionToken) {
            throw new Error('No token received');
        }
        
        updateStatus('Creating avatar session...', 'info');
        
        // Create new session
        const sessionResp = await fetch('/api/new_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_token: sessionToken,
                avatar_id: 'default' // Change to your HeyGen avatar ID
            })
        });
        
        if (!sessionResp.ok) {
            throw new Error('Failed to create session');
        }
        
        sessionInfo = await sessionResp.json();
        const sessionId = sessionInfo.data?.session_id || sessionInfo.session_id;
        
        if (!sessionId) {
            throw new Error('No session ID received');
        }
        
        updateStatus('Connecting to speech service...', 'info');
        
        // Connect WebSocket for audio streaming
        await startRecording(sessionToken, sessionId);
        
        updateStatus('✅ Connected! Speak to interact with GR00T', 'success');
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        console.error('Session start error:', error);
    }
}

async function startRecording(sessionToken, sessionId) {
    try {
        // Get microphone access
        inputStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 16000
            }
        });
        
        // Create audio context
        audioContext = new AudioContext({ sampleRate: 16000 });
        sourceNode = audioContext.createMediaStreamSource(inputStream);
        processorNode = audioContext.createScriptProcessor(4096, 1, 1);
        
        // Connect WebSocket
        const wsUrl = `/ws/speech?session_token=${encodeURIComponent(sessionToken)}&session_id=${encodeURIComponent(sessionId)}`;
        ws = new WebSocket(`ws://${window.location.host}${wsUrl}`);
        ws.binaryType = 'arraybuffer';
        
        ws.onopen = () => {
            updateStatus('WebSocket connected, streaming audio...', 'info');
            isRecording = true;
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'partial_transcript') {
                    updateStatus(`🎤 ${data.text}`, 'info');
                } else if (data.type === 'final_transcript') {
                    updateStatus(`✅ Final: ${data.text}`, 'success');
                } else if (data.type === 'heygen_response') {
                    updateStatus('🤖 GR00T is responding...', 'info');
                    // Handle HeyGen response (avatar video stream)
                    if (data.data?.video_url) {
                        videoEl.src = data.data.video_url;
                    }
                } else if (data.type === 'error') {
                    updateStatus(`Error: ${data.error}`, 'error');
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };
        
        ws.onerror = (error) => {
            updateStatus('WebSocket error', 'error');
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
            updateStatus('WebSocket disconnected', 'info');
            isRecording = false;
        };
        
        // Process audio and send to WebSocket
        processorNode.onaudioprocess = (e) => {
            if (ws && ws.readyState === WebSocket.OPEN && isRecording) {
                const float32 = e.inputBuffer.getChannelData(0);
                const pcm = floatTo16BitPCM(float32);
                ws.send(pcm);
            }
        };
        
        sourceNode.connect(processorNode);
        processorNode.connect(audioContext.destination);
        
    } catch (error) {
        updateStatus(`Recording error: ${error.message}`, 'error');
        console.error('Recording error:', error);
        throw error;
    }
}

async function stopSession() {
    try {
        isRecording = false;
        
        // Stop audio processing
        if (processorNode) {
            processorNode.disconnect();
            processorNode = null;
        }
        if (sourceNode) {
            sourceNode.disconnect();
            sourceNode = null;
        }
        if (audioContext) {
            await audioContext.close();
            audioContext = null;
        }
        if (inputStream) {
            inputStream.getTracks().forEach(track => track.stop());
            inputStream = null;
        }
        
        // Close WebSocket
        if (ws) {
            ws.close();
            ws = null;
        }
        
        updateStatus('Session stopped', 'info');
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
    } catch (error) {
        updateStatus(`Error stopping session: ${error.message}`, 'error');
        console.error('Stop session error:', error);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopSession();
});
