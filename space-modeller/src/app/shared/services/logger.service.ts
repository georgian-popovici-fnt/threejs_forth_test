import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Log levels for controlling log output
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
}

/**
 * Service for structured logging with environment-aware output
 */
@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly isLoggingEnabled = environment.enableLogging;
  private readonly isDebugMode = environment.enableDebugMode;

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDebugMode) {
      this.log(LogLevel.Debug, message, args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isLoggingEnabled) {
      this.log(LogLevel.Info, message, args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isLoggingEnabled) {
      this.log(LogLevel.Warning, message, args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    // Always log errors, even in production
    this.log(LogLevel.Error, message, error ? [error, ...args] : args);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}]`;

    switch (level) {
      case LogLevel.Debug:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.Info:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.Warning:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.Error:
        console.error(prefix, message, ...args);
        break;
    }
  }

  /**
   * Create a performance mark
   */
  startPerformanceMark(name: string): void {
    if (this.isDebugMode && typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End a performance mark and log the duration
   */
  endPerformanceMark(name: string): void {
    if (this.isDebugMode && typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        this.debug(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      } catch (error) {
        // Ignore performance measurement errors
      }
    }
  }

  /**
   * Log a group of related messages
   */
  group(label: string, callback: () => void): void {
    if (this.isLoggingEnabled) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }
}
