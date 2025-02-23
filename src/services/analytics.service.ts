import { logger } from '../utils/logger';

export type AnalyticsEvent =
  | 'TASK_EXTRACTION'
  | 'TASK_SYNC'
  | 'ERROR'
  | 'OFFLINE_MODE'
  | 'CACHE_HIT'
  | 'CACHE_MISS';

interface EventMetadata {
  taskCount?: number;
  errorType?: string;
  duration?: number;
  cacheSize?: number;
  textLength?: number;
}

class AnalyticsService {
  private events: Array<{
    event: AnalyticsEvent;
    timestamp: number;
    metadata?: EventMetadata;
  }> = [];

  private readonly MAX_EVENTS = 1000;
  private readonly FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  public trackEvent(event: AnalyticsEvent, metadata?: EventMetadata) {
    this.events.push({
      event,
      timestamp: Date.now(),
      metadata,
    });

    logger.info('Analytics event tracked:', { event, metadata });

    if (this.events.length >= this.MAX_EVENTS) {
      this.flush();
    }
  }

  private async flush() {
    if (this.events.length === 0) return;

    try {
      // In a real app, send to analytics service
      // For now, just log
      logger.info('Analytics flush:', {
        eventCount: this.events.length,
        events: this.events,
      });

      this.events = [];
    } catch (error) {
      logger.error('Analytics flush failed:', error);
    }
  }
}

export const analytics = new AnalyticsService();
