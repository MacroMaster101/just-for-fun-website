const DEFAULT_TIMEOUT_MS = 3000;

export function createFetchWithTimeout(timeoutMs = DEFAULT_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const upstreamSignal = init?.signal;

    const abortFromUpstream = () => controller.abort();
    if (upstreamSignal?.aborted) {
      abortFromUpstream();
    } else {
      upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
    }

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }
  };
}
