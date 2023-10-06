const express = require("express");
const router = express.Router();
const Pembayaran = require("../models/pembayaran");

router.post("/pembayaran", async (req, res) => {
  try {
    const {
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      metode_pembayaran,
    } = req.body;

    const pembayaran = await Pembayaran.create({
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      metode_pembayaran,
      status_bayar: "Sudah",
    });

    const successMessage = "Pembayaran berhasil";
    res.send(`
        <script>
          alert('${successMessage}');
          window.location='/index2'; // Ubah '/dashboard' sesuai dengan URL yang sesuai
        </script>
      `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Terjadi kesalahan saat menyimpan pembayaran.");
  }
});

module.exports = router;
