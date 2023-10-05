const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");

router.post("/create-appointment", async (req, res) => {
  try {
    // Ambil data dari formulir yang dikirimkan
    const {
      id_pasien,
      nama_pasien,
      email_pasien,
      nama_psikolog,
      tanggal,
      waktu,
      keluhan,
    } = req.body;

    // Membuat record appointment baru di tb_appointment menggunakan Sequelize
    const appointment = await Appointment.create({
      id_pasien,
      nama_pasien,
      email_pasien,
      nama_psikolog,
      tanggal,
      waktu,
      keluhan,
    });

    // Jika berhasil, kirimkan respons berhasil
    res
      .status(201)
      .json({ message: "Appointment berhasil dibuat", appointment });
  } catch (error) {
    // Jika terjadi kesalahan, tangani dengan mengirimkan pesan error
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat membuat appointment" });
  }
});

module.exports = router;
