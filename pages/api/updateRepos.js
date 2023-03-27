import { updatePythonRepos } from '../../lib/repos';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await updatePythonRepos();
      res.status(200).json({ message: 'Repositories updated successfully.' });
    } catch (error) {
      console.error('Error updating repositories:', error);
      res.status(500).json({ message: 'Error updating repositories.' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
