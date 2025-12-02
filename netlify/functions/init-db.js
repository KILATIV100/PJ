/**
 * Netlify Function: Initialize Database
 * Ініціалізація таблиць Neon PostgreSQL
 */

const { initializeTables } = require('../lib/db');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Захист від несанкціонованого доступу
  const authToken = event.headers['x-init-token'] || event.queryStringParameters?.token;
  const expectedToken = process.env.INIT_TOKEN || 'pro-jet-init-2024';

  if (authToken !== expectedToken) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({
        error: 'Forbidden',
        message: 'Invalid initialization token'
      })
    };
  }

  try {
    await initializeTables();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database tables initialized successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Initialization Error',
        message: error.message
      })
    };
  }
};
