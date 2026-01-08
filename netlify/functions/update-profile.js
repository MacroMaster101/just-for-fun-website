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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId, username, bio, avatarUrl } = JSON.parse(event.body || '{}');
    
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Connect to Neon database
    const sql = neon(process.env.DATABASE_URL);

    // Check if profile exists
    const existing = await sql`
      SELECT id FROM user_profiles WHERE user_id = ${userId}
    `;

    let result;

    if (existing.length === 0) {
      // Create new profile
      result = await sql`
        INSERT INTO user_profiles (user_id, username, bio, avatar_url)
        VALUES (${userId}, ${username || 'Gamer'}, ${bio || ''}, ${avatarUrl || null})
        RETURNING id, user_id, username, bio, avatar_url, created_at, updated_at
      `;
    } else {
      // Update existing profile
      result = await sql`
        UPDATE user_profiles
        SET username = ${username || 'Gamer'},
            bio = ${bio || ''},
            avatar_url = ${avatarUrl || null},
            updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING id, user_id, username, bio, avatar_url, created_at, updated_at
      `;
    }

    const profile = result[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        profile: {
          id: profile.id,
          userId: profile.user_id,
          username: profile.username,
          bio: profile.bio,
          avatarUrl: profile.avatar_url,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        }
      })
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update profile', details: error.message })
    };
  }
};
