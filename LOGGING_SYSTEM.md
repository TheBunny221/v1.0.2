# Unified Logging System

This document describes the comprehensive logging system implemented for both frontend (React) and backend (Node.js/Express) components of the Cochin Smart City application.

## Overview

The logging system provides:
- **Unified Format**: Consistent log structure across frontend and backend
- **Multiple Log Levels**: error, warn, info, debug
- **Daily Rotation**: Automatic log file rotation with date-based naming
- **Environment-Specific**: Different configurations for development and production
- **Context-Aware**: Automatic module detection and user context tracking
- **Performance Monitoring**: Built-in performance logging capabilities

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   Logger        │───▶│    Logger       │
│                 │    │                 │
│ - Console logs  │    │ - File logs     │
│ - Queue system  │    │ - Console logs  │
│ - Error capture │    │ - Daily rotation│
└─────────────────┘    └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │   Log Files     │
         │              │                 │
         │              │ logs/           │
         │              │ ├── app-*.log   │
         │              │ ├── error-*.log │
         │              │ └── combined-*  │
         │              └─────────────────┘
         │
         ▼
┌─────────────────┐
│  /api/logs      │
│  Endpoint       │
│                 │
│ - Rate limited  │
│ - Processes     │
│ - Forwards to   │
│   backend logger│
└─────────────────┘
```

## Backend Logger

### Location
- **File**: `server/utils/logger.js`
- **Controller**: `server/controller/logController.js`
- **Routes**: `server/routes/logRoutes.js`

### Features

#### Log Levels
- **error**: Critical errors that need immediate attention
- **warn**: Warning conditions that should be monitored
- **info**: General information about application flow
- **http**: HTTP request/response logging
- **debug**: Detailed debugging information

#### Daily Rotation
- **File Pattern**: `logs/{type}-YYYY-MM-DD.log`
- **Types**: `combined`, `app`, `error`, `exceptions`, `rejections`
- **Retention**: 30 days
- **Max Size**: 20MB per file

#### Environment Configuration
```javascript
// Development
- Console output with colors
- Debug level enabled
- Optional file logging (LOG_TO_FILE=true)

// Production
- File logging enabled
- Info level default
- Structured JSON format
```

### Usage Examples

#### Basic Logging
```javascript
import logger from './utils/logger.js';

// Basic levels
logger.error('Database connection failed', { error: err });
logger.warn('High memory usage detected', { usage: '85%' });
logger.info('User registered successfully', { userId: '123' });
logger.debug('Cache hit for key', { key: 'user:123' });
```

#### Convenience Methods
```javascript
// Domain-specific logging
logger.auth('User login attempt', { email: 'user@example.com' });
logger.api('Rate limit exceeded', { ip: '192.168.1.1' });
logger.db('Query executed', { query: 'SELECT * FROM users', duration: 150 });
logger.security('Suspicious activity detected', { userId: '123' });
```

#### Context-Aware Logging
```javascript
// With user context
const userLogger = logger.withUser('123', 'session-456');
userLogger.info('Profile updated');

// With module context
const paymentLogger = logger.withModule('payment');
paymentLogger.error('Payment processing failed', { orderId: '789' });
```

#### Performance Logging
```javascript
const start = Date.now();
// ... operation
const duration = Date.now() - start;
logger.performance('database-query', duration, { query: 'complex-join' });
```

#### Request Logging
```javascript
// Automatic via middleware
app.use(enhancedRequestLogger);

// Manual
logger.request(req, res, responseTime);
```

### Configuration

#### Environment Variables
```bash
# Log level (error, warn, info, debug)
LOG_LEVEL=debug

# Enable file logging in development
LOG_TO_FILE=true

