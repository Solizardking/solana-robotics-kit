/**
 * Robot Service
 * Handles connections and commands to physical robots via NVIDIA Jetson
 */

import {
  RobotInfo,
  RobotStatus,
  RobotTask,
  RobotAction,
  RobotCapability,
  RobotConnectionState,
  PerceptionResult,
  ReasoningResult,
  ReasoningRequest,
  ApiResponse,
} from '@types/index';
import { API_CONFIG, NVIDIA_CONFIG } from '@config/constants';

// =============================================================================
// ROBOT CONNECTION TYPES
// =============================================================================

export type ConnectionMethod = 'wifi' | 'bluetooth' | 'cloud';

interface RobotCommand {
  type: 'move' | 'stop' | 'speak' | 'scan' | 'execute' | 'custom';
  payload: Record<string, any>;
}

interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

// =============================================================================
// ROBOT SERVICE CLASS
// =============================================================================

export class RobotService {
  private connectedRobot: RobotInfo | null = null;
  private connectionMethod: ConnectionMethod | null = null;
  private websocket: WebSocket | null = null;
  private commandQueue: RobotCommand[] = [];
  private isProcessingQueue: boolean = false;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastLatency: number = 0;

  constructor() {
    // Initialize event listener maps
    this.eventListeners.set('status', new Set());
    this.eventListeners.set('perception', new Set());
    this.eventListeners.set('command', new Set());
    this.eventListeners.set('error', new Set());
  }

  // ==================== Connection Management ====================

  /**
   * Discover available robots on the network
   */
  async discoverRobots(): Promise<RobotInfo[]> {
    try {
      const response = await fetch(`${API_CONFIG.robotApiUrl}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeout: 5000 }),
      });

      const data: ApiResponse<RobotInfo[]> = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Robot discovery failed:', error);
      return [];
    }
  }

  /**
   * Connect to a robot
   */
  async connect(
    robot: RobotInfo,
    method: ConnectionMethod = 'wifi'
  ): Promise<RobotConnectionState> {
    try {
      // Determine connection URL based on method
      let wsUrl: string;

      switch (method) {
        case 'wifi':
          wsUrl = `ws://${robot.ipAddress}:8765/robot`;
          break;
        case 'cloud':
          wsUrl = `wss://api.solanarobotics.org/robots/${robot.id}/ws`;
          break;
        case 'bluetooth':
          // Bluetooth connection handled differently
          throw new Error('Bluetooth connection not yet implemented');
        default:
          throw new Error(`Unknown connection method: ${method}`);
      }

      // Establish WebSocket connection
      this.websocket = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error('WebSocket not initialized'));
          return;
        }

        this.websocket.onopen = () => {
          this.connectedRobot = robot;
          this.connectionMethod = method;
          this.startHeartbeat();

          resolve({
            connected: true,
            robot,
            connectionMethod: method,
            latency: this.lastLatency,
          });
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.websocket.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.websocket.onclose = () => {
          this.handleDisconnect();
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.connectedRobot) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Robot connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the current robot
   */
  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.stopHeartbeat();
      this.websocket.close();
      this.websocket = null;
    }

