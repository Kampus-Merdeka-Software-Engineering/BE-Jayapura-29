const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Pasien = require("../models/pasien");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

router.post("/edit_profile", upload.single("foto_pasien"), async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/login");
  }

  try {
    const { nama_pasien, email_pasien, gender, nomor_ponsel, alamat } =
      req.body;

    const foto_pasien = req.file ? req.file.filename : null;

    const profil = await Pasien.findOne({ where: { id_pasien: userId } });

    if (!profil) {
      return res.status(404).send("Profil tidak ditemukan");
    }

    profil.nama_pasien = nama_pasien;
    profil.email_pasien = email_pasien;
    profil.gender = gender;
    profil.nomor_ponsel = nomor_ponsel;
    profil.alamat = alamat;

    if (foto_pasien) {
      profil.foto_pasien = foto_pasien;
    }

    await profil.save();

    const successMessage = "Profil berhasil diperbarui";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/profile'; // Redirect ke halaman profil
      </script>
    `);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan saat menyimpan perubahan profil");
  }
});

module.exports = router;
