/**
 * Structured Logging & Monitoring Service
 * Handles application logs, errors, and performance metrics.
 */
export const Logger = (() => {
  const isDev = true; // In production this would be set based on ENV

  const log = (level, context, message, data = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data
    };

    if (isDev) {
      const styles = {
        info: 'color: #3498db; font-weight: bold;',
        warn: 'color: #f39c12; font-weight: bold;',
        error: 'color: #e74c3c; font-weight: bold;',
        perf: 'color: #2ecc71; font-weight: bold;'
      };
      console[level === 'perf' ? 'log' : level](
        `%c[${context}] ${message}`,
        styles[level],
        data
      );
    }

    // In a real app, send 'entry' to Datadog/NewRelic/Sentry here.
  };

  /**
   * Run a performance trace on a callback function.
   * @param {string} name - Name of the trace
   * @param {Function} fn - Function to execute
   */
  const trace = (name, fn) => {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const end = performance.now();
      if (end - start > 10) { // Log slow functions > 10ms
        log('perf', 'Performance', `Trace [${name}] took ${(end - start).toFixed(2)}ms`);
      }
    }
  };

  return {
    info: (context, msg, data) => log('info', context, msg, data),
    warn: (context, msg, data) => log('warn', context, msg, data),
    error: (context, msg, data, err) => {
       if (err) data.error = err.message || err.toString();
       log('error', context, msg, data);
    },
    perf: (context, msg, data) => log('perf', context, msg, data),
    trace
  };
})();
