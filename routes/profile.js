const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment"); // Pastikan Anda mengimpor model yang sesuai
const axios = require("axios");

// router.get("/profile", checkLoggedIn, async (req, res) => {
//   if (req.session.email_pasien) {
//     const email_pasien = req.session.email_pasien;
//     const id_pasien = req.session.id_pasien;

//     const query = id_pasien ? { id_pasien, email_pasien } : { email_pasien };

//     try {
//       const user = await Pasien.findOne({ where: query });

//       if (user) {
//         const {
//           id_pasien,
//           nama_pasien,
//           email_pasien,
//           gender,
//           nomor_ponsel,
//           alamat,
//           foto_pasien,
//         } = user;

//         const pembayaran = await Pembayaran.findOne({ where: { id_pasien } });

//         const namaPasienArray = nama_pasien.split(" ");
//         const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

//         const profileData = {
//           id_pasien: id_pasien,
//           nama_pasien: nama_pasien,
//           email_pasien: email_pasien,
//           gender: gender,
//           nomor_ponsel: nomor_ponsel,
//           alamat: alamat,
//           foto_pasien: foto_pasien,
//           jumlah_bayar: pembayaran ? pembayaran.jumlah_bayar : "-",
//           status_bayar: pembayaran ? pembayaran.status_bayar : "-",
//           nama_pendek: nama_pendek,
//         };

//         const response = await axios.get(
//           "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/profile.html"
//         );

//         const profileHtml = response.data;

//         const appointment = await Appointment.findOne({
//           where: { email_pasien },
//         });

//         if (appointment) {
//           if (pembayaran) {
//             profileData.jumlah_bayar = 8000;
//             profileData.status_bayar = "sudah";
//           } else {
//             profileData.jumlah_bayar = 80000;
//             profileData.status_bayar = "belum";
//           }
//           const appointmentDate = new Date(appointment.tanggal);

//           const monthNames = [
//             "Jan",
//             "Feb",
//             "Mar",
//             "Apr",
//             "May",
//             "Jun",
//             "Jul",
//             "Aug",
//             "Sep",
//             "Oct",
//             "Nov",
//             "Dec",
//           ];

//           const day = appointmentDate.getDate();
//           const month = monthNames[appointmentDate.getMonth()];
//           const year = appointmentDate.getFullYear();

//           const formattedDate = `${appointmentDate
//             .toDateString()
//             .substr(0, 3)} ${month} ${day} ${year}`;
//           profileData.tanggal_appointment = formattedDate;
//           profileData.waktu_appointment = appointment.waktu;
//         } else {
//           profileData.jumlah_bayar = "-";
//           profileData.status_bayar = "-";
//           profileData.tanggal_appointment = "Anda belum memiliki appointment";
//           profileData.waktu_appointment = "";
//         }

//         const renderedHtml = profileHtml
//           .replace(/<%= profileData.id_pasien %>/g, profileData.id_pasien)
//           .replace(/<%= profileData.nama_pasien %>/g, profileData.nama_pasien)
//           .replace(/<%= profileData.email_pasien %>/g, profileData.email_pasien)
//           .replace(/<%= profileData.gender %>/g, profileData.gender)
//           .replace(/<%= profileData.nomor_ponsel %>/g, profileData.nomor_ponsel)
//           .replace(/<%= profileData.alamat %>/g, profileData.alamat)
//           .replace(/<%= profileData.foto_pasien %>/g, profileData.foto_pasien)
//           .replace(/<%= profileData.jumlah_bayar %>/g, profileData.jumlah_bayar)
//           .replace(/<%= profileData.status_bayar %>/g, profileData.status_bayar)
//           .replace(/<%= profileData.nama_pendek %>/g, profileData.nama_pendek)
//           .replace(
//             /<%= profileData.tanggal_appointment %>/g,
//             `tanggal: ${profileData.tanggal_appointment}`
//           )
//           .replace(
//             /<%= profileData.waktu_appointment %>/g,
//             `waktu: ${profileData.waktu_appointment}`
//           );

//         res.send(renderedHtml);
//       } else {
//         res.redirect("/login");
//       }
//     } catch (error) {
//       console.error("Kesalahan saat mencari data pasien:", error);
//       res.status(500).send("Terjadi kesalahan saat mencari data pasien.");
//     }
//   } else {
//     res.redirect("/login");
//   }
// });

router.post("/profile", async (req, res) => {
  if (req.session.email_pasien) {
    const id_pasien = req.session.id_pasien;
    const { tanggal, waktu } = req.body;

    try {
      // Lakukan pembaruan menggunakan Sequelize
      const appointment = await Appointment.findOne({ where: { id_pasien } });
      if (appointment) {
        await appointment.update({ tanggal, waktu });
        res.json({ success: true, message: "Appointment berhasil diperbarui" });
      } else {
        res
          .status(404)
          .json({ success: false, message: "Appointment tidak ditemukan" });
      }
    } catch (error) {
      console.error("Kesalahan saat memperbarui appointment:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memperbarui appointment",
      });
    }
  } else {
    res.status(401).json({ success: false, message: "Anda belum masuk" });
  }
});

module.exports = router;
