
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Contact = require("./models/Contact");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// READ: Get all contacts
app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// CREATE: Add a contact
app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        error: "Name, email and phone are required"
      });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: (address || "").trim()
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// UPDATE: Edit a contact
app.put("/api/contacts/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    const { name, email, phone, address } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        error: "Name, email and phone are required"
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: (address || "").trim()
      },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// DELETE: Remove a contact
app.delete("/api/contacts/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

async function startServer() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("MongoDB connected successfully");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(error => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
