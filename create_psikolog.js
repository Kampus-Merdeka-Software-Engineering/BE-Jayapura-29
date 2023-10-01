// create_psikolog.js

const Psikolog = require("./models/psikolog"); // Sesuaikan dengan path yang sesuai

// Data psikolog yang ingin Anda tambahkan
const newPsikolog = {
  nama_psikolog: "Angel",
  alamat: "Jalan F",
  spesialisasi: "Specialist F",
  gender: "Perempuan",
  nomor_ponsel: "08666666666",
  email: "angel@gmail.com",
  gambar_psikolog: "/public/img/angel.png",
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
