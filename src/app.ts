import getCurrentlyLoggedinUser from './services/authUserService';
import getUsersList from './services/usersListService';

async function main() {
  try {
    await getUsersList();
    await getCurrentlyLoggedinUser()
  } catch (error) {
    console.error('Failed to execute the Script: ', error);
  }
}

main();
