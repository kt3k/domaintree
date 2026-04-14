import type {
  DisplayGroup,
  DomainDocument,
  DomainObject,
  DomainObjectNode,
} from "./types.ts";
import { escapeHtml, htmlFooter, htmlHeader } from "./template.ts";

export function render(doc: DomainDocument): string {
  const stats = collectStats(doc);
  const subtitle = formatSubtitle(stats);

  let html = htmlHeader(doc.title);
  html += `<h1>${escapeHtml(doc.title)}</h1>\n`;
  html += `<div class="subtitle">${subtitle}</div>\n\n`;

  for (const group of doc.groups) {
    if (group.kind === "aggregate") {
      html += renderAggregate(group);
    } else {
      html += renderStandalone(group);
    }
  }

  html += htmlFooter();
  return html;
}

function renderAggregate(group: DisplayGroup): string {
  const root = group.root;
  let html = `<div class="aggregate">\n`;
  html += `  <div class="aggregate-header">\n`;
  html += `    <span class="icon">📦</span>\n`;
  html += `    <span>${escapeHtml(root.object.name)}</span>\n`;
  if (group.description) {
    html += `    <span class="desc">${escapeHtml(group.description)}</span>\n`;
  }
  html += `  </div>\n`;

  // Root card displayed directly (not inside tree lines)
  html += renderCard(root.object, 1);

  if (root.children.length > 0) {
    html += `  <ul class="tree root-tree">\n`;
    for (const child of root.children) {
      html += renderTreeNode(child, 2);
    }
    html += `  </ul>\n`;
  }
  html += `</div>\n\n`;
  return html;
}

function renderStandalone(group: DisplayGroup): string {
  let html = `<div class="standalone">\n`;
  html += renderCard(group.root.object, 1);
  html += `</div>\n\n`;
  return html;
}

function renderTreeNode(
  node: DomainObjectNode,
  indent: number,
  expandChildren = true,
): string {
  const pad = "  ".repeat(indent);
  let html = `${pad}<li class="tree-node">\n`;
  html += renderCard(node.object, indent + 1);

  if (expandChildren && node.children.length > 0) {
    html += `${pad}  <ul class="tree">\n`;
    for (const child of node.children) {
      html += renderTreeNode(child, indent + 2);
    }
    html += `${pad}  </ul>\n`;
  }

  html += `${pad}</li>\n`;
  return html;
}

function renderCard(object: DomainObject, indent: number): string {
  const pad = "  ".repeat(indent);
  const cssClass = getCssClass(object.kind);
  const icon = getIcon(object.kind);
  const badge = getBadgeLabel(object.kind);

  let html = `${pad}<div class="card ${cssClass}">\n`;
  html += `${pad}  <div class="card-header">\n`;
  html += `${pad}    <span>${icon}</span>\n`;
  html += `${pad}    <span>${escapeHtml(object.name)}</span>\n`;
  html += `${pad}    <span class="badge">${badge}</span>\n`;
  html += `${pad}  </div>\n`;

  html += `${pad}  <div class="card-body">\n`;
  if (object.properties) {
    for (const prop of object.properties) {
      html += `${pad}    <div class="prop"><span class="prop-name">${
        escapeHtml(prop.name)
      }:</span> <span class="prop-type">${
        escapeHtml(prop.type)
      }</span></div>\n`;
    }
  }
  html += `${pad}  </div>\n`;

  html += `${pad}</div>\n`;
  return html;
}

function getCssClass(kind: DomainObject["kind"]): string {
  switch (kind) {
    case "entity":
      return "entity";
    case "value_object":
      return "value-object";
  }
}

function getIcon(kind: DomainObject["kind"]): string {
  switch (kind) {
    case "entity":
      return "🔷";
    case "value_object":
      return "💎";
  }
}

function getBadgeLabel(kind: DomainObject["kind"]): string {
  switch (kind) {
    case "entity":
      return "Entity";
    case "value_object":
      return "Value Object";
  }
}

interface Stats {
  aggregates: number;
  entities: number;
  valueObjects: number;
}

function collectStats(doc: DomainDocument): Stats {
  const stats: Stats = { aggregates: 0, entities: 0, valueObjects: 0 };
  for (const group of doc.groups) {
    if (group.kind === "aggregate") {
      stats.aggregates++;
    }
    countObjects(group.root, stats);
  }
  return stats;
}

function countObjects(node: DomainObjectNode, stats: Stats): void {
  switch (node.object.kind) {
    case "entity":
      stats.entities++;
      break;
    case "value_object":
      stats.valueObjects++;
      break;
  }
  for (const child of node.children) {
    countObjects(child, stats);
  }
}

function formatSubtitle(stats: Stats): string {
  const parts: string[] = [];
  if (stats.aggregates > 0) {
    parts.push(
      `${stats.aggregates} Aggregate${stats.aggregates !== 1 ? "s" : ""}`,
    );
  }
  parts.push(`${stats.entities} Entit${stats.entities !== 1 ? "ies" : "y"}`);
  parts.push(
    `${stats.valueObjects} Value Object${stats.valueObjects !== 1 ? "s" : ""}`,
  );
  return parts.join(" &middot; ");
}
