/**
 * Netlify Function: Health Check
 * Перевірка статусу API
 */

const { query } = require('../lib/db');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Перевірити підключення до БД
    const result = await query('SELECT NOW() as time');
    const dbConnected = result.rows.length > 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Pro Jet API is running',
        database: dbConnected ? 'Connected' : 'Disconnected',
        environment: process.env.NODE_ENV || 'development'
      })
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        status: 'Error',
        timestamp: new Date().toISOString(),
        message: 'Service unavailable',
        error: error.message
      })
    };
  }
};
