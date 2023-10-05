const express = require("express");
const router = express.Router();
const multer = require("multer"); // Untuk mengelola upload file
const fs = require("fs").promises; // Untuk membaca berkas gambar
const Pasien = require("../models/pasien");
const bcrypt = require("bcrypt");

// Konfigurasi multer untuk mengelola upload file
const storage = multer.memoryStorage(); // Simpan gambar dalam memori
const upload = multer({ storage: storage });

// Handler untuk tampilan signup

// Handler untuk menghandle form signup
router.post("/signup", upload.single("foto_pasien"), async (req, res) => {
  try {
    // Ambil data dari form
    const {
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password,
    } = req.body;

    // Hash password sebelum menyimpannya
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ambil file gambar yang diunggah, atau gunakan foto profil default jika tidak ada yang diunggah
    const foto_pasien = req.file
      ? req.file.buffer.toString("base64")
      : await getDefaultProfileImage();

    // Simpan data ke database
    const newPasien = await Pasien.create({
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password: hashedPassword, // Gunakan password yang telah di-hash
      foto_pasien,
    });

    const successMessage = "Pendaftaran berhasil";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/login'; // Ubah '/login' sesuai dengan URL login Anda
      </script>
    `);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Pendaftaran gagal. Coba lagi nanti.");
  }
});

// Fungsi untuk mengambil foto profil default
async function getDefaultProfileImage() {
  try {
    const defaultImageBuffer = await fs.readFile("public/img/poto-profil.png");
    return defaultImageBuffer.toString("base64");
  } catch (error) {
    console.error("Error reading default profile image:", error);
    throw error;
  }
}

module.exports = router;
