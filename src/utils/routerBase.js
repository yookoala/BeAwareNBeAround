export function resolveRouterBasename(baseUrl = import.meta.env.BASE_URL) {
  if (!baseUrl || baseUrl === '/' || baseUrl === './' || baseUrl === '.') {
    return '/';
  }
  const normalized = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return normalized.replace(/\/+$/, '') || '/';
}
