interface Env {
  GOLFCOURSE_API_KEY?: string;
}

interface PagesContext {
  env: Env;
  params: {
    id?: string;
  };
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

export async function onRequestGet({ env, params }: PagesContext) {
  if (!env.GOLFCOURSE_API_KEY) {
    return json({ error: 'GolfCourseAPI key is not configured.' }, { status: 500 });
  }

  const id = params.id;
  if (!id || !/^\d+$/.test(id)) return json({ error: 'Course id is required.' }, { status: 400 });

  const response = await fetch(`${API_BASE}/v1/courses/${id}`, {
    headers: { Authorization: `Key ${env.GOLFCOURSE_API_KEY}` },
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8' },
  });
}
