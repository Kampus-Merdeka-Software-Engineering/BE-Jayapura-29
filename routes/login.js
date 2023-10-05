const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Pasien = require("../models/pasien");

router.post("/login", async (req, res) => {
  const { email_pasien, password } = req.body;
  try {
    const user = await Pasien.findOne({
      where: { email_pasien: email_pasien },
    });

    if (user) {
      const match = await bcrypt.compare(password, user.password); // Memeriksa kata sandi dengan bcrypt

      if (match) {
        req.session.userId = user.id_pasien;

        // Membuat nama_pendek dari 2 kata pertama nama_pasien
        req.session.userId = user.id_pasien;
        const nama_pasienWords = user.nama_pasien.split(" ");
        const nama_pendek = `${nama_pasienWords[0]} ${nama_pasienWords[1]}`;
        const foto_pasien = user.foto_pasien;
        req.session.nama_pendek = nama_pendek;
        req.session.email_pasien = user.email_pasien;
        req.session.foto_pasien = foto_pasien;
        res.redirect("/index2");
        // Mengirim file HTML sebagai respons
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
