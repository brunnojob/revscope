const grid = document.querySelector("#tool-grid");
const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const platformSelect = document.querySelector("#platform");
const sortSelect = document.querySelector("#sort");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty-state");
const workflowBanner = document.querySelector("#active-workflow");
const savedButton = document.querySelector("#saved-filter");
const compareBar = document.querySelector("#compare-bar");
const workflowRules = {
  triage: { title: "Binary triage", tools: ["die", "capa", "floss", "ghidra"] },
  android: { title: "Android app analysis", tools: ["apktool", "jadx", "frida", "mobsf"] },
  network: { title: "Network behavior", tools: ["wireshark", "mitmproxy", "burp-community", "frida"] },
  firmware: { title: "Firmware lab", tools: ["binwalk", "ghidra", "openocd", "qemu"] }
};
const levelRank = { Beginner: 1, Intermediate: 2, Advanced: 3 };
const storedSaved = readStored("revscope-saved", []);
const saved = new Set(Array.isArray(storedSaved) ? storedSaved.filter(id => typeof id === "string") : []);
const comparing = new Set();
let tools = [];
let quickFilter = "all";
let activeWorkflow = "";
let onlySaved = false;
let catalogFailed = false;
function localizedTool(tool) {
  return { ...tool, category: t(tool.category), summary: t(tool.summary), bestFor: t(tool.bestFor),
    tags: tool.tags.map(t), level: t(tool.level), cost: t(tool.cost), license: t(tool.license) };
}
function normalize(value) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

