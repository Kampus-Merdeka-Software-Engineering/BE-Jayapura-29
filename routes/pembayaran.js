const express = require("express");
const router = express.Router();
const Pembayaran = require("../models/pembayaran"); // Pastikan path sesuai dengan lokasi model Pembayaran

router.post("/pembayaran", async (req, res) => {
  try {
    // Dapatkan data dari formulir pembayaran.html
    const {
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      metode_pembayaran,
    } = req.body;

    // Simpan data pembayaran ke dalam tabel tb_pembayaran
    const pembayaran = await Pembayaran.create({
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      tanggal_bayar: new Date(), // Tanggal pembayaran diambil dari saat ini
      metode_pembayaran,
      status_bayar: "Sudah", // Atur status pembayaran sesuai kebutuhan
    });

    // Lakukan sesuatu setelah pembayaran berhasil disimpan, misalnya, tampilkan pesan sukses atau alihkan ke halaman lain
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
