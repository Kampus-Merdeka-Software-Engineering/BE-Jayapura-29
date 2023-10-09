const express = require("express");
const router = express.Router();
const Pembayaran = require("../models/pembayaran");
const axios = require("axios");

// router.get("/pembayaran", checkLoggedIn, async (req, res) => {
//   try {
//     const userEmail = req.session.email_pasien;

//     if (!userEmail) {
//       const alertMessage = "Anda belum login. Silakan login terlebih dahulu.";
//       const loginRedirect = "/login";

//       res.send(`
//         <script>
//           alert('${alertMessage}');
//           window.location='${loginRedirect}';
//         </script>
//       `);
//       return;
//     }

//     const pasien = await Pasien.findOne({
//       where: { email_pasien: userEmail },
//     });

//     if (!pasien) {
//       return res.status(404).send("Data pasien tidak ditemukan");
//     }

//     const namaPasienArray = pasien.nama_pasien.split(" ");
//     const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

//     const appointment = await Appointment.findOne({
//       where: { email_pasien: userEmail },
//     });

//     if (!appointment) {
//       const errorMessage = "Anda tidak memiliki appointment.";
//       res.send(`
//         <script>
//           alert('${errorMessage}');
//           window.location='/index'; // Redirect ke halaman awal
//         </script>
//       `);
//       return;
//     }

//     const psikolog = await Psikolog.findOne({
//       where: { nama_psikolog: appointment.nama_psikolog },
//     });

//     if (!psikolog) {
//       return res.status(404).send("Data psikolog tidak ditemukan");
//     }

//     const response = await axios.get(
//       "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/pembayaran.html"
//     );

//     const pembayaranHtml = response.data;

//     const renderedHtml = pembayaranHtml
//       .replace(/<%= id_pasien %>/g, pasien.id_pasien)
//       .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
//       .replace(/<%= email_pasien %>/g, pasien.email_pasien)
//       .replace(/<%= nama_psikolog %>/g, psikolog.nama_psikolog)
//       .replace(/<%= gambar_psikolog %>/g, psikolog.gambar_psikolog)
//       .replace(/<%= spesialisasi %>/g, psikolog.spesialisasi)
//       .replace(/<%= nama_pendek %>/g, nama_pendek)
//       .replace(/<%= foto_pasien %>/g, pasien.foto_pasien);

//     res.send(renderedHtml);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

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
