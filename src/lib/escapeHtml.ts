const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape user-supplied text before interpolating it into an HTML string
 * (e.g. notification emails) so it renders as text instead of markup.
 */
export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
