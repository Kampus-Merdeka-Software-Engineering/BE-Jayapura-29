const express = require("express");
const router = express.Router();
const Pasien = require("../models/pasien");
const Appointment = require("../models/appointment");
const Pembayaran = require("../models/pembayaran");

router.get("/:email_pasien", async (req, res) => {
  const email_pasien = req.params.email_pasien;

  try {
    const profileData = await Pasien.findOne({
      where: { email_pasien },
      include: [
        {
          model: Appointment,
          attributes: ["tanggal", "waktu"],
        },
        {
          model: Pembayaran,
          attributes: ["jumlah_biaya", "status_bayar"],
        },
      ],
    });

    if (!profileData) {
      return res.status(404).json({ message: "Data pasien tidak ditemukan" });
    }

    res.json(profileData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

module.exports = router;
