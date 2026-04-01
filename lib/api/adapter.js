export function adaptHandler(handler) {
  return async function(request) {
    const url = new URL(request.url);
    const method = request.method;

    // Parse body for non-GET requests
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    // Create mock req
    const req = {
      method,
      url: url.pathname + url.search,
      query: Object.fromEntries(url.searchParams),
      body,
      headers: Object.fromEntries(request.headers),
    };

    // Create mock res
    let statusCode = 200;
    let responseHeaders = {};
    let responseBody = null;
    let ended = false;

    const res = {
      status(code) { statusCode = code; return res; },
      json(data) { responseBody = data; return res; },
      setHeader(key, value) { responseHeaders[key] = value; return res; },
      end() { ended = true; return res; },
      send(data) { responseBody = data; return res; },
    };

    await handler(req, res);

    // If ended without body (e.g., OPTIONS), return empty response
    if (ended && responseBody === null) {
      return new Response(null, {
        status: statusCode,
        headers: responseHeaders,
      });
    }

    // If responseBody is a string (e.g., from res.send), return as text
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
