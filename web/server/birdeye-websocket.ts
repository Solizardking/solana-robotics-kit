import WebSocket from 'ws';

export interface PriceUpdate {
  token: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  liquidity: number;
  timestamp: number;
}

export interface BirdeyeTickerData {
  v: number; // volume
  p: number; // price
  pc: number; // price change
  pcp: number; // price change percent
  mc: number; // market cap
  h: number; // holders
  l: number; // liquidity
  t: number; // timestamp
}

class BirdeyeWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, (data: PriceUpdate) => void> = new Map();
  private priceCache: Map<string, PriceUpdate> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private apiKey: string, private rpcUrl: string) {}

  /**
   * Connect to Birdeye WebSocket and subscribe to token price updates
   */
  async connect(tokenAddress: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `wss://stream.birdeye.so/defi/price?token=${tokenAddress}`;
        
        this.ws = new WebSocket(wsUrl, {
          headers: {
            'X-API-KEY': this.apiKey,
          },
        });

        this.ws.on('open', () => {
          console.log(`[Birdeye] Connected to WebSocket for token: ${tokenAddress}`);
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message, tokenAddress);
          } catch (error) {
            console.error('[Birdeye] Error parsing message:', error);
          }
        });

        this.ws.on('error', (error: Error) => {
          console.error('[Birdeye] WebSocket error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('[Birdeye] WebSocket closed');
          this.clearHeartbeat();
          this.attemptReconnect(tokenAddress);
        });
      } catch (error) {
        console.error('[Birdeye] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any, tokenAddress: string): void {
    try {
      // Birdeye sends price updates in this format
      if (message.data && message.data.price !== undefined) {
        const priceUpdate: PriceUpdate = {
          token: tokenAddress,
          price: message.data.price || 0,
          priceChange24h: message.data.priceChange24h || 0,
          priceChangePercent24h: message.data.priceChangePercent24h || 0,
          volume24h: message.data.volume24h || 0,
          marketCap: message.data.marketCap || 0,
          holders: message.data.holders || 0,
          liquidity: message.data.liquidity || 0,
          timestamp: Date.now(),
        };

        // Cache the price update
        this.priceCache.set(tokenAddress, priceUpdate);

        // Notify all listeners
        const listener = this.listeners.get(tokenAddress);
        if (listener) {
          listener(priceUpdate);
        }
      }
    } catch (error) {
      console.error('[Birdeye] Error handling message:', error);
    }
  }

  /**
   * Subscribe to price updates for a token
   */
  subscribe(tokenAddress: string, callback: (data: PriceUpdate) => void): void {
    this.listeners.set(tokenAddress, callback);
    
    // If we have cached data, send it immediately
    const cached = this.priceCache.get(tokenAddress);
    if (cached) {
      callback(cached);
    }
  }

  /**
   * Unsubscribe from price updates
   */
  unsubscribe(tokenAddress: string): void {
    this.listeners.delete(tokenAddress);
  }

  /**
   * Get cached price data
   */
  getPrice(tokenAddress: string): PriceUpdate | undefined {
    return this.priceCache.get(tokenAddress);
  }

  /**
   * Setup heartbeat to keep connection alive
   */
  private setupHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(tokenAddress: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[Birdeye] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(tokenAddress).catch((error) => {
          console.error('[Birdeye] Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('[Birdeye] Max reconnection attempts reached');
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.clearHeartbeat();
    this.listeners.clear();
    this.priceCache.clear();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
let birdeyeManager: BirdeyeWebSocketManager | null = null;

export function getBirdeyeManager(): BirdeyeWebSocketManager {
  if (!birdeyeManager) {
    const apiKey = process.env.BIRDEYE_API_KEY || '';
    const rpcUrl = process.env.HELIUS_RPC_URL || '';
    birdeyeManager = new BirdeyeWebSocketManager(apiKey, rpcUrl);
  }
  return birdeyeManager;
}

export function closeBirdeyeManager(): void {
  if (birdeyeManager) {
    birdeyeManager.disconnect();
    birdeyeManager = null;
  }
}
