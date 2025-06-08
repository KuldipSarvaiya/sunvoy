import login from './services/loginService';
import { setCookie, getCookie, writeUsers, appendUser } from './services/storeService';

async function main() {
  try {
    await login();
    await writeUsers([{ id: '1', name: 'Test User' }]);
    await appendUser({ id: '2', name: 'Another User' });
  } catch (error) {
    console.error('Main error:', error);
  }
}

main();
