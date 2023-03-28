import { updatePythonRepos } from '../lib/repos';

async function main() {
  try {
    await updatePythonRepos();
    console.log('Repositories updated successfully');
  } catch (error) {
    console.error('Error updating repositories:', error);
    process.exit(1);
  }
}

main();
