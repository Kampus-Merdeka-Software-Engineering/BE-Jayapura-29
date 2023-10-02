const Sequelize = require("sequelize");
const sequelize = require("../config/database"); // Import dari direktori config

const Pasien = sequelize.define("tb_pasien", {
  nama_pasien: Sequelize.STRING,
  tanggal_lahir: Sequelize.DATE,
  gender: Sequelize.ENUM("Laki - laki", "Perempuan"),
  nomor_ponsel: Sequelize.STRING,
  email_pasien: Sequelize.STRING,
  alamat: Sequelize.STRING,
  password: Sequelize.STRING,
  foto_pasien: Sequelize.BLOB, // Untuk menyimpan gambar dalam bentuk BLOB
});

module.exports = Pasien;
