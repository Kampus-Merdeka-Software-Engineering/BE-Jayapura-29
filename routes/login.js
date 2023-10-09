const express = require("express");
const router = express.Router();
const Pasien = require("../models/pasien");
const axios = require("axios");

router.get("/login", async (req, res) => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/login.html"
    );

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching login HTML:", error);
    res.status(500).send("Error fetching login HTML from GitHub.");
  }
});

router.post("/login", async (req, res) => {
  const { email_pasien, password } = req.body;
  try {
    const user = await Pasien.findOne({
      where: { email_pasien: email_pasien },
    });

    if (user) {
      // Replace bcrypt compare with a simple password check
      if (password === user.password) {
        // Set status login di session
        req.session.isLoggedIn = true;
        req.session.userId = user.id_pasien;
        req.session.email_pasien = user.email_pasien;
        // res.redirect("/index2");
        res.redirect(
          "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/index2.html"
        );
      } else {
        res.send(
          "<script>alert('Password Anda salah'); window.location='/login';</script>"
        );
      }
    } else {
      res.send(
        "<script>alert('Email tidak ditemukan'); window.location='/login';</script>"
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan dalam proses login");
  }
});

module.exports = router;
