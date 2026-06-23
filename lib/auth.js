import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-for-jwt-signing-which-should-be-long';

export async function signToken(payload) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24; // 24 hours

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(new TextEncoder().encode(JWT_SECRET_KEY));
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY));
    return payload;
  } catch (error) {
    return null;
  }
}
