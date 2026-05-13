const STORAGE_PREFIX = "legal-memory-workbench:";
const today = () => new Date().toISOString().slice(0, 10);

const riskLabels = {
  privacyData: "Privacy and data",
  employmentContractorsVolunteers: "Employment, contractors and volunteers",
  consumerLaw: "Consumer law",
  safetyWhs: "Safety and WHS",
  insurance: "Insurance",
  permitsLicences: "Permits and licences",
  planningBuildingEnvironment: "Planning, building and environment",
  childrenVulnerablePeople: "Children and vulnerable people",
  discriminationAccessibility: "Discrimination and accessibility",
  copyrightMedia: "Copyright and media",
  defamationReputation: "Defamation and reputation",
  financialTax: "Financial and tax",
  governanceConflicts: "Governance and conflicts of interest",
  evidenceDocumentation: "Evidence and documentation gaps",
};

const docConfigs = {
  "legal-memory-profile": {
    page: "start",
    filename: "legal-memory-starter.md",
    title: "Legal Memory Starter",
    type: "legal-memory-starter",
    generate: generateProfile,
  },
  "life-map": {
    page: "life-map",
    filename: "life-map.md",
    title: "Life Map",
    type: "life-map",
    generate: generateLifeMap,
  },
  "jurisdiction-map": {
    page: "jurisdiction-map",
    filename: "jurisdiction-map.md",
    title: "Jurisdiction Map",
    type: "jurisdiction-map",
    generate: generateJurisdictionMap,
  },
  "legal-sources": {
    page: "legal-sources",
    filename: "legal-sources.md",
    title: "Legal Sources",
    type: "legal-sources",
    generate: generateLegalSources,
  },
  "project-map": {
    page: "project-map",
    filename: "project-map.md",
    title: "Project Map",
    type: "project-map",
    generate: generateProjectMap,
  },
  "risk-map": {
    page: "risk-map",
    filename: "risk-map.md",
    title: "Risk Map",
    type: "risk-map",
    generate: generateRiskMap,
  },
  "evidence-checklist": {
    page: "risk-map",
    filename: "evidence-checklist.md",
    title: "Evidence Checklist",
    type: "evidence-checklist",
    generate: generateEvidenceChecklist,
  },
  "agent-instructions": {
    page: "agent-instructions",
    filename: "agent-instructions.md",
    title: "Agent Instructions",
    type: "agent-instructions",
    generate: generateAgentInstructions,
  },
};

const pageDocs = {
  start: ["legal-memory-profile"],
  "life-map": ["life-map"],
  "jurisdiction-map": ["jurisdiction-map"],
  "legal-sources": ["legal-sources"],
  "project-map": ["project-map"],
  "risk-map": ["risk-map", "evidence-checklist"],
  "agent-instructions": ["agent-instructions"],
};

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initWorksheet();
  initExportPage();
});

function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector("#nav-links");
  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initWorksheet() {
  const form = document.querySelector("[data-worksheet-form]");
  if (!form) return;

  const pageKey = document.body.dataset.page;
  const saved = readStored(pageKey);
  setupRepeatables(form, saved);
  restoreForm(form, saved);
  renderPreviews(form);

  form.addEventListener("input", () => {
    saveForm(form, true);
    renderPreviews(form);
  });

  form.addEventListener("change", () => {
    saveForm(form, true);
    renderPreviews(form);
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button, form));
  });
}

function setupRepeatables(form, saved) {
  form.querySelectorAll("[data-repeat-list]").forEach((list) => {
    const name = list.dataset.repeatList;
    list.innerHTML = "";
    const items = Array.isArray(saved[name]) && saved[name].length ? saved[name] : [{}];
    items.forEach((item) => addRepeatItem(form, name, item));
  });

  form.querySelectorAll("[data-add-repeat]").forEach((button) => {
    button.addEventListener("click", () => {
      addRepeatItem(form, button.dataset.addRepeat, {});
      saveForm(form, true);
      renderPreviews(form);
    });
  });
}

