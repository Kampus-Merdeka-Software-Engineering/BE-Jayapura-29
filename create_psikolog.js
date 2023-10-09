// create_psikolog.js

const Psikolog = require("./models/psikolog"); // Sesuaikan dengan path yang sesuai

// Data psikolog yang ingin Anda tambahkan
const newPsikolog = {
  nama_psikolog: "Angel",
  alamat: "Jalan F",
  spesialisasi: "Specialist F",
  gender: "Perempuan",
  nomor_ponsel: "085555555555",
  email: "angel@gmail.com",
  gambar_psikolog: "/public/img/angel.png",
};

async function tambahPsikolog() {
  try {
    await Psikolog.sync();
    const psikologBaru = await Psikolog.create(newPsikolog);
    console.log("Data psikolog berhasil ditambahkan:", psikologBaru.toJSON());
  } catch (error) {
    console.error("Gagal menambahkan data psikolog:", error);
  }
}

tambahPsikolog();
