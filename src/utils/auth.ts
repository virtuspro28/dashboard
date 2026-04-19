import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// En producción, esto debería venir del archivo config cargado desde las variables de entorno.
// Usamos un fallback seguro para desarrollo.
const JWT_SECRET = process.env["JWT_SECRET"] ?? "homepinas-super-secret-dev-key";
const JWT_EXPIRES_IN = "7d"; // El dashboard de un NAS suele requerir sesiones largas

/**
 * Hashea una contraseña usando bcrypt.
 * @param password Contraseña en texto plano
 * @returns Hash generado (incluye el salt)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // Incrementado a 12 para producción
  return bcrypt.hash(password, salt);
}

/**
 * Verifica si una contraseña plana coincide con el hash de la base de datos.
 * @param password Contraseña plana
 * @param hash Hash almacenado en DB
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Genera un nuevo JWT para el usuario especificado.
 * @param userId ID del usuario en base de datos
 * @param username Nombre de usuario
 * @param role Rol del usuario (ADMIN, USER, VIEWER)
 */
export function generateToken(userId: string, username: string, role: string): string {
  // Incluimos el rol en el token para evitar consultas constantes a la DB en cada request
  return jwt.sign({ id: userId, username, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Valida un token JWT extrayendo su payload.
 * Lanza un error si el token es inválido o ha expirado.
 * @param token JWT desencriptado
 */
export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && decoded !== null) {
      return decoded as jwt.JwtPayload;
    }
    return null;
  } catch (error) {
    return null; // Token expirado, malformado o firmado con otra clave
  }
}
