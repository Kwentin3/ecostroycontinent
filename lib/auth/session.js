import { cookies } from "next/headers.js";

import { createId } from "../utils/id.js";
import { getAppConfig } from "../config.js";
import { query } from "../db/client.js";
import { verifyPassword } from "./password.js";
import { ROLE_LABELS } from "../ui-copy.js";
export {
  userCanEditContent,
  userCanManageUsers,
  userCanOwnerApprove,
  userCanPublish,
  userCanReview,
  userIsSuperadmin
} from "./roles.js";

export async function getUserByUsername(username) {
  const result = await query(
    "SELECT id, username, display_name, role, password_hash, active FROM app_users WHERE username = $1",
    [username]
  );

  return result.rows[0] ?? null;
}

export async function getUserById(userId) {
  const result = await query(
    "SELECT id, username, display_name, role, active FROM app_users WHERE id = $1",
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function loginWithPassword(username, password) {
  const user = await getUserByUsername(username);

  if (!user || !user.active) {
    return null;
  }

  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  const config = getAppConfig();
  const sessionId = createId("session");
  const expiresAt = new Date(Date.now() + config.sessionTtlHours * 60 * 60 * 1000);

  await query(
    "INSERT INTO app_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sessionId, user.id, expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(config.sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    expires: expiresAt,
    path: "/"
  });

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role
  };
}

export async function logoutCurrentSession() {
  const config = getAppConfig();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(config.sessionCookieName)?.value;

  if (sessionId) {
    await query("DELETE FROM app_sessions WHERE id = $1", [sessionId]);
  }

  cookieStore.delete(config.sessionCookieName);
}

export async function getCurrentUser() {
  const config = getAppConfig();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(config.sessionCookieName)?.value;

  if (!sessionId) {
    return null;
  }

  const result = await query(
    `SELECT u.id, u.username, u.display_name, u.role
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.id = $1
       AND s.expires_at > NOW()
       AND u.active = TRUE`,
    [sessionId]
  );

  return result.rows[0] ?? null;
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  return user;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}
