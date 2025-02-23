type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogData = Record<string, unknown>;

class Logger {
  private static instance: Logger;
  private isDevelopment = import.meta.env.DEV;

  private constructor() {
    // Private constructor for singleton pattern
    console.info('Logger instance created');
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    const timestamp = new Date().toISOString();
    if (this.isDevelopment) {
      console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    }
    // Here we could add remote logging service integration
  }

  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: LogData): void {
    this.log('debug', message, data);
  }
}

export const logger = Logger.getInstance();
