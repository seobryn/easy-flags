// Environments module - handles environment CRUD operations

let editingEnvId = null;

/**
 * Initialize environments module
 */
function initEnvironmentsModule() {
  const envForm = document.getElementById("envModalForm");
  const openCreateBtn = document.getElementById("openCreateEnv");
  const closeBtn = document.getElementById("modalEnvClose");
  const saveBtn = document.getElementById("modalEnvSave");

  if (openCreateBtn) {
    openCreateBtn.onclick = handleOpenCreateEnv;
  }
  if (closeBtn) {
    closeBtn.onclick = handleCloseEnvModal;
  }
  if (envForm) {
    envForm.addEventListener("submit", handleSaveEnvSubmit);
  } else if (saveBtn) {
    saveBtn.onclick = handleSaveEnv;
  }
}

function handleSaveEnvSubmit(event) {
  event.preventDefault();
  return handleSaveEnv();
}

/**
 * Open create environment modal
 */
function handleOpenCreateEnv() {
  editingEnvId = null;
  document.getElementById("envModalTitle").innerText = "Create Environment";
  document.getElementById("envModalName").value = "";
  document.getElementById("envModalMsg").innerText = "";
  const modal = document.getElementById("envModal");
  modal.style.display = "flex";
  // focus the input for faster entry
  setTimeout(() => {
    const inp = document.getElementById("envModalName");
    if (inp) inp.focus();
  }, 50);
}

/**
 * Close environment modal
 */
function handleCloseEnvModal() {
  document.getElementById("envModal").style.display = "none";
}

/**
 * Save environment (create or update)
 */
async function handleSaveEnv() {
  const btn = document.getElementById("modalEnvSave");
  btn.disabled = true;
  const name = document.getElementById("envModalName").value;
  try {
    if (!name) throw new Error("name required");
    if (editingEnvId) {
      await authFetch(api + "/environments/" + editingEnvId, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    } else {
      await authFetch(api + "/environments", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    }
    await loadEnvs();
    document.getElementById("envModal").style.display = "none";
  } catch (err) {
    document.getElementById("envModalMsg").innerText =
      (err && err.message) || "Error";
  } finally {
    btn.disabled = false;
  }
}

/**
 * Load and display environments
 */
async function loadEnvs() {
  const res = await authFetch(api + "/environments");
  window._envs = res;

  // Update dropdown
  const sel = document.getElementById("envSelect");
  if (sel) {
    sel.innerHTML = "";
    res.forEach((e) => {
      const o = document.createElement("option");
      o.value = e.name;
      o.dataset.id = e.id;
      o.innerText = e.name;
      sel.appendChild(o);
    });
    sel.onchange = loadFlags;
  }

  // Update table
  const table = document.getElementById("envsTable");
  if (table) {
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";
    res.forEach((e) => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.style.padding = "12px";
      tdName.innerText = e.name;

      const tdActions = document.createElement("td");
      tdActions.style.padding = "12px";
      tdActions.style.textAlign = "center";

      const editBtn = createEditButton(e);
      const delBtn = createDeleteButton(e);

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);
      tr.appendChild(tdName);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  // Update create feature button state
  const createFeatureBtn = document.getElementById("openCreateFeature");
  if (createFeatureBtn) {
    createFeatureBtn.disabled = !res || res.length === 0;
    createFeatureBtn.title =
      !res || res.length === 0 ? "Create an environment first" : "";
  }
}

/**
 * Create edit button for an environment
 * @param {object} env - The environment object
 * @returns {HTMLElement} The edit button
 */
function createEditButton(env) {
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.title = "Edit";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 21v-3l11-11 3 3L6 21H3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  btn.onclick = () => {
    editingEnvId = env.id;
    document.getElementById("envModalTitle").innerText = "Edit Environment";
    document.getElementById("envModalName").value = env.name;
    document.getElementById("envModalMsg").innerText = "";
    document.getElementById("envModal").style.display = "flex";
  };
  return btn;
}

/**
 * Create delete button for an environment
 * @param {object} env - The environment object
 * @returns {HTMLElement} The delete button
 */
function createDeleteButton(env) {
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.title = "Delete environment";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  btn.onclick = async () => {
    if (!confirm('Delete environment "' + env.name + '"?')) return;
    await authFetch(api + "/environments/" + env.id, { method: "DELETE" });
    await loadEnvs();
    await loadFlags();
  };
  return btn;
}

// Initialize on DOMContentLoaded or immediately if already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initEnvironmentsModule();
    loadEnvs().catch(() => {});
  });
} else {
  initEnvironmentsModule();
  loadEnvs().catch(() => {});
}
