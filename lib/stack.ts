import { StackCheck } from '@/lib/types';

const USER_AGENT =
  'StartupScout/1.0 (prospecting research; reads public homepages only)';
const TIMEOUT_MS = 8000;
const MAX_HTML = 300_000;

type Rule = {
  label: string;
  cdn?: boolean;
  test: (h: Headers, html: string) => string | null;
};

const header = (h: Headers, name: string) => h.get(name)?.toLowerCase() ?? '';

/**
 * Origin hosts first, then CDNs, because a CDN often sits in front of the origin
 */
const HOST_RULES: Rule[] = [
  {
    label: 'Vercel',
    test: (h) =>
      h.has('x-vercel-id')
        ? 'x-vercel-id'
        : header(h, 'server') === 'vercel'
          ? 'server: Vercel'
          : null
  },
  {
    label: 'Netlify',
    test: (h) =>
      h.has('x-nf-request-id')
        ? 'x-nf-request-id'
        : header(h, 'server').includes('netlify')
          ? 'server: Netlify'
          : null
  },
  {
    label: 'Webflow',
    test: (_, html) => (html.includes('data-wf-site') ? 'data-wf-site in HTML' : null)
  },
  {
    label: 'Framer',
    test: (h, html) =>
      header(h, 'server').includes('framer')
        ? 'server: Framer'
        : html.includes('framerusercontent.com')
          ? 'framerusercontent.com in HTML'
          : null
  },
  {
    label: 'Shopify',
    test: (h) => (h.has('x-shopid') ? 'x-shopid' : null)
  },
  {
    label: 'Squarespace',
    test: (h) => (header(h, 'server').includes('squarespace') ? 'server: Squarespace' : null)
  },
  {
    label: 'Wix',
    test: (h) => (h.has('x-wix-request-id') ? 'x-wix-request-id' : null)
  },
  {
    label: 'Fly.io',
    test: (h) => (h.has('fly-request-id') ? 'fly-request-id' : null)
  },
  {
    label: 'Render',
    test: (h) => (h.has('rndr-id') ? 'rndr-id' : null)
  },
  {
    label: 'Heroku',
    test: (h) => (header(h, 'via').includes('vegur') ? 'via: vegur' : null)
  },
  {
    label: 'Azure',
    test: (h) => (h.has('x-azure-ref') ? 'x-azure-ref' : null)
  },
  {
    label: 'Google Cloud',
    test: (h) =>
      header(h, 'server') === 'google frontend'
        ? 'server: Google Frontend'
        : h.has('x-goog-generation') || h.has('x-cloud-trace-context')
          ? 'x-goog / x-cloud-trace-context'
          : null
  },
  {
    label: 'AWS',
    test: (h) =>
      h.has('x-amz-cf-id')
        ? 'x-amz-cf-id'
        : h.has('x-amzn-requestid') || h.has('x-amzn-trace-id')
          ? 'x-amzn-*'
          : header(h, 'server').startsWith('amazons3')
            ? 'server: AmazonS3'
            : header(h, 'server').startsWith('awselb')
              ? 'server: awselb'
              : header(h, 'via').includes('cloudfront')
                ? 'via: CloudFront'
                : null
  },
  {
    label: 'Cloudflare',
    cdn: true,
    test: (h) => (h.has('cf-ray') ? 'cf-ray' : null)
  },
  {
    label: 'Fastly',
    cdn: true,
    test: (h) =>
      header(h, 'x-served-by').startsWith('cache-') ? 'x-served-by: cache-*' : null
  }
];

const FRAMEWORK_RULES: { label: string; test: (h: Headers, html: string) => string | null }[] = [
  {
    label: 'Next.js',
    test: (h, html) =>
      header(h, 'x-powered-by').includes('next.js')
        ? 'x-powered-by: Next.js'
        : h.has('x-nextjs-cache') || h.has('x-nextjs-prerender')
          ? 'x-nextjs-* header'
          : html.includes('/_next/static')
            ? '/_next/static in HTML'
            : html.includes('__NEXT_DATA__') || html.includes('self.__next_f')
              ? 'Next.js data script in HTML'
              : null
  },
  { label: 'Nuxt', test: (_, html) => (html.includes('/_nuxt/') ? '/_nuxt/ in HTML' : null) },
  { label: 'Astro', test: (_, html) => (html.includes('/_astro/') ? '/_astro/ in HTML' : null) },
  {
    label: 'SvelteKit',
    test: (_, html) => (html.includes('/_app/immutable') ? '/_app/immutable in HTML' : null)
  },
  {
    label: 'Remix',
    test: (_, html) =>
      html.includes('__remixContext') || html.includes('__reactRouterContext')
        ? 'Remix context in HTML'
        : null
  },
  { label: 'Gatsby', test: (_, html) => (html.includes('___gatsby') ? '___gatsby in HTML' : null) },
  {
    label: 'WordPress',
    test: (_, html) => (html.includes('/wp-content/') ? '/wp-content/ in HTML' : null)
  }
];

async function readHtml(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let html = '';
  while (html.length < MAX_HTML) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return html;
}

/**
 * Fetch one public URL and read its hosting and framework from headers and HTML
 */
export async function checkStack(url: string): Promise<StackCheck> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const html = await readHtml(res);

    const evidence: string[] = [];
    let host = 'Unknown';
    let hostIsCdn = false;
    for (const rule of HOST_RULES) {
      const found = rule.test(res.headers, html);
      if (found) {
        host = rule.label;
        hostIsCdn = rule.cdn ?? false;
        evidence.push(found);
        break;
      }
    }

    let framework = 'Unknown';
    for (const rule of FRAMEWORK_RULES) {
      const found = rule.test(res.headers, html);
      if (found) {
        framework = rule.label;
        evidence.push(found);
        break;
      }
    }

    return {
      url: res.url || url,
      reachable: true,
      status: res.status,
      host,
      hostIsCdn,
      framework,
      evidence
    };
  } catch {
    return {
      url,
      reachable: false,
      status: null,
      host: 'Unknown',
      hostIsCdn: false,
      framework: 'Unknown',
      evidence: []
    };
  }
}
