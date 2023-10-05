const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Pasien = require("../models/pasien");
// Konfigurasi multer untuk menangani upload gambar
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: (req, file, callback) => {
    // Ubah nama gambar agar unik
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// Route untuk menghandle POST request dari form edit profil
router.post("/edit_profile", upload.single("foto_pasien"), async (req, res) => {
  const userId = req.session.userId; // Gantilah ini dengan cara Anda mengidentifikasi user yang sedang login
  if (!userId) {
    // Jika user tidak terautentikasi, arahkan ke halaman login
    return res.redirect("/login"); // Gantilah dengan URL login yang sesuai
  }

  try {
    // Mengambil data dari permintaan POST
    const { nama_pasien, email_pasien, gender, nomor_ponsel, alamat } =
      req.body;

    // Mengambil nama file gambar jika ada
    const foto_pasien = req.file ? req.file.filename : null;

    // Query database untuk mengambil data profil berdasarkan id_pasien
    const profil = await Pasien.findOne({ where: { id_pasien: userId } });

    if (!profil) {
      return res.status(404).send("Profil tidak ditemukan");
    }

    // Update data profil sesuai dengan yang diubah
    profil.nama_pasien = nama_pasien;
    profil.email_pasien = email_pasien;
    profil.gender = gender;
    profil.nomor_ponsel = nomor_ponsel;
    profil.alamat = alamat;

    // Jika ada foto baru, update foto_pasien
    if (foto_pasien) {
      profil.foto_pasien = foto_pasien;
    }

    // Simpan perubahan ke database
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
