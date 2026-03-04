// Users module - handles user CRUD operations

let editingUserId = null;

function initUsersModule() {
  const userForm = document.getElementById("userModalForm");
  const openCreateBtn = document.getElementById("openCreateUser");
  const closeBtn = document.getElementById("modalUserClose");
  const saveBtn = document.getElementById("modalUserSave");

  if (openCreateBtn) openCreateBtn.onclick = handleOpenCreateUser;
  if (closeBtn) closeBtn.onclick = handleCloseUserModal;
  if (userForm) userForm.addEventListener("submit", handleSaveUserSubmit);
  else if (saveBtn) saveBtn.onclick = handleSaveUser;
}

function handleSaveUserSubmit(e) {
  e.preventDefault();
  return handleSaveUser();
}

function handleOpenCreateUser() {
  editingUserId = null;
  document.getElementById("userModalTitle").innerText = "Create User";
  document.getElementById("userModalUsername").value = "";
  document.getElementById("userModalPassword").value = "";
  document.getElementById("userModalMsg").innerText = "";
  const modal = document.getElementById("userModal");
  modal.style.display = "flex";
  setTimeout(() => {
    const inp = document.getElementById("userModalUsername");
    if (inp) inp.focus();
  }, 50);
}

function handleCloseUserModal() {
  document.getElementById("userModal").style.display = "none";
}

async function handleSaveUser() {
  const btn = document.getElementById("modalUserSave");
  btn.disabled = true;
  const username = document.getElementById("userModalUsername").value;
  const password = document.getElementById("userModalPassword").value;
  try {
    if (!username) throw new Error("username required");
    if (editingUserId) {
      await authFetch(api + "/users/" + editingUserId, {
        method: "PUT",
        body: JSON.stringify({ username, password }),
      });
    } else {
      if (!password) throw new Error("password required");
      await authFetch(api + "/users", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    }
    await loadUsers();
    document.getElementById("userModal").style.display = "none";
  } catch (err) {
    document.getElementById("userModalMsg").innerText =
      (err && err.message) || "Error";
  } finally {
    btn.disabled = false;
  }
}

async function loadUsers() {
  const res = await authFetch(api + "/users");
  const table = document.getElementById("usersTable");
  if (table) {
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";
    res.forEach((u) => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.style.padding = "12px";
      tdName.innerText = u.username;

      const tdActions = document.createElement("td");
      tdActions.style.padding = "12px";
      tdActions.style.textAlign = "center";

      const editBtn = createEditButton(u);
      const delBtn = createDeleteButton(u);

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);
      tr.appendChild(tdName);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }
}

function createEditButton(u) {
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.title = "Edit";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 21v-3l11-11 3 3L6 21H3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  btn.onclick = async () => {
    editingUserId = u.id;
    document.getElementById("userModalTitle").innerText = "Edit User";
    document.getElementById("userModalUsername").value = u.username;
    document.getElementById("userModalPassword").value = "";
    document.getElementById("userModalMsg").innerText = "";
    document.getElementById("userModal").style.display = "flex";
  };
  return btn;
}

function createDeleteButton(u) {
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.title = "Delete user";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  btn.onclick = async () => {
    if (!confirm('Delete user "' + u.username + '"?')) return;
    await authFetch(api + "/users/" + u.id, { method: "DELETE" });
    await loadUsers();
  };
  return btn;
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  initUsersModule();
  loadUsers();
});
