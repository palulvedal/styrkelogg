// The production pages.dev address is not behind Cloudflare Access,
// so send it to the protected custom domain. Preview deployments
// (<hash>.styrkelogg.pages.dev) and local dev are left alone.
const PAGES_DEV_HOST = 'styrkelogg.pages.dev';

export function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  if (env.CANONICAL_HOST && url.hostname === PAGES_DEV_HOST) {
    url.hostname = env.CANONICAL_HOST;
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
