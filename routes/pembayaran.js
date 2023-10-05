const express = require("express");
const router = express.Router();
const Pasien = require("../models/pasien");
const Appointment = require("../models/appointment");
const Psikolog = require("../models/psikolog");

// Route untuk pemrosesan pembayaran
router.post("/proses_pembayaran", async (req, res) => {
  try {
    const { id_pasien, nama_pasien, jumlah_biaya, metode_pembayaran } =
      req.body;

    // Lakukan validasi data sesuai kebutuhan

    // Simpan data pembayaran ke database
    const pembayaran = await Pembayaran.create({
      id_pasien,
      nama_pasien,
      jumlah_biaya,
      metode_pembayaran,
      status_bayar: "Sudah", // Atur status sesuai kebutuhan
    });

    // Kirim respons ke klien
    res.status(200).json({ message: "Pembayaran berhasil disimpan." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat memproses pembayaran." });
  }
});

module.exports = router;
