const Pasien = require("./models/pasien"); // Sesuaikan dengan path yang sesuai
// Menggunakan Sequelize untuk mengambil semua data pasien
async function lihatSemuaDataPasien() {
  try {
    const semuaDataPasien = await Pasien.findAll();
    console.log("Data Pasien:", semuaDataPasien);
  } catch (error) {
    console.error("Gagal mengambil data pasien:", error);
  }
}

lihatSemuaDataPasien();
