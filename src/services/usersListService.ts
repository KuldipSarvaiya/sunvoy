import { getCookie, setCookie } from './storeService';
import login from './loginService';
import { writeUsers } from './storeService';

async function getUsersList(retry: boolean = true): Promise<void> {
  try {
    console.log('\nFetching users list...');

    const cookie = await getCookie();
    if (!cookie) {
      console.log('No cookie found. Attempting to login...');
      await login(async () => {
        await getUsersList(false);
      });
      return;
    }

    const listUrl = `${process.env.API_BASE_URL}/api/users`;
    const headers = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    });

    const response = await fetch(listUrl, {
      method: 'POST',
      headers: headers
    });

    console.log('Response status:', response.status);

    if (response.status === 401 && retry) {
      console.log('Unauthorized. Attempting to login...');
      await setCookie('')
      await login(async () => {
        await getUsersList(false);
      });
      return;
    }

    if (response.status === 401) {
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch users: ${text}`);
    }

    const users = await response.json();
    await writeUsers(users);
    console.log('Users list fetched and stored successfully');

  } catch (error) {
    console.error('Error fetching users list:', error);
    throw error;
  }
}

export default getUsersList;
