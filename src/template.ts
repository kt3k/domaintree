const CSS = `  :root {
    --bg: #fafafa;
    --text: #1a1a2e;
    --text-sub: #555;
    --border: #d0d0d0;
    --aggregate-bg: #f0f0f5;
    --aggregate-border: #4a4a6a;
    --entity-bg: #e8f0fe;
    --entity-border: #4285f4;
    --entity-accent: #1a73e8;
    --vo-bg: #f0ebf8;
    --vo-border: #9c7cdb;
    --vo-accent: #7c4dff;
    --tree-line: #b0b0b0;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1a1a2e;
      --text: #e0e0e8;
      --text-sub: #a0a0b0;
      --border: #3a3a4e;
      --aggregate-bg: #22223a;
      --aggregate-border: #8888aa;
      --entity-bg: #1c2a44;
      --entity-border: #5a9cf5;
      --entity-accent: #7ab4ff;
      --vo-bg: #2a2040;
      --vo-border: #a88ce0;
      --vo-accent: #c4a6ff;
      --tree-line: #555568;
    }
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    padding: 40px;
    line-height: 1.6;
  }

  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .subtitle {
    color: var(--text-sub);
    font-size: 14px;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--border);
  }

  .aggregate {
    margin-bottom: 48px;
  }

  .aggregate-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--aggregate-bg);
    border: 2px solid var(--aggregate-border);
    border-radius: 8px;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .aggregate-header .icon {
    font-size: 22px;
  }

  .aggregate-header .desc {
    font-weight: 400;
    font-size: 14px;
    color: var(--text-sub);
    margin-left: 8px;
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
    border-left: 2px solid var(--tree-line);
    padding: 8px 0 0 18px;
    margin-left: -20px;
  }

  .tree-node:last-child {
    border-left: 2px solid transparent;
  }

  .tree-node::before {
    content: "";
    position: absolute;
    left: -2px;
    top: 24px;
    width: 20px;
    height: 2px;
    background: var(--tree-line);
  }

  .tree-node:last-child::after {
    content: "";
    position: absolute;
    left: -2px;
    top: 0;
    height: 26px;
    width: 2px;
    background: var(--tree-line);
  }

  .card {
    border: 2px solid var(--border);
    border-radius: 6px;
    margin: 0;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    font-weight: 600;
    font-size: 15px;
  }

  .card-header .badge {
    font-size: 11px;
    font-weight: 500;
    padding: 1px 8px;
    border-radius: 10px;
    opacity: 0.9;
  }

  .card-body {
    padding: 8px 14px 10px;
    border-top: 1px solid var(--border);
  }

  .prop {
    font-size: 13px;
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
    padding: 2px 0;
    display: flex;
    gap: 4px;
  }

  .prop-name {
    color: var(--text);
  }

  .prop-type {
    color: var(--text-sub);
  }

  .card.entity {
    border-color: var(--entity-border);
  }
  .card.entity .card-header {
    background: var(--entity-bg);
    color: var(--entity-accent);
  }
  .card.entity .badge {
    background: var(--entity-accent);
    color: #fff;
  }

  .card.value-object {
    border-color: var(--vo-border);
  }
  .card.value-object .card-header {
    background: var(--vo-bg);
    color: var(--vo-accent);
  }
  .card.value-object .badge {
    background: var(--vo-accent);
    color: #fff;
  }`;

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
</head>
<body>
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
