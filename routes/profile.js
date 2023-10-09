// const express = require("express");
// const router = express.Router();
// const Appointment = require("../models/appointment"); // Pastikan Anda mengimpor model yang sesuai

// // POST endpoint untuk memperbarui tanggal dan waktu appointment
// router.post("/profile", async (req, res) => {
//   if (req.session.email_pasien) {
//     const id_pasien = req.session.id_pasien;
//     const { tanggal, waktu } = req.body;

//     try {
//       // Lakukan pembaruan menggunakan Sequelize
//       const appointment = await Appointment.findOne({ where: { id_pasien } });
//       if (appointment) {
//         await appointment.update({ tanggal, waktu });
//         res.json({ success: true, message: "Appointment berhasil diperbarui" });
//       } else {
//         res
//           .status(404)
//           .json({ success: false, message: "Appointment tidak ditemukan" });
//       }
//     } catch (error) {
//       console.error("Kesalahan saat memperbarui appointment:", error);
//       res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan saat memperbarui appointment",
//       });
//     }
//   } else {
//     res.status(401).json({ success: false, message: "Anda belum masuk" });
//   }
// });

// module.exports = router;
