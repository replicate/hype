import supabase from '../lib/supabase.js';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Try to select from repositories
  try {
    const { data, error } = await supabase
      .from('repositories')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Select error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Select successful, found', data?.length || 0, 'records');
    }
  } catch (e) {
    console.error('Select exception:', e.message);
  }

  // Test 2: Try a simple insert
  try {
    const testPost = {
      id: 'test-' + Date.now(),
      source: 'github',
      username: 'test-user',
      name: 'test-repo',
      description: 'Test description',
      stars: 0,
      url: 'https://github.com/test/test',
      created_at: new Date().toISOString()
    };

    console.log('\nTrying to insert test post:', testPost);
    
    const { data, error } = await supabase
      .from('repositories')
      .insert(testPost)
      .select();
    
    if (error) {
      console.error('Insert error:', JSON.stringify(error, null, 2));
      console.error('Error details:', error);
    } else {
      console.log('Insert successful:', data);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('repositories')
        .delete()
        .eq('id', testPost.id)
        .eq('source', testPost.source);
        
      if (deleteError) {
        console.error('Cleanup error:', deleteError);
      } else {
        console.log('Test data cleaned up');
      }
    }
  } catch (e) {
    console.error('Insert exception:', e.message);
    console.error('Stack:', e.stack);
  }
}

testConnection();