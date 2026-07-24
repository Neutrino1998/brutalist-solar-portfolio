const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    if (
      response.status !== 404
      || request.method !== 'GET'
      || url.pathname.split('/').at(-1)?.includes('.')
    ) {
      return response;
    }

    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  },
};

export default worker;
