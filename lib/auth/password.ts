import "server-only";
import bcrypt from "bcryptjs";

/**
 * Hash de contraseñas. Aislado para poder cambiar de algoritmo (p. ej. argon2id)
 * sin tocar el resto del código. NUNCA se guardan contraseñas en texto plano.
 */
const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