# Node environment
NODE_ENV=development
```

#### File Structure
```
logs/
├── combined-2024-01-15.log    # All logs
├── app-2024-01-15.log         # Info and above
├── error-2024-01-15.log       # Errors only
├── exceptions-2024-01-15.log  # Uncaught exceptions
├── rejections-2024-01-15.log  # Unhandled rejections
└── *.audit.json               # Rotation metadata
```

## Frontend Logger

### Location
- **File**: `client/utils/logger.ts`

### Features

#### Development Mode
- Console logging with colors
- Immediate error display
- Debug information visible

#### Production Mode
- Error logs to console
- Background log submission to backend
- Queue management with size limits

#### Global Error Handling
- Uncaught JavaScript errors
- Unhandled promise rejections
- React error boundary integration

### Usage Examples

#### Basic Logging
```typescript
import logger from '../utils/logger';

// Basic levels
logger.error('API call failed', { endpoint: '/api/users', status: 500 });
logger.warn('Slow network detected', { duration: 5000 });
logger.info('User logged in', { userId: '123' });
logger.debug('Component rendered', { component: 'UserProfile' });
```

#### React-Specific Logging
```typescript
// Component errors
logger.componentError('UserProfile', error, errorInfo);

// Hook errors
logger.hookError('useUserData', error, { userId: '123' });

// Route changes
logger.routeChange('/login', '/dashboard');

// API calls
logger.apiCall('GET', '/api/users', 200, 150);
```

#### Context-Aware Logging
```typescript
// With user context
const userLogger = logger.withUser('123');
userLogger.info('Profile viewed');

// With component context
const componentLogger = logger.withComponent('UserProfile');
componentLogger.debug('Props updated', { newProps });

// With module context
const authLogger = logger.withModule('authentication');
authLogger.info('Token refreshed');
```

#### Performance Monitoring
```typescript
const start = performance.now();
// ... operation
const duration = performance.now() - start;
logger.performance('component-render', duration, { component: 'UserList' });
```

### Configuration

#### Environment Variables
```bash
# Frontend log level
VITE_LOG_LEVEL=debug

# Send logs to backend in production
VITE_SEND_LOGS_TO_BACKEND=true
```

#### Backend Submission
- **Endpoint**: `POST /api/logs`
- **Rate Limited**: 50 requests per minute per IP
- **Queue Size**: 100 logs maximum
- **Auto Flush**: Every 30 seconds
- **Immediate Flush**: For error logs

## API Endpoints

### POST /api/logs
Receives logs from frontend applications.

#### Request Format
```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "error",
      "message": "API call failed",
      "meta": {
        "component": "UserProfile",
        "userId": "123",
        "error": "Network timeout"
      },
      "url": "http://localhost:3000/profile",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Processed 1 log entries",
  "data": {
    "processed": 1
  }
}
```

### GET /api/logs/stats
Returns logging statistics (admin only).

#### Response Format
```json
{
  "success": true,
  "message": "Log statistics retrieved",
  "data": {
    "logsDirectory": "./logs",
    "environment": "production",
    "logLevel": "info",
    "frontendLoggingEnabled": true
  }
}
```

## Integration Guide

### Backend Integration

1. **Import the logger**:
```javascript
import logger from './utils/logger.js';
```

2. **Add to middleware**:
```javascript
import { enhancedRequestLogger } from './app.js';
app.use(enhancedRequestLogger);
```

3. **Replace console.log calls**:
```javascript
// Before
console.log('User created:', user);

// After
logger.info('User created successfully', { userId: user.id });
```

### Frontend Integration

1. **Import the logger**:
```typescript
import logger from '../utils/logger';
```

2. **Add to error boundaries**:
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  logger.componentError(this.constructor.name, error, errorInfo);
}
```

3. **Add to API calls**:
```typescript
try {
  const response = await fetch('/api/users');
  logger.apiCall('GET', '/api/users', response.status, duration);
} catch (error) {
  logger.error('API call failed', { endpoint: '/api/users', error });
}
```

4. **Add to route changes**:
```typescript
useEffect(() => {
  logger.routeChange(previousPath, currentPath);
}, [location]);
```

## Best Practices

