const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Pasien = require("../models/pasien");

router.post("/appointment", async (req, res) => {
  try {
    const { nama_pasien, nama_psikolog, tanggal, waktu, keluhan } = req.body;

    const { email_pasien } = req.session;

    const pasien = await Pasien.findOne({
      where: { email_pasien },
    });

    if (!pasien) {
      return res.status(404).send("Pasien tidak ditemukan");
    }

    await Appointment.create({
      nama_pasien,
      email_pasien,
      nama_psikolog,
      tanggal,
      waktu,
      keluhan,
      pasienId: pasien.id,
    });

    const successMessage = "Appointment berhasil";
    res.send(`
          <script>
            alert('${successMessage}');
            window.location='/index2';
          </script>
        `);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan");
  }
});

module.exports = router;
