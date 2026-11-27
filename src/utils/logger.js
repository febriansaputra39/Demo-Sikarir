const { NODE_ENV } = require('../config/environment');

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'oldpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'resettoken',
  'secret',
  'jwt_secret',
  'authorization',
  'cookie',
  'apikey',
  'api_key'
]);

/**
 * Membersihkan karakter baris baru dari pesan log untuk mencegah Log Injection (CRLF injection).
 */
const sanitizeMessage = (message) => {
  if (message === null || message === undefined) return '';
  return String(message).replace(/[\r\n]+/g, ' ').trim();
};

/**
 * Serialisasi metadata yang aman terhadap circular reference, instance Error,
 * serta menyensor field sensitif secara rekursif.
 */
const safeSerializeMeta = (meta) => {
  if (meta === '' || meta === null || meta === undefined) return '';

  if (typeof meta === 'string') {
    return sanitizeMessage(meta);
  }

  if (meta instanceof Error) {
    const errorPayload = {
      name: meta.name,
      message: sanitizeMessage(meta.message),
      ...(meta.statusCode ? { statusCode: meta.statusCode } : {}),
      ...(meta.code ? { code: meta.code } : {})
    };
    if (NODE_ENV !== 'production' && meta.stack) {
      return `${JSON.stringify(errorPayload)}\n${meta.stack}`;
    }
    return JSON.stringify(errorPayload);
  }

  const seen = new WeakSet();
  try {
    return JSON.stringify(meta, (key, value) => {
      if (key && SENSITIVE_KEYS.has(String(key).toLowerCase())) {
        return '[REDACTED]';
      }

      if (value instanceof Error) {
        return {
          name: value.name,
          message: sanitizeMessage(value.message),
          ...(value.statusCode ? { statusCode: value.statusCode } : {}),
          ...(NODE_ENV !== 'production' && value.stack ? { stack: value.stack } : {})
        };
      }

      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    });
  } catch (_) {
    return '[Unserializable Meta]';
  }
};

const writeLog = (level, consoleMethod, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const cleanMessage = sanitizeMessage(message);
  const serializedMeta = safeSerializeMeta(meta);
  const prefix = `[${level.padEnd(5, ' ')}] [${timestamp}] ${cleanMessage}`;

  if (serializedMeta) {
    consoleMethod(prefix, serializedMeta);
  } else {
    consoleMethod(prefix);
  }
};

const logger = {
  info: (message, meta = '') => {
    writeLog('INFO', console.log, message, meta);
  },
  warn: (message, meta = '') => {
    writeLog('WARN', console.warn, message, meta);
  },
  error: (message, meta = '') => {
    writeLog('ERROR', console.error, message, meta);
  },
  debug: (message, meta = '') => {
    if (NODE_ENV !== 'production') {
      writeLog('DEBUG', console.log, message, meta);
    }
  }
};

module.exports = logger;