function addRepeatItem(form, name, values) {
  const template = document.querySelector(`#${name}-template`);
  const list = form.querySelector(`[data-repeat-list="${name}"]`);
  if (!template || !list) return;

  const fragment = template.content.cloneNode(true);
  const item = fragment.querySelector("[data-repeat-item]");
  item.querySelectorAll("[name]").forEach((field) => {
    field.value = values[field.name] || "";
  });

  const removeButton = item.querySelector("[data-remove-repeat]");
  if (removeButton) {
    removeButton.addEventListener("click", () => {
      item.remove();
      if (!list.querySelector("[data-repeat-item]")) {
        addRepeatItem(form, name, {});
      }
      saveForm(form, true);
      renderPreviews(form);
    });
  }

  list.appendChild(fragment);
}

function restoreForm(form, data) {
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (!field.name || field.closest("[data-repeat-item]")) return;

    if (field.type === "checkbox") {
      field.checked = Array.isArray(data[field.name]) && data[field.name].includes(field.value);
      return;
    }

    if (field.type === "radio") {
      field.checked = data[field.name] === field.value;
      return;
    }

    field.value = data[field.name] || "";
  });
}

function collectForm(form) {
  const data = {};

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (!field.name || field.closest("[data-repeat-item]")) return;

    if (field.type === "checkbox") {
      if (!Array.isArray(data[field.name])) data[field.name] = [];
      if (field.checked) data[field.name].push(field.value);
      return;
    }

    if (field.type === "radio") {
      if (field.checked) data[field.name] = field.value;
      return;
    }

    data[field.name] = field.value.trim();
  });

  form.querySelectorAll("[data-repeat-list]").forEach((list) => {
    const name = list.dataset.repeatList;
    data[name] = Array.from(list.querySelectorAll("[data-repeat-item]"))
      .map((item) => {
        const entry = {};
        item.querySelectorAll("input, select, textarea").forEach((field) => {
          if (field.name) entry[field.name] = field.value.trim();
        });
        return entry;
      })
      .filter((entry) => Object.values(entry).some(Boolean));
  });

  return data;
}

function saveForm(form, silent = false) {
  const pageKey = document.body.dataset.page;
  const previous = readStored(pageKey);
  const data = collectForm(form);
  data._created = previous._created || today();
  data._updated = today();
  localStorage.setItem(STORAGE_PREFIX + pageKey, JSON.stringify(data));
  if (!silent) setStatus("Saved in this browser.");
  return data;
}

function readStored(pageKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + pageKey);
    if (!raw) return { _created: today(), _updated: today() };
    return { _created: today(), _updated: today(), ...JSON.parse(raw) };
  } catch {
    return { _created: today(), _updated: today() };
  }
}

function renderPreviews(form) {
  const data = { ...readStored(document.body.dataset.page), ...collectForm(form) };
  getCurrentDocIds().forEach((docId) => {
    const target = document.querySelector(`[data-preview-doc="${docId}"]`);
    if (target) target.textContent = generateDoc(docId, data);
  });
}

function getCurrentDocIds() {
  const explicit = document.body.dataset.docs;
  if (explicit) return explicit.split(",").map((item) => item.trim());
  return pageDocs[document.body.dataset.page] || [];
}

async function handleAction(button, form) {
  const action = button.dataset.action;
  const targetDoc = button.dataset.docId || getCurrentDocIds()[0];

  if (action === "save") {
    saveForm(form);
    renderPreviews(form);
    return;
  }

  if (action === "clear") {
    const pageKey = document.body.dataset.page;
    localStorage.removeItem(STORAGE_PREFIX + pageKey);
    form.reset();
    setupRepeatables(form, {});
    restoreForm(form, {});
    renderPreviews(form);
    setStatus("This form has been cleared.");
    return;
  }

  const data = saveForm(form, true);
  const markdown = targetDoc === "all-current"
    ? getCurrentDocIds().map((docId) => generateDoc(docId, data)).join("\n\n---\n\n")
    : generateDoc(targetDoc, data);

  if (action === "copy") {
    await copyText(markdown);
    setStatus("Markdown copied.");
  }

  if (action === "download") {
    downloadMarkdown(docConfigs[targetDoc]?.filename || "legal-memory.md", markdown);
    setStatus("Markdown download started.");
  }
}

