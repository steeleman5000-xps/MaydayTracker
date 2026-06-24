interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

interface PagesContext {
  request: Request;
  env: Env;
  next(): Promise<Response>;
}

export async function onRequest(context: PagesContext) {
  const response = await context.next();
  if (response.status !== 404) return response;

  const url = new URL(context.request.url);
  const accept = context.request.headers.get('accept') ?? '';
  const isDocumentRequest = accept.includes('text/html');

  if (url.pathname.startsWith('/api/') || !isDocumentRequest) {
    return response;
  }

  const indexUrl = new URL('/index.html', url.origin);
  return context.env.ASSETS.fetch(new Request(indexUrl.toString(), context.request));
}
