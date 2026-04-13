import type {
  DisplayGroup,
  DomainDocument,
  Model,
  ModelNode,
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
  html += `    <span>${escapeHtml(root.model.name)}</span>\n`;
  if (group.description) {
    html += `    <span class="desc">${escapeHtml(group.description)}</span>\n`;
  }
  html += `  </div>\n`;

  html += `  <ul class="tree">\n`;
  // Render root as first child node (without expanding its children here)
  html += renderTreeNode(root, 2, false);
  // Render root's children as sibling nodes
  for (const child of root.children) {
    html += renderTreeNode(child, 2);
  }
  html += `  </ul>\n`;
  html += `</div>\n\n`;
  return html;
}

function renderStandalone(group: DisplayGroup): string {
  let html = `<div class="standalone">\n`;
  html += renderCard(group.root.model, 1);
  html += `</div>\n\n`;
  return html;
}

function renderTreeNode(
  node: ModelNode,
  indent: number,
  expandChildren = true,
): string {
  const pad = "  ".repeat(indent);
  let html = `${pad}<li class="tree-node">\n`;
  html += renderCard(node.model, indent + 1);

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

function renderCard(model: Model, indent: number): string {
  const pad = "  ".repeat(indent);
  const cssClass = getCssClass(model.type);
  const icon = getIcon(model.type);
  const badge = getBadgeLabel(model.type);

  let html = `${pad}<div class="card ${cssClass}">\n`;
  html += `${pad}  <div class="card-header">\n`;
  html += `${pad}    <span>${icon}</span>\n`;
  html += `${pad}    <span>${escapeHtml(model.name)}</span>\n`;
  html += `${pad}    <span class="badge">${badge}</span>\n`;
  html += `${pad}  </div>\n`;

  html += `${pad}  <div class="card-body">\n`;
  if (model.properties) {
    for (const prop of model.properties) {
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

function getCssClass(type: Model["type"]): string {
  switch (type) {
    case "entity":
      return "entity";
    case "value_object":
      return "value-object";
  }
}

function getIcon(type: Model["type"]): string {
  switch (type) {
    case "entity":
      return "🔷";
    case "value_object":
      return "💎";
  }
}

function getBadgeLabel(type: Model["type"]): string {
  switch (type) {
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
    countModels(group.root, stats);
  }
  return stats;
}

function countModels(node: ModelNode, stats: Stats): void {
  switch (node.model.type) {
    case "entity":
      stats.entities++;
      break;
    case "value_object":
      stats.valueObjects++;
      break;
  }
  for (const child of node.children) {
    countModels(child, stats);
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