function initExportPage() {
  const exportRoot = document.querySelector("[data-export-root]");
  if (!exportRoot) return;

  renderExportDocs(exportRoot);

  document.querySelector("[data-export-copy-all]")?.addEventListener("click", async () => {
    await copyText(buildBundleMarkdown());
    setStatus("All markdown copied.");
  });

  document.querySelector("[data-export-download-all]")?.addEventListener("click", () => {
    downloadMarkdown("legal-memory-bundle.md", buildBundleMarkdown());
    setStatus("Combined bundle download started.");
  });

  document.querySelector("[data-export-clear-all]")?.addEventListener("click", () => {
    Object.keys(pageDocs).forEach((pageKey) => localStorage.removeItem(STORAGE_PREFIX + pageKey));
    renderExportDocs(exportRoot);
    setStatus("All local Legal Memory Workbench data has been cleared.");
  });

  document.querySelector("[data-export-print]")?.addEventListener("click", () => window.print());
}

function renderExportDocs(exportRoot) {
  exportRoot.innerHTML = "";
  Object.entries(docConfigs).forEach(([docId, config]) => {
    const data = readStored(config.page);
    const markdown = generateDoc(docId, data);
    const article = document.createElement("article");
    article.className = "export-doc";
    article.innerHTML = `
      <h2>${escapeHtml(config.filename)}</h2>
      <pre class="markdown-preview"><code>${escapeHtml(markdown)}</code></pre>
      <div class="action-row">
        <button class="button ghost small" type="button" data-copy-one="${docId}">Copy</button>
        <button class="button ghost small" type="button" data-download-one="${docId}">Download .md</button>
      </div>
    `;
    article.querySelector("[data-copy-one]").addEventListener("click", async () => {
      await copyText(markdown);
      setStatus(`${config.filename} copied.`);
    });
    article.querySelector("[data-download-one]").addEventListener("click", () => {
      downloadMarkdown(config.filename, markdown);
      setStatus(`${config.filename} download started.`);
    });
    exportRoot.appendChild(article);
  });
}

function buildBundleMarkdown() {
  const intro = `# Legal Memory Bundle\n\nGenerated by Legal Memory Workbench on ${today()}.\n\nThis bundle is for legal information preparation only. It is not legal advice.`;
  const docs = Object.keys(docConfigs).map((docId) => {
    const config = docConfigs[docId];
    return `# ${config.filename}\n\n${generateDoc(docId, readStored(config.page))}`;
  });
  return [intro, ...docs].join("\n\n---\n\n");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
}

function downloadMarkdown(filename, markdown) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function setStatus(message) {
  document.querySelectorAll("[data-status]").forEach((status) => {
    status.textContent = message;
  });
}

function generateDoc(docId, data) {
  const config = docConfigs[docId];
  if (!config) return "";
  return config.generate(data, config);
}

function frontmatter(data, config, extra = {}) {
  const jurisdiction = extra.jurisdiction || data.stateTerritory || data.jurisdictionFocus || "not set";
  const privacy = data.privacyLevel || data.privacy || "not set";
  const confidence = extra.confidence || "user supplied";
  return `---\ntitle: "${yaml(config.title)}"\ntype: "${yaml(config.type)}"\nstatus: draft\ncreated: ${data._created || today()}\nupdated: ${data._updated || today()}\njurisdiction: "${yaml(jurisdiction)}"\nprivacy: "${yaml(privacy)}"\nconfidence: "${yaml(confidence)}"\n---\n\n`;
}

