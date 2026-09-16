export const LOGIN_FAILURE_MESSAGE =
  "No pudimos iniciar sesión. Verifica el correo y la contraseña e inténtalo de nuevo.";
export const LOGIN_REQUIRED_FIELDS_MESSAGE =
  "Ingresa tu correo electrónico y tu contraseña.";
export const LOGOUT_FAILURE_MESSAGE =
  "No pudimos cerrar la sesión. Inténtalo de nuevo.";

type PasswordAuthClient = Readonly<{
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => PromiseLike<{ error: unknown }>;
}>;

type SignOutAuthClient = Readonly<{
  signOut: (options: {
    scope: "local";
  }) => PromiseLike<{ error: unknown }>;
}>;

export type AuthenticationOperationResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; message: string }>;

export async function authenticateWithPassword(
  auth: PasswordAuthClient,
  email: string,
  password: string,
): Promise<AuthenticationOperationResult> {
  const normalizedEmail = email.trim();

  if (!normalizedEmail || !password) {
    return { ok: false, message: LOGIN_REQUIRED_FIELDS_MESSAGE };
  }

  const { error } = await auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return { ok: false, message: LOGIN_FAILURE_MESSAGE };
  }

  return { ok: true };
}

export async function endCurrentSession(
  auth: SignOutAuthClient,
): Promise<AuthenticationOperationResult> {
  const { error } = await auth.signOut({ scope: "local" });

  if (error) {
    return { ok: false, message: LOGOUT_FAILURE_MESSAGE };
  }

  return { ok: true };
}
