const WORKER_URL = process.env.WORKER_URL || 'https://hype.replicate.workers.dev';

async function main() {
  try {
    const response = await fetch(`${WORKER_URL}/api/update`, { method: 'POST' });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Update failed: ' + JSON.stringify(data));
    }
    
    console.log('Content updated successfully');
  } catch (error) {
    console.error('Error updating content:', error);
    process.exit(1);
  }
}

main();