function generateProfile(data, config) {
  const jurisdiction = [data.country, data.stateTerritory, data.localCouncil].filter(Boolean).join(" / ") || "not set";
  return frontmatter(data, config, { jurisdiction }) +
`# Legal Memory Starter

## Start Small

This file starts with one document, clause, source clue, situation or concern. It is not a total-life legal map.

## The Thing I Am Trying To Understand

${fill(data.focusSubject)}

## Fine Print, Wording Or Situation

${fill(data.finePrint)}

## My Current Understanding

${fill(data.currentUnderstanding)}

## I Want More Clarity Or Awareness About

${fill(data.clarityWanted)}

## Scope

- **Breadth:** ${fill(data.issueScope)}
- **Optional use lane:** ${fill(data.purpose)}
- **First AI help wanted:** ${fill(data.firstAiHelp)}

## Optional Context

- **Name or alias:** ${fill(data.visitorName)}
- **Country:** ${fill(data.country)}
- **State or territory:** ${fill(data.stateTerritory)}
- **Council or local government area:** ${fill(data.localCouncil)}
- **Privacy level:** ${fill(data.privacyLevel)}

## Use Boundary

This file helps an AI legal information assistant understand the user's starting point. It asks for plain-English mapping, source clues, missing facts and next questions. It does not ask the assistant to provide legal advice.

## Notes

- Use official sources where possible.
- Ask for missing facts before answering.
- Keep the scope narrow unless the user chooses to expand it.
- Treat this note as private unless the privacy level says otherwise.
`;
}

function generateLifeMap(data, config) {
  return frontmatter(data, config) +
`# Life Map

## Housing

${fill(data.housingSituation)}

## Work And Income

${fill(data.workIncome)}

## Business Or Side Hustle

${fill(data.businessSideHustle)}

## Vehicles, Boats Or Drones

${fill(data.vehiclesBoatsDrones)}

## Pets Or Animals

${fill(data.petsAnimals)}

## Health, Disability Or Care Responsibilities

${fill(data.healthCare)}

## Children Or Family Responsibilities

${fill(data.familyResponsibilities)}

## Land, Property, Garden Or Building Works

${fill(data.propertyWorks)}

## Digital Life

${fill(data.digitalLife)}

## Memberships And Volunteer Roles

${fill(data.memberships)}

## Things You Keep Wondering About

${repeatList(data.questions, "questionText")}
`;
}

function generateJurisdictionMap(data, config) {
  return frontmatter(data, config) +
`# Rule Layer Map

## National Rule Clues

${fill(data.federalLaws)}

## State Or Territory Rule Clues

${fill(data.stateLaws)}

## Local Council Rule Clues

${fill(data.localLaws)}

## Agencies, Regulators Or Departments To Search

${fill(data.industryRegulators)}

## Help, Complaint Or Review Paths To Search

${fill(data.complaintBodies)}

## Courts Or Tribunals Mentioned Anywhere

${fill(data.courtsTribunals)}

## Confusing Words, Rules Or Agencies

${fill(data.uncertaintyNotes)}

## Starter Examples For Australia

- Federal: privacy, employment, corporations, consumer law, tax and migration.
- State or territory: WHS, tenancy, planning, environment and anti-discrimination.
- Local: local laws, planning schemes, permits, public spaces, animals and noise.

## Beginner Boundary

This file does not assume the user knows which law applies. It records clues so an AI agent can help map the current rule layer and suggest safer next searches.
`;
}

function generateLegalSources(data, config) {
  const sources = Array.isArray(data.sources) ? data.sources : [];
  const rows = sources.length
    ? sources.map((source, index) => `### Source ${index + 1}: ${fill(source.sourceName, "Unnamed source clue")}

- **Place or rule layer:** ${fill(source.sourceJurisdiction)}
- **URL or location:** ${fill(source.sourceUrl)}
- **What kind of thing it looks like:** ${fill(source.documentType)}
- **Date checked:** ${fill(source.asAtDate)}
- **How official it seems:** ${fill(source.reliability)}

**What clue it gave**

${fill(source.whyMatter)}
`).join("\n")
    : "_No sources listed yet._";

  return frontmatter(data, config, { jurisdiction: "listed per source" }) +
`# Source Trail

This file is a trail of clues. Some entries may be official sources. Some may be plain-English explainers, letters, forms, search results or pages that pointed toward a better source. Check official sources before relying on anything.

${rows}
`;
}

