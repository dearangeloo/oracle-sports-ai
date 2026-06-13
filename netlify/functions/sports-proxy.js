// Netlify Function: /api/sports
// Proxies requests to API-Sports.io so the browser never calls it directly
// (avoids CORS issues and keeps the API key off the client where possible).

const BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.SPORTS_API_KEY || '1c6ddc2ed65130be2216d9a5b5c01fa8';

exports.handler = async (event) => {
  const { endpoint, ...params } = event.queryStringParameters || {};

  if (!endpoint) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing "endpoint" query parameter' }),
    };
  }

  const url = new URL(`${BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();

    return {
      statusCode: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // cache 5 min to save API quota
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
