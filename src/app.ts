import getUsersList from './services/usersListService';

async function main() {
  try {
    await getUsersList();
  } catch (error) {
    console.error('Main error:', error);
  }
}

main();
