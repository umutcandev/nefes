/**
 * Development/Production Log Utility
 * Production'da log maliyetlerini önlemek için sadece development'ta log yapar
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Kritik hatalar production'da da loglanmalı (ama sınırlı)
    console.error(...args);
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// Production'da sadece kritik hatalar için kullanılacak
export const criticalError = (...args: unknown[]) => {
  console.error('[CRITICAL]', ...args);
};
