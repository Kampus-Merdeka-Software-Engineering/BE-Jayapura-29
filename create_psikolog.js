// create_psikolog.js

const Psikolog = require("./models/psikolog"); // Sesuaikan dengan path yang sesuai

// Data psikolog yang ingin Anda tambahkan
const newPsikolog = {
  nama_psikolog: "Angelina",
  alamat: "Jalan A",
  spesialisasi: "Specialist A",
  gender: "Perempuan",
  nomor_ponsel: "0811111111111",
  email: "angelina@gmail.com",
  gambar_psikolog: "/public/img/angelina.png",
  // Tambahkan definisi untuk kolom-kolom lainnya
};

async function tambahPsikolog() {
  try {
    await Psikolog.sync(); // Sinkronisasi model dengan tabel di database
    const psikologBaru = await Psikolog.create(newPsikolog); // Menambahkan data ke tabel
    console.log("Data psikolog berhasil ditambahkan:", psikologBaru.toJSON());
  } catch (error) {
    console.error("Gagal menambahkan data psikolog:", error);
  }
}

tambahPsikolog();
