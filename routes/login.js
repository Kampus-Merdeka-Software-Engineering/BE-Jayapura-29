const express = require("express");
const router = express.Router();
const Pasien = require("../models/pasien");
const axios = require("axios");

// GET /api/login
router.get("/login", async (req, res) => {
  try {
    const response = await axios.get(
      "https://kampus-merdeka-software-engineering.github.io/FE-Jayapura-29/login.html"
      // "localhost:5501/index"
    );

    res.status(200).json({ htmlContent: response.data });
  } catch (error) {
    console.error("Error fetching login HTML:", error);
    res.status(500).json({ error: "Error fetching login HTML from GitHub." });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { email_pasien, password } = req.body;
  try {
    const user = await Pasien.findOne({
      where: { email_pasien: email_pasien },
    });

    if (user) {
      // Replace bcrypt compare with a simple password check
      if (password === user.password) {
        // Set status login di session (if you're using sessions)
        req.session.isLoggedIn = true;
        req.session.userId = user.id_pasien;
        req.session.email_pasien = user.email_pasien;

        // Respond with a success message
        res.status(200).json({ message: "Login successful" });
        //route to index
        // res.redirect("localhost:5501/index");
      } else {
        res.status(401).json({ error: "Incorrect password" });
      }
    } else {
      res.status(404).json({ error: "Email not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
