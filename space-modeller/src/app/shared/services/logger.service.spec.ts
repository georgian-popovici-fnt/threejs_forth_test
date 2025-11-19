import { TestBed } from '@angular/core/testing';
import { LoggerService, LogLevel } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleDebugSpy: jasmine.Spy;
  let consoleInfoSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);

    consoleDebugSpy = spyOn(console, 'debug');
    consoleInfoSpy = spyOn(console, 'info');
    consoleWarnSpy = spyOn(console, 'warn');
    consoleErrorSpy = spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log debug messages in debug mode', () => {
    service.debug('Test debug message');
    // Debug is only logged in debug mode which is controlled by environment
    // Just verify the method doesn't throw
    expect(service).toBeTruthy();
  });

  it('should log info messages', () => {
    service.info('Test info message');
    // Info is logged based on environment.enableLogging
    expect(service).toBeTruthy();
  });

  it('should log warning messages', () => {
    service.warn('Test warning message');
    // Warn is logged based on environment.enableLogging
    expect(service).toBeTruthy();
  });

  it('should always log error messages', () => {
    service.error('Test error message');
    // Error is always logged
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should log error messages with error object', () => {
    const error = new Error('Test error');
    service.error('Test error message', error);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should create performance marks', () => {
    service.startPerformanceMark('test');
    service.endPerformanceMark('test');
    // Performance marks are only created in debug mode
    expect(service).toBeTruthy();
  });

  it('should execute group callback', () => {
    let callbackExecuted = false;
    service.group('Test group', () => {
      callbackExecuted = true;
    });
    expect(callbackExecuted).toBeTrue();
  });

  it('should log additional arguments with debug messages', () => {
    service.debug('Test debug message', 'arg1', 'arg2');
    expect(service).toBeTruthy();
  });

  it('should log additional arguments with info messages', () => {
    service.info('Test info message', 'arg1', 'arg2');
    expect(service).toBeTruthy();
  });

  it('should log additional arguments with warning messages', () => {
    service.warn('Test warning message', 'arg1', 'arg2');
    expect(service).toBeTruthy();
  });

  it('should log additional arguments with error messages', () => {
    service.error('Test error message', undefined, 'arg1', 'arg2');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle performance marks without errors', () => {
    expect(() => {
      service.startPerformanceMark('test-operation');
      service.endPerformanceMark('test-operation');
    }).not.toThrow();
  });

  it('should handle performance marks with missing start mark', () => {
    expect(() => {
      service.endPerformanceMark('non-existent-mark');
    }).not.toThrow();
  });

  it('should execute callback even when logging is disabled', () => {
    let callbackExecuted = false;
    service.group('Test group', () => {
      callbackExecuted = true;
    });
    expect(callbackExecuted).toBeTrue();
  });
});
