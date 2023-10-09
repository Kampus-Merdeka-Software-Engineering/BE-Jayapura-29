// document.addEventListener("DOMContentLoaded", () => {
//   // Ganti dengan alamat URL server Express Anda
//   const email_pasien = "contoh@email.com"; // Perbaiki URL ini

//   const apiUrl = `/profile/${email_pasien}`;

//   fetch(apiUrl)
//     .then((response) => response.json())
//     .then((profileData) => {
//       // Menampilkan data di halaman HTML
//       document.getElementById(
//         "profile-image"
//       ).src = `data:image/jpeg;base64, ${profileData.foto_pasien}`;
//       document.getElementById(
//         "jumlah-bayar"
//       ).textContent = `Jumlah Bayar: ${profileData.jumlah_bayar}`;
//       document.getElementById("status-bayar").textContent = `Status Bayar: ${
//         profileData.status_bayar == "sudah" ? "Sudah" : "Belum"
//       }`;
//       const appointmentStatus = document.getElementById("appointment-status");
//       const tanggalAppointment = document.getElementById("tanggal-appointment");
//       const waktuAppointment = document.getElementById("waktu-appointment");
//       if (profileData.tanggal && profileData.waktu) {
//         const appointmentDate = new Date(
//           profileData.tanggal + " " + profileData.waktu
//         );
//         const currentDate = new Date();
//         if (appointmentDate < currentDate) {
//           appointmentStatus.textContent = "Anda belum memiliki appointment.";
//           tanggalAppointment.textContent = "";
//           waktuAppointment.textContent = "";
//         } else {
//           appointmentStatus.textContent = "";
//           tanggalAppointment.textContent = `Tanggal Appointment: ${profileData.tanggal}`;
//           waktuAppointment.textContent = `Waktu Appointment: ${profileData.waktu}`;
//         }
//       } else {
//         appointmentStatus.textContent = "Anda belum memiliki appointment.";
//         tanggalAppointment.textContent = "";
//         waktuAppointment.textContent = "";
//       }
//     })
//     .catch((error) => {
//       console.error("Error:", error);
//     });
// });
