const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Pasien = require("../models/pasien");

router.post("/appointment", async (req, res) => {
  try {
    // Ambil data yang diperlukan dari request body
    const { id_pasien, nama_pasien, nama_psikolog, tanggal, waktu, keluhan } =
      req.body; // Sesuaikan dengan field yang diperlukan

    // Ambil email_pasien dari sesi atau tempat Anda menyimpannya saat login
    const { email_pasien } = req.session; // Sesuaikan dengan cara Anda menyimpan email_pasien

    // Cari data pasien berdasarkan email_pasien
    const pasien = await Pasien.findOne({
      where: { email_pasien },
    });

    if (!pasien) {
      return res.status(404).send("Pasien tidak ditemukan");
    }

    // Create a new appointment entry in the tb_appointment table
    await Appointment.create({
      nama_pasien,
      email_pasien,
      nama_psikolog,
      tanggal,
      waktu,
      keluhan,
      id_pasien, // Assuming you have a relationship between Appointment and Pasien
    });

    // Redirect or respond as needed upon successful appointment creation
    const successMessage = "Appointment berhasil";
    res.send(`
          <script>
            alert('${successMessage}');
            window.location='/index2';
          </script>
        `); // Redirect to the appointment page or handle success as needed
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan");
  }
});

module.exports = router;
