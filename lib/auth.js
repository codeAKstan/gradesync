import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(tokenOrRequest) {
  try {
    let token;
    
    // If it's a request object, extract the token
    if (tokenOrRequest && typeof tokenOrRequest === 'object' && tokenOrRequest.headers) {
      token = getTokenFromRequest(tokenOrRequest);
      if (!token) {
        return { success: false, message: 'No token provided' };
      }
    } else {
      // If it's already a token string
      token = tokenOrRequest;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, ...decoded };
  } catch (error) {
    return { success: false, message: 'Invalid token' };
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}