import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no configurado");
  return new TextEncoder().encode(secret);
}

export type VideoTokenPayload = {
  lessonId: string;
  userId: string;
};

/** Token de corta duración para streaming de video (no descarga directa permanente). */
export async function signVideoToken(payload: VideoTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyVideoToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as VideoTokenPayload & { exp: number };
}
