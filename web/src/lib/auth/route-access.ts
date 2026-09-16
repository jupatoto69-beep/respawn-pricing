export const LOGIN_PATH = "/login";
export const PRICING_APP_PATH = "/";

export function getAuthenticationRedirect(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  const isLoginRoute = pathname === LOGIN_PATH;

  if (!isAuthenticated && !isLoginRoute) {
    return LOGIN_PATH;
  }

  if (isAuthenticated && isLoginRoute) {
    return PRICING_APP_PATH;
  }

  return null;
}
