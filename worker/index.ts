interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface Environment {
  ASSETS: AssetBinding;
}

const worker = {
  async fetch(request: Request, environment: Environment): Promise<Response> {
    const assetResponse = await environment.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (!acceptsHtml) return assetResponse;

    const fallbackUrl = new URL('/index.html', request.url);
    return environment.ASSETS.fetch(new Request(fallbackUrl, request));
  },
};

export default worker;