### Do's
- ✅ Use appropriate log levels
- ✅ Include relevant context (userId, sessionId, etc.)
- ✅ Log performance metrics for critical operations
- ✅ Use structured logging with metadata
- ✅ Log errors with stack traces
- ✅ Use convenience methods for domain-specific logging

### Don'ts
- ❌ Log sensitive information (passwords, tokens)
- ❌ Use console.log in production code
- ❌ Log excessively in tight loops
- ❌ Include large objects without filtering
- ❌ Use debug level for production errors
- ❌ Forget to include error context

### Log Message Guidelines

#### Good Examples
```javascript
// Good: Specific, actionable, includes context
logger.error('Database connection failed', {
  host: 'db.example.com',
  database: 'app_prod',
  error: error.message,
  retryAttempt: 3
});

logger.info('User authentication successful', {
  userId: '123',
  method: 'password',
  ip: '192.168.1.1',
  duration: 150
});
```

#### Bad Examples
```javascript
// Bad: Vague, no context
logger.error('Something went wrong');

// Bad: Too verbose, includes sensitive data
logger.info('User data', { 
  user: entireUserObject,
  password: 'secret123'
});
```

## Monitoring and Alerting

### Log Analysis
- **Tools**: Can be integrated with ELK stack, Splunk, or similar
- **Structured Format**: JSON logs for easy parsing
- **Correlation**: Request IDs and user context for tracing

### Alert Conditions
- **Error Rate**: > 5% of requests result in errors
- **Performance**: API responses > 2 seconds
- **Security**: Multiple failed login attempts
- **System**: High memory/CPU usage

### Metrics to Track
- **Error Frequency**: Errors per minute/hour
- **Response Times**: API and page load times
- **User Actions**: Login, registration, key features
- **System Health**: Database connections, memory usage

## Troubleshooting

### Common Issues

#### Logs Not Appearing
1. Check log level configuration
2. Verify file permissions for logs directory
3. Ensure LOG_TO_FILE is enabled for file output
4. Check disk space availability

#### Frontend Logs Not Reaching Backend
1. Verify VITE_SEND_LOGS_TO_BACKEND is enabled
2. Check network connectivity
3. Review rate limiting settings
4. Verify /api/logs endpoint is accessible

#### Performance Impact
1. Adjust log levels in production
2. Reduce log frequency for high-traffic endpoints
3. Monitor log file sizes and rotation
4. Consider async logging for high-volume scenarios

### Debug Commands

```bash
# View recent logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Search for errors
grep -i error logs/error-$(date +%Y-%m-%d).log

# Check log file sizes
ls -lh logs/

# Monitor log creation
watch -n 1 'ls -la logs/'
```

## Testing

### Backend Tests
- **Location**: `server/__tests__/logger.test.js`
- **Coverage**: All logging methods, configuration, context-aware logging
- **Mocking**: Winston logger to avoid file I/O in tests

### Frontend Tests
- **Location**: `client/__tests__/logger.test.ts`
- **Coverage**: Console logging, queue management, error handling
- **Mocking**: Console methods and fetch API

### Integration Tests
- **End-to-End**: Verify logs flow from frontend to backend
- **Performance**: Ensure logging doesn't impact application performance
- **Error Scenarios**: Test error handling and recovery

## Future Enhancements

### Planned Features
- **Real-time Monitoring**: WebSocket-based log streaming
- **Log Aggregation**: Centralized logging service
- **Advanced Filtering**: Query interface for log analysis
- **Automated Alerts**: Email/SMS notifications for critical errors
- **Performance Insights**: Automated performance analysis

### Integration Opportunities
- **APM Tools**: New Relic, DataDog integration
- **Error Tracking**: Sentry integration
- **Analytics**: Custom dashboards and reporting
- **Machine Learning**: Anomaly detection and predictive alerts

## Conclusion

The unified logging system provides comprehensive visibility into both frontend and backend operations while maintaining performance and security. It supports development debugging, production monitoring, and long-term analysis through structured, searchable logs with automatic rotation and retention policies.
