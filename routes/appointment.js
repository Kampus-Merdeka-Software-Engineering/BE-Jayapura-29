// const express = require("express");
// const router = express.Router();
// const { checkLoggedIn } = require("../index");
// const Appointment = require("../models/appointment");
// const Pasien = require("../models/pasien");
// const axios = require("axios");

// router.get("/appointment", checkLoggedIn, async (req, res) => {
//   try {
//     const email_pasien = req.session.email_pasien;

//     const pasien = await Pasien.findOne({
//       where: { email_pasien },
//     });

//     if (!pasien) {
//       return res.status(404).send("Pasien tidak ditemukan");
//     }

//     const psikologOptions = await Psikolog.findAll();

//     const psikologOptionsHtml = psikologOptions
//       .map((psikolog) => {
//         return `
//         <option value="${psikolog.nama_psikolog}">
//           ${psikolog.nama_psikolog}
//         </option>
//       `;
//       })
//       .join("");

//     const namaPasienArray = pasien.nama_pasien.split(" ");
//     const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

//     const response = await axios.get(
//       "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/appointment.html"
//     );

//     const appointmentHtml = response.data;

//     const renderedHtml = appointmentHtml
//       .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
//       .replace(/<%= email_pasien %>/g, pasien.email_pasien)
//       .replace(/<%= foto_pasien %>/g, pasien.foto_pasien)
//       .replace(/<%= psikologOptions %>/g, psikologOptionsHtml)
//       .replace(/<%= nama_pendek %>/g, nama_pendek);

//     res.send(renderedHtml);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Terjadi kesalahan");
//   }
// });

// router.post("/appointment", async (req, res) => {
//   try {
//     const { nama_pasien, nama_psikolog, tanggal, waktu, keluhan } = req.body;

//     const { email_pasien } = req.session;

//     const pasien = await Pasien.findOne({
//       where: { email_pasien },
//     });

//     if (!pasien) {
//       return res.status(404).send("Pasien tidak ditemukan");
//     }

//     await Appointment.create({
//       nama_pasien,
//       email_pasien,
//       nama_psikolog,
//       tanggal,
//       waktu,
//       keluhan,
//       pasienId: pasien.id,
//     });

//     const successMessage = "Appointment berhasil";
//     res.send(`
//           <script>
//             alert('${successMessage}');
//             window.location='/index2';
//           </script>
//         `);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Terjadi kesalahan");
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
// const { checkLoggedIn } = require("../index"); // Import the checkLoggedIn function
const Appointment = require("../models/appointment");
const Pasien = require("../models/pasien");
const Psikolog = require("../models/psikolog"); // Import Psikolog
const axios = require("axios");

// Use checkLoggedIn as middleware for routes
// router.get("/appointment", checkLoggedIn, async (req, res) => {
//   try {
//     const email_pasien = req.session.email_pasien;

//     const pasien = await Pasien.findOne({
//       where: { email_pasien },
//     });

//     if (!pasien) {
//       return res.status(404).send("Pasien tidak ditemukan");
//     }

//     const psikologOptions = await Psikolog.findAll();

//     const psikologOptionsHtml = psikologOptions
//       .map((psikolog) => {
//         return `
//         <option value="${psikolog.nama_psikolog}">
//           ${psikolog.nama_psikolog}
//         </option>
//       `;
//       })
//       .join("");

//     const namaPasienArray = pasien.nama_pasien.split(" ");
//     const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

//     const response = await axios.get(
//       "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/appointment.html"
//     );

//     const appointmentHtml = response.data;

//     const renderedHtml = appointmentHtml
//       .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
//       .replace(/<%= email_pasien %>/g, pasien.email_pasien)
//       .replace(/<%= foto_pasien %>/g, pasien.foto_pasien)
//       .replace(/<%= psikologOptions %>/g, psikologOptionsHtml)
//       .replace(/<%= nama_pendek %>/g, nama_pendek);

//     res.send(renderedHtml);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Terjadi kesalahan");
//   }
// });

router.post("/appointment", async (req, res) => {
  try {
    // Your route code here
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan");
  }
});

module.exports = router;
