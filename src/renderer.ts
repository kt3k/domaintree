import type {
  DomainDocument,
  DomainObject,
  DomainObjectNode,
} from "./types.ts";
import { escapeHtml, htmlFooter, htmlHeader } from "./template.ts";

const SVG_ATTRS =
  `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const ENTITY_ICON =
  `<svg class="icon" data-icon="entity" ${SVG_ATTRS}><path d="M6.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3"/></svg>`;

const VALUE_OBJECT_ICON =
  `<svg class="icon" data-icon="value-object" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 3.34a10 10 0 1 1 -4.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 4.995 -8.336z"/></svg>`;

const KIND_META: Record<
  DomainObject["kind"],
  { cssClass: string; icon: string; badge: string }
> = {
  entity: { cssClass: "entity", icon: ENTITY_ICON, badge: "Entity" },
  value_object: {
    cssClass: "value-object",
    icon: VALUE_OBJECT_ICON,
    badge: "Value Object",
  },
};

export function render(doc: DomainDocument): string {
  const stats = collectStats(doc);
  const subtitle = formatSubtitle(stats);

  let html = htmlHeader(doc.title);
  html += `<h1>${escapeHtml(doc.title)}</h1>\n`;
  html += `<div class="subtitle">${subtitle}</div>\n\n`;

  for (const root of doc.roots) {
    if (root.children.length > 0) {
      html += renderAggregate(root);
    } else {
      html += renderStandalone(root);
    }
  }

  html += htmlFooter();
  return html;
}

function renderAggregate(root: DomainObjectNode): string {
  let html = `<div class="aggregate">\n`;
  html += `  <div class="aggregate-header">\n`;
  html += `    <span>${escapeHtml(root.object.name)}</span>\n`;
  if (root.object.description) {
    html += `    <span class="desc">${
      escapeHtml(root.object.description)
    }</span>\n`;
  }
  html += `  </div>\n`;

  html += renderCard(root.object, 1);

  html += `  <ul class="tree root-tree">\n`;
  for (const child of root.children) {
    html += renderTreeNode(child, 2);
  }
  html += `  </ul>\n`;
  html += `</div>\n\n`;
  return html;
}

function renderStandalone(node: DomainObjectNode): string {
  let html = `<div class="standalone">\n`;
  html += renderCard(node.object, 1);
  html += `</div>\n\n`;
  return html;
}

function renderTreeNode(node: DomainObjectNode, indent: number): string {
  const pad = "  ".repeat(indent);
  let html = `${pad}<li class="tree-node">\n`;
  html += renderCard(node.object, indent + 1);

  if (node.children.length > 0) {
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
  const meta = KIND_META[object.kind];

  let html = `${pad}<div class="card ${meta.cssClass}">\n`;
  html += `${pad}  <div class="card-header">\n`;
  html += `${pad}    ${meta.icon}\n`;
  html += `${pad}    <span>${escapeHtml(object.name)}</span>\n`;
  html += `${pad}    <span class="badge">${meta.badge}</span>\n`;
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

interface Stats {
  aggregates: number;
  entities: number;
  valueObjects: number;
}

function collectStats(doc: DomainDocument): Stats {
  const stats: Stats = { aggregates: 0, entities: 0, valueObjects: 0 };
  for (const root of doc.roots) {
    if (root.children.length > 0) stats.aggregates++;
    countObjects(root, stats);
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

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function formatSubtitle(stats: Stats): string {
  const parts: string[] = [];
  if (stats.aggregates > 0) {
    parts.push(pluralize(stats.aggregates, "Aggregate", "Aggregates"));
  }
  parts.push(pluralize(stats.entities, "Entity", "Entities"));
  parts.push(pluralize(stats.valueObjects, "Value Object", "Value Objects"));
  return parts.join(" &middot; ");
}
