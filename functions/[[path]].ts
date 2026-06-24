interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

interface PagesContext {
  request: Request;
  env: Env;
}

export async function onRequestGet({ request, env }: PagesContext) {
  const url = new URL(request.url);
  const accept = request.headers.get('accept') ?? '';
  const isDocumentRequest = accept.includes('text/html');

  if (url.pathname.startsWith('/api/') || !isDocumentRequest) {
    return env.ASSETS.fetch(request);
  }

  const indexUrl = new URL('/index.html', url.origin);
  return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
}

export async function onRequest({ request, env }: PagesContext) {
  return env.ASSETS.fetch(request);
}
