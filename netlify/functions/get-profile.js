const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get user ID from query parameters
    const { userId } = event.queryStringParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Connect to Neon database
    const sql = neon(process.env.DATABASE_URL);

    // Fetch user profile
    const profiles = await sql`
      SELECT id, user_id, username, bio, avatar_url, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${userId}
    `;

    if (profiles.length === 0) {
      // Return default profile if none exists
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          userId,
          username: 'Gamer',
          bio: '',
          avatarUrl: null,
          exists: false
        })
      };
    }

    const profile = profiles[0];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: profile.id,
        userId: profile.user_id,
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        exists: true
      })
    };

  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch profile', details: error.message })
    };
  }
};
