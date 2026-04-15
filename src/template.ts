const LIGHT_VARS = `
    --bg: #fafaf9;
    --card-bg: #ffffff;
    --text: #1c1917;
    --text-sub: #78716c;
    --border: #e7e5e4;
    --border-strong: #d6d3d1;
    --muted: #f5f5f4;
    --tree-line: #d6d3d1;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.04);`;

const DARK_VARS = `
    --bg: #0c0a09;
    --card-bg: #1c1917;
    --text: #fafaf9;
    --text-sub: #a8a29e;
    --border: #292524;
    --border-strong: #44403c;
    --muted: #1c1917;
    --tree-line: #44403c;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);`;

const CSS = `  :root {${LIGHT_VARS}
    --radius: 8px;
  }

  :root[data-theme="dark"] {${DARK_VARS}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {${DARK_VARS}
    }
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    padding: 48px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  h1 {
    font-size: 30px;
    font-weight: 600;
    letter-spacing: -0.025em;
    margin-bottom: 6px;
  }

  .subtitle {
    color: var(--text-sub);
    font-size: 14px;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }

  .aggregate {
    margin-bottom: 40px;
  }

  .aggregate-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
  }

  .aggregate-header .desc {
    font-weight: 400;
    font-size: 13px;
    color: var(--text-sub);
    letter-spacing: -0.01em;
  }

  .card-header .icon {
    width: 14px;
    height: 14px;
    opacity: 0.7;
    flex-shrink: 0;
  }

  .standalone {
    margin-bottom: 24px;
  }

  .tree {
    list-style: none;
    margin-left: 20px;
    padding-left: 20px;
  }

  .aggregate > .card {
    margin-bottom: 0;
  }

  .aggregate > .root-tree {
    padding-top: 0;
    padding-bottom: 8px;
    margin-top: 0;
    margin-left: 20px;
  }

  .tree-node {
    position: relative;
    border-left: 1px solid var(--tree-line);
    padding: 8px 0 0 18px;
    margin-left: -20px;
  }

  .tree-node:last-child {
    border-left: 1px solid transparent;
  }

  .tree-node::before {
    content: "";
    position: absolute;
    left: -1px;
    top: 24px;
    width: 18px;
    height: 1px;
    background: var(--tree-line);
  }

  .tree-node:last-child::after {
    content: "";
    position: absolute;
    left: -1px;
    top: 0;
    height: 25px;
    width: 1px;
    background: var(--tree-line);
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    margin: 0;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: -0.01em;
  }

  .card-header .badge {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 9999px;
    border: 1px solid var(--border-strong);
    color: var(--text-sub);
    background: var(--muted);
  }

  .card-body {
    padding: 10px 14px 12px;
    border-top: 1px solid var(--border);
    background: var(--card-bg);
  }

  .prop {
    font-size: 12.5px;
    font-family: ui-monospace, "SF Mono", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace;
    padding: 2px 0;
    display: flex;
    gap: 6px;
  }

  .prop-name {
    color: var(--text);
  }

  .prop-type {
    color: var(--text-sub);
  }

  .card.entity .card-header {
    background: var(--muted);
  }

  .card.value-object .card-header {
    background: var(--card-bg);
  }
  .card.value-object .badge {
    background: transparent;
  }

  .theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--card-bg);
    color: var(--text);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    z-index: 10;
  }
  .theme-toggle:hover {
    background: var(--muted);
  }
  .theme-toggle:focus-visible {
    outline: 2px solid var(--text-sub);
    outline-offset: 2px;
  }
  .theme-toggle svg {
    width: 16px;
    height: 16px;
  }
  .theme-toggle .sun { display: none; }
  .theme-toggle .moon { display: block; }
  :root[data-theme="dark"] .theme-toggle .sun { display: block; }
  :root[data-theme="dark"] .theme-toggle .moon { display: none; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .theme-toggle .sun { display: block; }
    :root:not([data-theme="light"]) .theme-toggle .moon { display: none; }
  }`;

const INIT_SCRIPT = `(function(){
  try {
    var s = localStorage.getItem('theme');
    var t = s || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
  window.toggleTheme = function() {
    var cur = document.documentElement.getAttribute('data-theme') || 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  };
})();`;

const TOGGLE_BUTTON =
  `<button class="theme-toggle" type="button" aria-label="Toggle color theme" onclick="toggleTheme()">
<svg class="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
<svg class="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
</button>`;

export function htmlHeader(title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
${CSS}
</style>
<script>${INIT_SCRIPT}</script>
</head>
<body>
${TOGGLE_BUTTON}
`;
}

export function htmlFooter(): string {
  return `
</body>
</html>
`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
