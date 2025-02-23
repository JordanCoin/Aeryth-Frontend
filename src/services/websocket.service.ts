import { logger } from '../utils/logger';
import { TaskUpdate } from '../types/task.types';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000;
  private messageHandlers: Set<(data: TaskUpdate) => void> = new Set();
  private statusHandlers: Set<(status: WebSocketStatus) => void> = new Set();

  connect(url: string = process.env.VITE_WS_URL || 'ws://localhost:8000/ws') {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(url);
    this.setupEventHandlers();
    this.notifyStatusChange('connecting');
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.notifyStatusChange('connected');
      logger.info('WebSocket connected');
    };

    this.ws.onmessage = event => {
      try {
        const update = JSON.parse(event.data) as TaskUpdate;
        this.messageHandlers.forEach(handler => handler(update));
      } catch (error) {
        logger.error('WebSocket message parsing error:', error);
      }
    };

    this.ws.onclose = () => {
      this.notifyStatusChange('disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = error => {
      this.notifyStatusChange('error');
      logger.error('WebSocket error:', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      logger.info('Attempting to reconnect...', { attempt: this.reconnectAttempts });
      this.connect();
    }, this.RECONNECT_DELAY * this.reconnectAttempts);
  }

  private notifyStatusChange(status: WebSocketStatus) {
    this.statusHandlers.forEach(handler => handler(status));
  }

  subscribe(handler: (data: TaskUpdate) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  subscribeToStatus(handler: (status: WebSocketStatus) => void) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const websocketService = new WebSocketService();
