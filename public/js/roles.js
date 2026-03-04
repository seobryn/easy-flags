// Roles module - handles role CRUD and permission management

let editingRoleId = null;
let managePermissionsRoleId = null;
const allPermissions = [];

function initRolesModule() {
  const roleForm = document.getElementById("roleForm");
  const openCreateBtn = document.getElementById("openCreateRole");
  const closeBtn = document.getElementById("closeRoleModal");

  if (openCreateBtn) openCreateBtn.onclick = handleOpenCreateRole;
  if (closeBtn) closeBtn.onclick = handleCloseRoleModal;
  if (roleForm) roleForm.addEventListener("submit", handleSaveRoleSubmit);
}

function handleOpenCreateRole() {
  editingRoleId = null;
  document.getElementById("roleModalTitle").innerText = "Create Role";
  document.getElementById("roleName").value = "";
  document.getElementById("roleDescription").value = "";
  const modal = document.getElementById("roleModal");
  modal.classList.remove("hidden");
  setTimeout(() => {
    const inp = document.getElementById("roleName");
    if (inp) inp.focus();
  }, 50);
}

function handleCloseRoleModal() {
  document.getElementById("roleModal").classList.add("hidden");
  editingRoleId = null;
}

function handleClosePermissionsModal() {
  document.getElementById("permissionsModal").classList.add("hidden");
  managePermissionsRoleId = null;
}

function handleSaveRoleSubmit(e) {
  e.preventDefault();
  return handleSaveRole();
}

