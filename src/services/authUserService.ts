import { appendUser, getCookie, setCookie } from './storeService';
import login from './loginService';
import crypto from 'node:crypto';

function extractHiddenInputsWithRegex(html: string): Record<string, string> {
  const fields = [
    'access_token',
    'apiuser',
    'language',
    'openId',
    'operateId',
    'userId'
  ];

  const result: Record<string, string> = {};

  for (const field of fields) {
    const regex = new RegExp(
      `<input[^>]+id="${field}"[^>]+value="([^"]+)"`,
      'i'
    );
    const match = html.match(regex);
    if (match) {
      result[field] = match[1];
    }
  }

  const payload: Record<string, string> = { ...result, timestamp: Math.round(Date.now() / 1000).toString() };

  const sortedKeys = Object.keys(payload).sort();
  const payloadString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(payload[key])}`)
    .join('&');

  const hmac = crypto.createHmac('sha1', 'mys3cr3t');
  hmac.update(payloadString);
  const checkcode = hmac.digest('hex').toUpperCase();

  return { ...payload, checkcode };
}


async function getCurrentlyLoggedinUser(retry: boolean = true): Promise<void> {
  try {
    console.log('\nFetching Currently authenticated user...');

    const cookie = await getCookie();
    if (!cookie) {
      console.log('No cookie found. Attempting to login...');
      await login(async () => {
        await getCurrentlyLoggedinUser(false);
      });
      return;
    }

    const pageUrl = `${process.env.API_BASE_URL}/settings/tokens`;
    const pageHeaders = new Headers({
      'Cookie': cookie
    });

    const pageResponse = await fetch(pageUrl, {
      method: 'GET',
      headers: pageHeaders
    });

    if (!pageResponse.ok) {
      console.log('Failed to fetch the page. Status:', pageResponse.status);
      throw new Error('Failed to fetch the token page.');
    }

    const html = await pageResponse.text();
    const payload = extractHiddenInputsWithRegex(html);
    console.log('Payload = ', payload);

    const apiUrl = `${process.env.API_BASE_URL?.replace('challenge', 'api.challenge')}/api/settings`;
    console.log('API URL:', apiUrl);
    const apiHeaders = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    });

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      body: new URLSearchParams(payload).toString(),
      headers: apiHeaders
    });

    console.log('Response status:', apiResponse.status);

    if (apiResponse.status === 401 && retry) {
      console.log('Unauthorized. Attempting to login...');
      await setCookie('')
      await login(async () => {
        await getCurrentlyLoggedinUser(false);
      });
      return;
    }

    if (apiResponse.status === 401) {
      throw new Error('Authentication failed');
    }

    if (!apiResponse.ok) {
      const text = await apiResponse.text();
      throw new Error(`Failed to fetch authenticated user: ${text}`);
    }

    const user: Record<string, string> = await apiResponse.json();
    await appendUser(user);
    console.log('Authenticated User fetched and stored successfully');

  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    throw error;
  }
}

export default getCurrentlyLoggedinUser;
