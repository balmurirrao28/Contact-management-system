
const form = document.getElementById("contactForm");
const contactList = document.getElementById("contactList");
const search = document.getElementById("search");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

let contacts = [];
let editingId = null;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function showMessage(text) {
  message.textContent = text;
}

function resetForm() {
  form.reset();
  editingId = null;
  document.getElementById("formTitle").textContent = "Add Contact";
  saveButton.textContent = "Add Contact";
  cancelButton.hidden = true;
}

function renderContacts() {
  const query = search.value.toLowerCase().trim();

  const filtered = contacts.filter(contact =>
    [contact.name, contact.email, contact.phone, contact.address || ""]
      .some(value => value.toLowerCase().includes(query))
  );

  contactList.replaceChildren();

  if (!filtered.length) {
    contactList.textContent = query
      ? "No matching contacts found."
      : "No contacts yet. Add your first contact above.";
    return;
  }

  filtered.forEach(contact => {
    const card = document.createElement("div");
    card.className = "contact";

    const details = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = contact.name;

    const email = document.createElement("p");
    email.textContent = "Email: " + contact.email;

    const phone = document.createElement("p");
    phone.textContent = "Phone: " + contact.phone;

    details.append(name, email, phone);

    if (contact.address) {
      const address = document.createElement("p");
      address.textContent = "Address: " + contact.address;
      details.appendChild(address);
    }

    const actions = document.createElement("div");
    actions.className = "actions";

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.type = "button";
    edit.addEventListener("click", () => {
      editingId = contact._id;
      form.elements.name.value = contact.name;
      form.elements.email.value = contact.email;
      form.elements.phone.value = contact.phone;
      form.elements.address.value = contact.address || "";

      document.getElementById("formTitle").textContent = "Edit Contact";
      saveButton.textContent = "Save Changes";
      cancelButton.hidden = false;
      form.scrollIntoView({ behavior: "smooth" });
    });

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.className = "delete";
    remove.type = "button";

    remove.addEventListener("click", async () => {
      if (!confirm(`Delete ${contact.name}?`)) return;

      try {
        await request(`/api/contacts/${contact._id}`, {
          method: "DELETE"
        });

        showMessage("Contact deleted successfully.");
        await loadContacts();
      } catch (error) {
        showMessage(error.message);
      }
    });

    actions.append(edit, remove);
    card.append(details, actions);
    contactList.appendChild(card);
  });
}

async function loadContacts() {
  try {
    contacts = await request("/api/contacts");
    renderContacts();
  } catch (error) {
    contactList.textContent = "Could not load contacts. " + error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const contact = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    address: form.elements.address.value.trim()
  };

  saveButton.disabled = true;

  try {
    if (editingId) {
      await request(`/api/contacts/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(contact)
      });
      showMessage("Contact updated successfully.");
    } else {
      await request("/api/contacts", {
        method: "POST",
        body: JSON.stringify(contact)
      });
      showMessage("Contact added successfully.");
    }

    resetForm();
    await loadContacts();
  } catch (error) {
    showMessage(error.message);
  } finally {
    saveButton.disabled = false;
  }
});

cancelButton.addEventListener("click", resetForm);
search.addEventListener("input", renderContacts);

loadContacts();