function safe(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function populateCategories() {
  const selected = categorySelect.value;
  categorySelect.replaceChildren(new Option(t("All categories"), ""));
  [...new Set(tools.map(tool => tool.category))].sort((a,b) => t(a).localeCompare(t(b), language)).forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = t(category);
    categorySelect.append(option);
  });
  categorySelect.value = selected;
}
function filteredTools() {
  const query = normalize(searchInput.value.trim());
  let result = tools.filter(tool => {
    const local = localizedTool(tool);
    const translated = [tool.category, tool.summary, tool.bestFor, tool.level, tool.cost, ...tool.tags].map(value => portuguese[value] ?? value);
    const haystack = normalize([tool.name, tool.category, tool.platform, tool.license, tool.summary, tool.bestFor, tool.level, tool.cost, ...tool.tags, local.category, local.summary, local.bestFor, local.level, local.cost, ...local.tags, ...translated].join(" "));
    return (!query || haystack.includes(query))
      && (!categorySelect.value || tool.category === categorySelect.value)
      && (!platformSelect.value || tool.platform.includes(platformSelect.value))
      && (quickFilter === "all" || tool.tags.includes(quickFilter) || tool.level === quickFilter)
      && (!onlySaved || saved.has(tool.id))
      && (!activeWorkflow || workflowRules[activeWorkflow].tools.includes(tool.id));
  });
  if (sortSelect.value === "category") result.sort((a, b) => t(a.category).localeCompare(t(b.category), language) || a.name.localeCompare(b.name));
  else if (sortSelect.value === "level") result.sort((a, b) => levelRank[a.level] - levelRank[b.level] || a.name.localeCompare(b.name));
  else result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
function render() {
  empty.querySelector("h3").textContent = t(catalogFailed ? "Catalog could not load" : "No tools found");
  empty.querySelector("p").textContent = t(catalogFailed ? "Open this site through GitHub Pages or a local web server." : "Try a different search or clear a filter.");
  if (catalogFailed) { count.textContent = "—"; grid.hidden = true; empty.hidden = false; return; }
  const result = filteredTools().map(localizedTool);
  count.textContent = String(result.length).padStart(2, "0");
  document.querySelector("#hero-count").textContent = tools.length;
  empty.hidden = result.length !== 0;
  grid.hidden = result.length === 0;
  grid.innerHTML = result.map(tool => `
    <article class="tool-card">
      <div class="card-top"><span class="category-label">${safe(tool.category)}</span><button class="save-button ${saved.has(tool.id) ? "saved" : ""}" data-save="${safe(tool.id)}" aria-label="${t(saved.has(tool.id) ? "Remove" : "Save")} ${safe(tool.name)}" aria-pressed="${saved.has(tool.id)}">${saved.has(tool.id) ? "★" : "☆"}</button></div>
      <h3>${safe(tool.name)}</h3><p>${safe(tool.summary)}</p>
      <div class="best-for"><span>${t("Useful for")}</span>${safe(tool.bestFor)}</div>
      <div class="tag-row">${tool.tags.map(tag => `<span class="tag">${safe(tag)}</span>`).join("")}<span class="tag">${safe(tool.level)}</span></div>
      <div class="card-bottom"><div class="tool-links"><a href="${safe(tool.url)}" target="_blank" rel="noopener noreferrer">${t("Official site ↗")}</a><a href="${safe(tool.docs)}" target="_blank" rel="noopener noreferrer">${t("Docs ↗")}</a></div><label class="compare-check"><input type="checkbox" data-compare="${safe(tool.id)}" ${comparing.has(tool.id) ? "checked" : ""}> ${t("Compare")}</label></div>
    </article>`).join("");
  updateCompareBar();
}
function updateCompareBar() {
  document.querySelector("#compare-count").textContent = comparing.size;
  compareBar.hidden = comparing.size === 0;
  document.querySelector("#compare-now").disabled = comparing.size < 2;
}
function setWorkflow(id) {
  activeWorkflow = id;
  document.querySelectorAll(".workflow-card").forEach(button => button.classList.toggle("selected", button.dataset.workflow === id));
  workflowBanner.hidden = !id;
  renderWorkflow();
  render();
  if (id) document.querySelector("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderWorkflow() {
  const id = activeWorkflow;
  workflowBanner.innerHTML = id ? `<span><b>${safe(t(workflowRules[id].title))}</b> · ${t("curated starter set")}</span><button id="clear-workflow">${t("Clear workflow ×")}</button>` : "";
}
function showComparison() {
  const selected = tools.filter(tool => comparing.has(tool.id)).map(localizedTool);
  if (selected.length < 2) return;
  const fields = [["Category", "category"], ["Best for", "bestFor"], ["Platform", "platform"], ["License", "license"], ["Cost", "cost"], ["Learning curve", "level"]];
  document.querySelector("#comparison-content").innerHTML = `<div style="overflow:auto"><table class="compare-table"><thead><tr><th>${t("Field")}</th>${selected.map(tool => `<th>${safe(tool.name)}</th>`).join("")}</tr></thead><tbody>${fields.map(([label, key]) => `<tr><th>${safe(t(label))}</th>${selected.map(tool => `<td>${safe(tool[key])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  if (!document.querySelector("#compare-dialog").open) document.querySelector("#compare-dialog").showModal();
}

document.addEventListener("input", event => { if (event.target === searchInput) render(); });
document.addEventListener("change", event => {
  if (event.target.id === "language") {
    language = event.target.value;
    writeStored("revscope-language", language);
    translatePage(); populateCategories(); renderWorkflow(); render();
    if (document.querySelector("#compare-dialog").open) showComparison();
  }
  if ([categorySelect, platformSelect, sortSelect].includes(event.target)) render();
  if (event.target.matches("[data-compare]")) {
    if (event.target.checked && comparing.size >= 3) { event.target.checked = false; return; }
    event.target.checked ? comparing.add(event.target.dataset.compare) : comparing.delete(event.target.dataset.compare);
    updateCompareBar();
  }
});
document.addEventListener("click", event => {
  const saveButton = event.target.closest("[data-save]");
  if (saveButton) {
    const id = saveButton.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    writeStored("revscope-saved", JSON.stringify([...saved]));
    render();
  }
  const filterButton = event.target.closest("[data-quick]");
  if (filterButton) {
    quickFilter = filterButton.dataset.quick;
    document.querySelectorAll("[data-quick]").forEach(button => button.classList.toggle("active", button === filterButton));
    render();
  }
  const workflowButton = event.target.closest("[data-workflow]");
  if (workflowButton) setWorkflow(activeWorkflow === workflowButton.dataset.workflow ? "" : workflowButton.dataset.workflow);
  if (event.target.id === "clear-workflow") setWorkflow("");
  if (event.target.id === "saved-filter" || event.target.closest("#saved-filter")) {
    onlySaved = !onlySaved;
    savedButton.setAttribute("aria-pressed", String(onlySaved));
    render();
  }
  if (event.target.id === "clear-filters") {
    searchInput.value = ""; categorySelect.value = ""; platformSelect.value = ""; sortSelect.value = "name"; quickFilter = "all"; onlySaved = false;
    savedButton.setAttribute("aria-pressed", "false");
    document.querySelectorAll("[data-quick]").forEach(button => button.classList.toggle("active", button.dataset.quick === "all"));
    setWorkflow(""); render();
  }
  if (event.target.id === "clear-compare") { comparing.clear(); render(); }
  if (event.target.id === "compare-now") showComparison();
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) { event.preventDefault(); searchInput.focus(); }
  if (event.key === "Escape" && document.querySelector("#compare-dialog").open) document.querySelector("#compare-dialog").close();
});

fetch("data/tools.json")
  .then(response => { if (!response.ok) throw new Error("Could not load tool catalog"); return response.json(); })
  .then(data => { tools = data; populateCategories(); render(); })
  .catch(() => { catalogFailed = true; render(); });
