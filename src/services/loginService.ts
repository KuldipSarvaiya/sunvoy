import { getCookie, setCookie } from "./storeService";

async function fetchWithLogs(url: string, options: RequestInit = {}) {
  try {
    console.log('\n\n* * *\n\nRequest details:');
    console.log('URL:', url);
    console.log('Options:', options);
    const requestHeaders = new Headers(options.headers || {});

    const response = await fetch(url, {
      ...options,
      credentials: 'same-origin',
      headers: requestHeaders,
      redirect: 'manual'
    });

    console.log('\nResponse details:');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Cookies from response:', response.headers.get('set-cookie'));

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

async function extractNonceFromLoginPage(): Promise<string> {
  console.log('\nFetching login page to extract nonce...');
  const loginUrl = `${process.env.API_BASE_URL}/login`;
  const response = await fetchWithLogs(loginUrl);
  const html = await response.text();

  const nonceMatch = html.match(/name="nonce"\s+value="([^"]+)"/);
  if (!nonceMatch || !nonceMatch[1]) {
    throw new Error('Could not find nonce value in login page');
  }

  const nonce = nonceMatch[1];
  console.log('Found nonce:', nonce);
  return nonce;
}

async function login(callback?: () => Promise<void>): Promise<void> {
  console.log('Checking if cookie is already set...');
  const prev_cookie = await getCookie();
  if (prev_cookie) {
    console.log('Cookie is already set.');
    if (callback) {
      await callback();
    }
    return;
  }

  console.log('\nStarting login process...');
  const loginUrl = `${process.env.API_BASE_URL}/login`;
  const nonce = await extractNonceFromLoginPage();

  const formData = new URLSearchParams();
  formData.append('nonce', nonce);
  formData.append('username', process.env.AUTH_USERNAME || '');
  formData.append('password', process.env.AUTH_PASSWORD || '');

  console.log('\nSending login request with form data:', {
    nonce,
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD
  });

  const response = await fetchWithLogs(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  if (response.status !== 302) {
    const responseText = await response.text();
    throw new Error(`Login failed: ${response.statusText}\nResponse: ${responseText}`);
  }
  const new_cookie: string = response.headers.get('set-cookie') || '';
  await setCookie(new_cookie);

  if (callback) {
    await callback();
  }

  console.log('Login successful!');
}

export default login;
