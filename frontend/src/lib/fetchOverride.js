import API_BASE from './apiBaseUrl';

function replaceLocalhostUrl(u) {
  try {
    if (typeof u !== 'string') return u;
    // replace common local dev hosts with configured API base
    return u.replace(/https?:\/\/localhost:3001/gi, API_BASE).replace(/https?:\/\/127\.0\.0\.1:3001/gi, API_BASE);
  } catch (e) {
    return u;
  }
}

function wrapFetch() {
  if (!globalThis.fetch || globalThis.__API_FETCH_WRAPPED__) return;
  const orig = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input, init) => {
    if (typeof input === 'string') {
      input = replaceLocalhostUrl(input);
    } else if (input instanceof Request) {
      const newUrl = replaceLocalhostUrl(input.url);
      if (newUrl !== input.url) {
        input = new Request(newUrl, input);
      }
    }
    return orig(input, init);
  };

  globalThis.__API_FETCH_WRAPPED__ = true;
}

// run immediately when module imported (client-side)
try {
  wrapFetch();
} catch (e) {
  // ignore
}

export { wrapFetch };
