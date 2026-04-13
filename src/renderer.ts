import type { Aggregate, DomainDocument, DomainModel } from "./types.ts";
import { escapeHtml, htmlFooter, htmlHeader } from "./template.ts";

export function render(doc: DomainDocument): string {
  const stats = collectStats(doc);
  const subtitle = formatSubtitle(stats);

  let html = htmlHeader(doc.title);
  html += `<h1>${escapeHtml(doc.title)}</h1>\n`;
  html += `<div class="subtitle">${subtitle}</div>\n\n`;

  for (const aggregate of doc.aggregates) {
    html += renderAggregate(aggregate);
  }

  html += htmlFooter();
  return html;
}

function renderAggregate(aggregate: Aggregate): string {
  let html = `<div class="aggregate">\n`;
  html += `  <div class="aggregate-header">\n`;
  html += `    <span class="icon">📦</span>\n`;
  html += `    <span>${escapeHtml(aggregate.name)}</span>\n`;
  if (aggregate.description) {
    html += `    <span class="desc">${escapeHtml(aggregate.description)}</span>\n`;
  }
  html += `  </div>\n`;

  html += `  <ul class="tree">\n`;
  // Render root without expanding its children (they are flattened as siblings)
  html += renderTreeNode(aggregate.root, 2, false);
  // Render root's children as sibling nodes at the same level
  if (aggregate.root.children) {
    for (const child of aggregate.root.children) {
      html += renderTreeNode(child, 2);
    }
  }
  html += `  </ul>\n`;
  html += `</div>\n\n`;
  return html;
}

function renderTreeNode(model: DomainModel, indent: number, expandChildren = true): string {
  const pad = "  ".repeat(indent);
  let html = `${pad}<li class="tree-node">\n`;
  html += renderCard(model, indent + 1);

  if (expandChildren && model.children) {
    html += `${pad}  <ul class="tree">\n`;
    for (const child of model.children) {
      html += renderTreeNode(child, indent + 2);
    }
    html += `${pad}  </ul>\n`;
  }

  html += `${pad}</li>\n`;
  return html;
}

function renderCard(model: DomainModel, indent: number): string {
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
  if (model.type === "enum" && model.values) {
    html += `${pad}    <div class="enum-values">\n`;
    for (const value of model.values) {
      html += `${pad}      <span class="enum-value">${escapeHtml(value)}</span>\n`;
    }
    html += `${pad}    </div>\n`;
  } else if (model.properties) {
    for (const prop of model.properties) {
      html += `${pad}    <div class="prop"><span class="prop-name">${escapeHtml(prop.name)}:</span> <span class="prop-type">${escapeHtml(prop.type)}</span></div>\n`;
    }
  }
  html += `${pad}  </div>\n`;

  html += `${pad}</div>\n`;
  return html;
}

function getCssClass(type: DomainModel["type"]): string {
  switch (type) {
    case "entity":
      return "entity";
    case "value_object":
      return "value-object";
    case "enum":
      return "enum";
  }
}

function getIcon(type: DomainModel["type"]): string {
  switch (type) {
    case "entity":
      return "🔷";
    case "value_object":
      return "💎";
    case "enum":
      return "📋";
  }
}

function getBadgeLabel(type: DomainModel["type"]): string {
  switch (type) {
    case "entity":
      return "Entity";
    case "value_object":
      return "Value Object";
    case "enum":
      return "Enum";
  }
}

interface Stats {
  aggregates: number;
  entities: number;
  valueObjects: number;
  enums: number;
}

function collectStats(doc: DomainDocument): Stats {
  const stats: Stats = { aggregates: 0, entities: 0, valueObjects: 0, enums: 0 };
  stats.aggregates = doc.aggregates.length;
  for (const agg of doc.aggregates) {
    countModels(agg.root, stats);
  }
  return stats;
}

function countModels(model: DomainModel, stats: Stats): void {
  switch (model.type) {
    case "entity":
      stats.entities++;
      break;
    case "value_object":
      stats.valueObjects++;
      break;
    case "enum":
      stats.enums++;
      break;
  }
  if (model.children) {
    for (const child of model.children) {
      countModels(child, stats);
    }
  }
}

function formatSubtitle(stats: Stats): string {
  const parts: string[] = [];
  parts.push(`${stats.aggregates} Aggregate${stats.aggregates !== 1 ? "s" : ""}`);
  parts.push(`${stats.entities} Entit${stats.entities !== 1 ? "ies" : "y"}`);
  parts.push(`${stats.valueObjects} Value Object${stats.valueObjects !== 1 ? "s" : ""}`);
  parts.push(`${stats.enums} Enum${stats.enums !== 1 ? "s" : ""}`);
  return parts.join(" &middot; ");
}
