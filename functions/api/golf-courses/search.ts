interface Env {
  GOLFCOURSE_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const API_BASE = 'https://api.golfcourseapi.com';

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  });
}

export async function onRequestGet({ request, env }: PagesContext) {
  if (!env.GOLFCOURSE_API_KEY) {
    return json({ error: 'GolfCourseAPI key is not configured.' }, { status: 500 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim();
  if (!query) return json({ courses: [] });

  const upstream = new URL('/v1/search', API_BASE);
  upstream.searchParams.set('search_query', query);

  const response = await fetch(upstream, {
    headers: { Authorization: `Key ${env.GOLFCOURSE_API_KEY}` },
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8' },
  });
}