    this.connectedRobot = null;
    this.connectionMethod = null;
    this.commandQueue = [];
  }

  /**
   * Get current connection state
   */
  getConnectionState(): RobotConnectionState {
    return {
      connected: this.connectedRobot !== null,
      robot: this.connectedRobot,
      connectionMethod: this.connectionMethod,
      latency: this.lastLatency,
    };
  }

  // ==================== Robot Commands ====================

  /**
   * Send a command to the connected robot
   */
  async sendCommand(command: RobotCommand): Promise<CommandResult> {
    if (!this.websocket || !this.connectedRobot) {
      return { success: false, error: 'Not connected to a robot' };
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const messageHandler = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.commandId === commandId) {
          this.websocket?.removeEventListener('message', messageHandler);
          resolve({
            success: data.success,
            data: data.result,
            error: data.error,
            executionTime: Date.now() - startTime,
          });
        }
      };

      this.websocket!.addEventListener('message', messageHandler);

      this.websocket!.send(JSON.stringify({
        id: commandId,
        ...command,
      }));

      // Timeout after 30 seconds
      setTimeout(() => {
        this.websocket?.removeEventListener('message', messageHandler);
        resolve({ success: false, error: 'Command timeout' });
      }, 30000);
    });
  }

  /**
   * Move the robot
   */
  async move(
    linearX: number,
    linearY: number = 0,
    angularZ: number = 0,
    duration: number = 1000
  ): Promise<CommandResult> {
    return this.sendCommand({
      type: 'move',
      payload: {
        linear: { x: linearX, y: linearY, z: 0 },
        angular: { x: 0, y: 0, z: angularZ },
        duration,
      },
    });
  }

  /**
   * Stop all robot movement
   */
  async stop(): Promise<CommandResult> {
    return this.sendCommand({
      type: 'stop',
      payload: {},
    });
  }

  /**
   * Make the robot speak
   */
  async speak(text: string, language: string = 'en'): Promise<CommandResult> {
    return this.sendCommand({
      type: 'speak',
      payload: { text, language },
    });
  }

  /**
   * Trigger a perception scan
   */
  async scan(): Promise<CommandResult> {
    return this.sendCommand({
      type: 'scan',
      payload: {},
    });
  }

  /**
   * Execute a sequence of actions
   */
  async executeActions(actions: RobotAction[]): Promise<CommandResult> {
    return this.sendCommand({
      type: 'execute',
      payload: { actions },
    });
  }

  // ==================== NVIDIA AI Integration ====================

  /**
   * Get perception data using NVIDIA Cosmos
   */
  async getPerception(): Promise<PerceptionResult | null> {
    if (!this.connectedRobot) {
      console.error('Not connected to a robot');
      return null;
    }

    try {
      // Request camera frame from robot
      const frameResult = await this.sendCommand({
        type: 'custom',
        payload: { action: 'get_camera_frame' },
      });

      if (!frameResult.success || !frameResult.data) {
        return null;
      }

      // Send to NVIDIA Cosmos for perception
      const response = await fetch(`${NVIDIA_CONFIG.cosmosEndpoint}/perceive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          image: frameResult.data.frame,
          model: NVIDIA_CONFIG.models.perception,
        }),
      });

      const perceptionData = await response.json();
      this.emit('perception', perceptionData);

      return perceptionData;
    } catch (error) {
      console.error('Perception failed:', error);
      return null;
    }
  }

  /**
   * Get reasoning and action plan using NVIDIA Nemotron
   */
  async getReasoning(request: ReasoningRequest): Promise<ReasoningResult | null> {
    try {
      const response = await fetch(NVIDIA_CONFIG.nemotronEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: NVIDIA_CONFIG.models.reasoning,
          messages: [
            {
              role: 'system',
              content: `You are an AI robot planner. Given a context and task, provide a step-by-step plan with specific robot actions.

Available actions:
- move: {linear_x, linear_y, angular_z, duration}
- grab: {target_id}
- release: {}
- speak: {text, language}
- scan: {}
- wait: {duration}

Respond with JSON in format:
{
  "plan": ["step1", "step2", ...],
  "actions": [{type, parameters, duration}, ...],
  "confidence": 0.0-1.0,
  "reasoning": "explanation"
}`
            },
            {
              role: 'user',
              content: `Context: ${request.context}\n\nTask: ${request.task}${
                request.constraints ? `\n\nConstraints: ${request.constraints.join(', ')}` : ''
              }`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON response
      const result = JSON.parse(content) as ReasoningResult;
      return result;
    } catch (error) {
      console.error('Reasoning failed:', error);
      return null;
    }
  }

  /**
   * Execute an autonomous task combining perception and reasoning
   */
  async executeAutonomousTask(task: string): Promise<boolean> {
    try {
      // 1. Get current perception
      const perception = await this.getPerception();
      if (!perception) {
        console.error('Failed to get perception');
        return false;
      }

      // 2. Get reasoning and plan
      const reasoning = await this.getReasoning({
        context: `Current scene: ${perception.scene}\nDetected objects: ${JSON.stringify(perception.objects)}`,
        task,
      });

      if (!reasoning) {
        console.error('Failed to get reasoning');
        return false;
      }

      // 3. Execute the action plan
      const result = await this.executeActions(reasoning.actions);
      return result.success;
    } catch (error) {
      console.error('Autonomous task failed:', error);
      return false;
    }
  }

  // ==================== Task Management ====================

  /**
   * Get available tasks for the robot
   */
  async getAvailableTasks(): Promise<RobotTask[]> {
    if (!this.connectedRobot) {
      return [];
    }

    try {
      const response = await fetch(
        `${API_CONFIG.robotApiUrl}/tasks?capabilities=${this.connectedRobot.capabilities.join(',')}`
      );
      const data: ApiResponse<RobotTask[]> = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  /**
   * Accept a task
   */
  async acceptTask(taskId: string): Promise<boolean> {
    if (!this.connectedRobot) {
      return false;
    }

    try {
      const response = await fetch(`${API_CONFIG.robotApiUrl}/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robotId: this.connectedRobot.id }),
      });
      const data: ApiResponse<void> = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to accept task:', error);
      return false;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, proofHash: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.robotApiUrl}/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robotId: this.connectedRobot?.id,
          proofHash,
        }),
      });
      const data: ApiResponse<void> = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to complete task:', error);
      return false;
    }
  }

  // ==================== Event Handling ====================

  /**
   * Subscribe to robot events
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from robot events
   */
  off(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event
   */
  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  }

  // ==================== Internal Methods ====================

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'status':
        if (this.connectedRobot) {
          this.connectedRobot.status = data.status;
          this.connectedRobot.batteryLevel = data.batteryLevel;
          this.emit('status', this.connectedRobot);
        }
        break;
      case 'perception':
        this.emit('perception', data.perception);
        break;
      case 'pong':
        this.lastLatency = Date.now() - data.timestamp;
        break;
      case 'error':
        this.emit('error', data.error);
        break;
    }
  }

  private handleDisconnect(): void {
    this.connectedRobot = null;
    this.connectionMethod = null;
    this.stopHeartbeat();
    this.emit('status', { connected: false });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }));
      }
    }, 5000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const robotService = new RobotService();
export default robotService;
