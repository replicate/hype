import { updateContent } from '../lib/content';

async function main() {
  try {
    await updateContent();
    console.log('Content updated successfully');
  } catch (error) {
    console.error('Error updating content:', error);
    process.exit(1);
  }
}

main();
