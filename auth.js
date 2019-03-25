'use strict';

module.exports = (header) => {
  if (header['x-api-key']) {
    if (!process.env.API_KEYS) return false;

    const keys = process.env.API_KEYS.split(';');

    for (let i = 0; i < keys.length; i++) {
      if (header['x-api-key'] === keys[i]) return true;
    }

    return false;
  }

  if (!process.env.API_KEYS) {
    logger.warn('Auth not configured on client or server');

    return true;
  }

  return false;
};
