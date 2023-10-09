const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs").promises;
const Pasien = require("../models/pasien");
const axios = require("axios");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/signup", async (req, res) => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/signup.html"
    );

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching signup HTML:", error);
    res.status(500).send("Error fetching signup HTML from GitHub.");
  }
});

router.post("/signup", upload.single("foto_pasien"), async (req, res) => {
  try {
    const {
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password,
    } = req.body;

    const foto_pasien = req.file
      ? req.file.buffer.toString("base64")
      : await getDefaultProfileImage();

    const newPasien = await Pasien.create({
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password, // Simpan password secara plaintext
      foto_pasien,
    });

    const successMessage = "Pendaftaran berhasil";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/login'; 
      </script>
    `);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Pendaftaran gagal. Coba lagi nanti.");
  }
});

// async function getDefaultProfileImage() {
//   try {
//     const defaultImageBuffer = await fs.readFile("public/img/poto-profil.png");
//     return defaultImageBuffer.toString("base64");
//   } catch (error) {
//     console.error("Error reading default profile image:", error);
//     throw error;
//   }
// }

async function getDefaultProfileImage() {
  try {
    const defaultImageBuffer = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/public/img/profile-pic.png",
      { responseType: "arraybuffer" }
    );

    const base64Image = Buffer.from(defaultImageBuffer.data, "binary").toString(
      "base64"
    );
    return base64Image;
  } catch (error) {
    console.error("Error reading default profile image:", error);
    throw error;
  }
}

module.exports = router;