async function handleSaveRole() {
  const btn = document.querySelector("#roleForm button[type='submit']");
  btn.disabled = true;
  const name = document.getElementById("roleName").value;
  const description = document.getElementById("roleDescription").value;

  try {
    if (!name) throw new Error("Role name is required");

    if (editingRoleId) {
      await authFetch(api + "/roles/" + editingRoleId, {
        method: "PUT",
        body: JSON.stringify({ name, description }),
      });
    } else {
      await authFetch(api + "/roles", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
    }

    await loadRoles();
    handleCloseRoleModal();
  } catch (err) {
    alert((err && err.message) || "Error saving role");
  } finally {
    btn.disabled = false;
  }
}

async function loadRoles() {
  try {
    const res = await authFetch(api + "/roles");
    const table = document.getElementById("rolesTable");
    if (table) {
      const tbody = table.querySelector("tbody");
      tbody.innerHTML = "";
      res.forEach((role) => {
        const tr = document.createElement("tr");

        const tdName = document.createElement("td");
        tdName.className = "p-3 sm:p-4";
        tdName.innerText = role.name;

        const tdDesc = document.createElement("td");
        tdDesc.className = "p-3 sm:p-4 text-white/70";
        tdDesc.innerText = role.description || "-";

        const tdActions = document.createElement("td");
        tdActions.className = "p-3 sm:p-4 text-center space-x-2 inline-flex";
        tdActions.style.display = "flex";
        tdActions.style.justifyContent = "center";
        tdActions.style.gap = "8px";

        const permBtn = createPermissionsButton(role);
        const editBtn = createEditButton(role);
        const delBtn = createDeleteButton(role);

        tdActions.appendChild(permBtn);
        tdActions.appendChild(editBtn);
        tdActions.appendChild(delBtn);
        tr.appendChild(tdName);
        tr.appendChild(tdDesc);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Error loading roles:", err);
  }
}

function createPermissionsButton(role) {
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.type = "button";
  btn.title = "Manage permissions";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="19" cy="12" r="1" fill="currentColor"/>
      <circle cx="5" cy="12" r="1" fill="currentColor"/>
    </svg>`;
  btn.onclick = async () => {
    managePermissionsRoleId = role.id;
    document.getElementById("permissionRoleName").innerText = role.name;
    await loadPermissionsForRole(role.id);
    document.getElementById("permissionsModal").classList.remove("hidden");
  };
  return btn;
}

async function loadPermissionsForRole(roleId) {
  try {
    // Load all permissions
    if (allPermissions.length === 0) {
      const perms = await authFetch(api + "/permissions");
      allPermissions.push(...perms);
    }

    // Load role permissions
    const rolePerms = await authFetch(api + "/roles/" + roleId);

    const container = document.getElementById("permissionsContainer");
    container.innerHTML = "";

    const rolePermIds = new Set(
      rolePerms.permissions ? rolePerms.permissions.map((p) => p.id) : [],
    );

    // Permission to URL mapping (CRUD split)
    const permUrlMap = {
      view_environments: "/environments",
      create_environments: "/environments",
      update_environments: "/environments",
      delete_environments: "/environments",
      view_features: "/features",
      create_features: "/features",
      update_features: "/features",
      delete_features: "/features",
      view_users: "/users",
      create_users: "/users",
      update_users: "/users",
      delete_users: "/users",
      view_roles: "/roles",
      create_roles: "/roles",
      update_roles: "/roles",
      delete_roles: "/roles",
      manage_permissions: null,
      manage_flags: null,
      manage_billing: "/billing",
    };

    const sortedPermissions = [...allPermissions].sort((a, b) => {
      const aHasUrl = !!permUrlMap[a.name];
      const bHasUrl = !!permUrlMap[b.name];
      if (aHasUrl === bHasUrl) return a.name.localeCompare(b.name);
      return aHasUrl ? -1 : 1;
    });

    sortedPermissions.forEach((perm) => {
      const div = document.createElement("div");
      div.className =
        "flex items-center justify-between gap-3 p-3 border border-white/10 rounded bg-white/5";

      // Create label and description on the left
      const labelContainer = document.createElement("div");
      labelContainer.className = "flex-1";

      const label = document.createElement("div");
      label.className = "font-medium text-white";
      // Human-friendly label for CRUD permissions
      let labelText = perm.name;
      if (
        /^(create|update|delete|view)_(roles|users|features|environments)$/.test(
          perm.name,
        )
      ) {
        const [action, entity] = perm.name.split("_");
        const actionMap = {
          create: "Create",
          update: "Edit",
          delete: "Delete",
          view: "View",
        };
        labelText = `${actionMap[action] || action} ${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
      } else if (perm.name === "manage_permissions") {
        labelText = "Manage Role Permissions";
      } else if (perm.name === "manage_flags") {
        labelText = "Update Feature Flag Values";
      } else if (perm.name === "manage_billing") {
        labelText = "Access Billing";
      }
      label.textContent = labelText;

      const description = document.createElement("div");
      description.className = "text-sm text-white/50";
      // Hide technical description for CRUD permissions, show for others
      if (
        /^(create|update|delete|view)_(roles|users|features|environments)$/.test(
          perm.name,
        )
      ) {
        description.textContent = "";
      } else {
        description.textContent = perm.description || "";
      }

      // Add URL mapping if available
      if (permUrlMap[perm.name]) {
        const url = document.createElement("div");
        url.className = "text-xs text-cyan-300 mt-1";
        url.textContent = `URL: ${permUrlMap[perm.name]}`;
        labelContainer.appendChild(url);
      }

      labelContainer.appendChild(label);
      labelContainer.appendChild(description);

      // Create toggle switch on the right
      const toggleLabel = document.createElement("label");
      toggleLabel.className = "toggle-switch";

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.id = `perm_${perm.id}`;
      toggle.checked = rolePermIds.has(perm.id);

      const slider = document.createElement("span");
      slider.className = "slider";

      toggleLabel.appendChild(toggle);
      toggleLabel.appendChild(slider);

      div.appendChild(labelContainer);
      div.appendChild(toggleLabel);
      container.appendChild(div);
    });

    // Add save button
    const saveContainer = document.createElement("div");
    saveContainer.className =
      "flex gap-2 justify-end mt-6 pt-4 border-t border-white/10";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className =
      "bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 transition-colors";
    saveBtn.innerText = "Save Permissions";
    saveBtn.onclick = () => saveRolePermissions(roleId);
    saveContainer.appendChild(saveBtn);
    container.appendChild(saveContainer);
  } catch (err) {
    console.error("Error loading permissions:", err);
  }
}

async function saveRolePermissions(roleId) {
  try {
    const checkboxes = document.querySelectorAll(
      "#permissionsContainer input[type='checkbox']",
    );
    const permissionIds = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => {
        const id = cb.id.replace("perm_", "");
        return parseInt(id);
      });

    await authFetch(api + "/roles/" + roleId + "/permissions", {
      method: "POST",
      body: JSON.stringify({ permissionIds }),
    });

    await loadRoles();
    handleClosePermissionsModal();
    alert("Permissions saved successfully");
  } catch (err) {
    alert((err && err.message) || "Error saving permissions");
  }
}

function createEditButton(role) {
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.type = "button";
  btn.title = "Edit";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 21v-3l11-11 3 3L6 21H3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  btn.onclick = async () => {
    editingRoleId = role.id;
    document.getElementById("roleModalTitle").innerText = "Edit Role";
    document.getElementById("roleName").value = role.name;
    document.getElementById("roleDescription").value = role.description || "";
    document.getElementById("roleModal").classList.remove("hidden");
  };
  return btn;
}

function createDeleteButton(role) {
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.type = "button";
  btn.title = "Delete role";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  btn.onclick = async () => {
    if (
      !confirm('Are you sure you want to delete the role "' + role.name + '"?')
    )
      return;
    try {
      await authFetch(api + "/roles/" + role.id, { method: "DELETE" });
      await loadRoles();
    } catch (err) {
      alert((err && err.message) || "Error deleting role");
    }
  };
  return btn;
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  initRolesModule();
  loadRoles();
});
