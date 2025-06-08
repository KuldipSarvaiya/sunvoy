import * as fs from 'fs/promises';
import * as path from 'path';

type UserT = Record<string, string>

const COOKIE_FILE = path.join(process.cwd(), 'cookie.txt.local');
const USERS_FILE = path.join(process.cwd(), 'users.json.local');

export async function setCookie(cookieString: string): Promise<void> {
  try {
    await fs.writeFile(COOKIE_FILE, cookieString, 'utf-8');
    console.log('Cookie stored successfully');
  } catch (error) {
    console.error('Error storing cookie:', error);
    throw error;
  }
}

export async function getCookie(): Promise<string> {
  try {
    const exists = await fs.access(COOKIE_FILE)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      return '';
    }

    const cookie = await fs.readFile(COOKIE_FILE, 'utf-8');
    return cookie;
  } catch (error) {
    console.error('Error reading cookie:', error);
    return '';
  }
}

export async function writeUsers(users: UserT[]): Promise<void> {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    console.log('Users written successfully');
  } catch (error) {
    console.error('Error writing users:', error);
    throw error;
  }
}

export async function appendUser(user: UserT): Promise<void> {
  try {
    let users: UserT[] = [];

    const exists = await fs.access(USERS_FILE)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      const content = await fs.readFile(USERS_FILE, 'utf-8');
      users = JSON.parse(content);
    }

    users.push(user);

    await writeUsers(users);
    console.log('User appended successfully');
  } catch (error) {
    console.error('Error appending user:', error);
    throw error;
  }
}
