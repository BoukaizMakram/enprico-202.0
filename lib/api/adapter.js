export function adaptHandler(handler) {
  return async function(request, context) {
    const url = new URL(request.url);
    const method = request.method;

    // Build query from searchParams + dynamic route params
    const query = Object.fromEntries(url.searchParams.entries());
    if (context?.params) {
      const resolved = await context.params;
      Object.assign(query, resolved);
    }

    // Parse body for non-GET requests
    let body = null;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try { body = await request.json(); } catch { body = {}; }
      } else {
        try { body = await request.text(); } catch { body = ''; }
      }
    }

    // Create mock req
    const req = {
      method,
      url: url.pathname + url.search,
      query,
      body,
      headers: Object.fromEntries(request.headers.entries()),
    };

    // Create mock res
    let statusCode = 200;
    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    };
    let responseBody = null;
    let ended = false;

    const res = {
      status(code) { statusCode = code; return res; },
      json(data) { responseBody = data; ended = true; return res; },
      setHeader(key, value) { responseHeaders[key] = value; return res; },
      end() { ended = true; return res; },
      send(data) { responseBody = data; ended = true; return res; },
    };

    try {
      await handler(req, res);
    } catch (err) {
      console.error('API handler error:', err);
      if (!ended) {
        return Response.json(
          { success: false, message: 'Internal server error' },
          { status: 500, headers: responseHeaders }
        );
      }
    }

    if (ended && responseBody === null) {
      return new Response(null, { status: statusCode, headers: responseHeaders });
    }

    if (typeof responseBody === 'string') {
      return new Response(responseBody, {
        status: statusCode,
        headers: { 'Content-Type': 'text/plain', ...responseHeaders },
      });
    }

    return Response.json(responseBody || {}, {
      status: statusCode,
      headers: responseHeaders,
    });
  };
}

export function createRouteHandlers(handler) {
  const adapted = adaptHandler(handler);
  return { GET: adapted, POST: adapted, PUT: adapted, DELETE: adapted, PATCH: adapted, OPTIONS: adapted };
}