function generateProjectMap(data, config) {
  return frontmatter(data, config) +
`# Project Map

## Project Name

${fill(data.projectName)}

## Project Summary

${fill(data.projectSummary)}

## Who Is Involved

${fill(data.involvedPeople)}

## Where It Happens

${fill(data.projectLocation)}

## Activities

${fill(data.activities)}

## Assets And Equipment

${fill(data.assetsEquipment)}

## Money, Payments Or Volunteers

${fill(data.moneyVolunteers)}

## Public Interaction

${fill(data.publicInteraction)}

## Data Collected

${fill(data.dataCollected)}

## Permits Or Approvals Suspected

${fill(data.permitsApprovals)}

## Known Constraints

${fill(data.knownConstraints)}

## Desired Outcome

${fill(data.desiredOutcome)}
`;
}

function generateRiskMap(data, config) {
  const selected = Array.isArray(data.riskCategories) ? data.riskCategories : [];
  const riskSections = selected.length
    ? selected.map((key) => `### ${riskLabels[key] || key}\n\n${fill(data[`note_${key}`])}`).join("\n\n")
    : "_No risk categories selected yet._";

  return frontmatter(data, config) +
`# Rule Friction Map

## Areas Where Rules Might Appear

${riskSections}

## Plain Notes About What Feels Uncertain

${fill(data.generalRiskNotes)}

## Beginner Boundary

This map helps identify clues, documents, source links and next questions. It is not a legal risk assessment.
`;
}

function generateEvidenceChecklist(data, config) {
  const selected = Array.isArray(data.riskCategories) ? data.riskCategories : [];
  const items = selected.length
    ? selected.map((key) => `- [ ] Gather plain facts, dates, screenshots, documents, source links and questions for ${riskLabels[key] || key}.`).join("\n")
    : "- [ ] List the facts, dates, documents, screenshots, source links and questions that may matter.";

  return frontmatter(data, config) +
`# Evidence Checklist

## Core Checks

- [ ] Save links or copies of any pages, letters, forms or policies that seem relevant.
- [ ] Record the date each source was checked.
- [ ] Keep facts separate from guesses, fears or assumptions.
- [ ] Note who said what, when, and where documents came from.
- [ ] Mark anything that feels high-risk or confusing.

## Risk-Specific Evidence

${items}

## Known Evidence Gaps

${fill(data.evidenceGaps)}

## Questions To Investigate Next

${fill(data.escalationQuestions)}
`;
}

function generateAgentInstructions(data, config) {
  return frontmatter(data, config, { jurisdiction: data.jurisdictionFocus }) +
`# Agent Instructions

## Assistant Identity

- **Assistant name:** ${fill(data.assistantName)}
- **Jurisdiction focus:** ${fill(data.jurisdictionFocus)}
- **Source priority:** ${fill(data.sourcePriority)}
- **Response style:** ${fill(data.responseStyle)}
- **Risk tolerance:** ${fill(data.riskTolerance)}
- **Preferred output formats:** ${fill(data.outputFormats)}

## Guardrails

- Provide legal information, not legal advice.
- Ask clarifying questions when facts are missing.
- Cite exact sources and sections where possible.
- Separate confirmed law, likely relevance, uncertainty and next steps.
- Do not invent citations.
- Do not claim a source says something unless it has been retrieved or supplied.
- Recommend professional legal advice for high-risk decisions.
- Preserve user privacy.
- Explain in plain English.
- Provide evidence checklists and next questions for AI follow-up, official sources, help services or legal professionals where needed.

## Topics To Avoid

${fill(data.topicsToAvoid)}

## Escalation Rules

${fill(data.escalationRules)}
`;
}

function repeatList(items, fieldName) {
  if (!Array.isArray(items) || !items.length) return "_Not filled yet._";
  return items.map((item) => `- ${fill(item[fieldName], "Not filled yet.")}`).join("\n");
}

function fill(value, fallback = "Not filled yet.") {
  const clean = typeof value === "string" ? value.trim() : "";
  return clean || `_${fallback}_`;
}

function yaml(value) {
  return String(value || "").replaceAll('"', "'");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
