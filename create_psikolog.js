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
