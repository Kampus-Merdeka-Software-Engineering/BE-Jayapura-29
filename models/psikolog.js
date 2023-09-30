const Sequelize = require("sequelize");
const sequelize = require("../config/database"); // Import dari direktori config

const Psikolog = sequelize.define("tb_psikolog", {
  nama_psikolog: Sequelize.STRING,
  alamat: Sequelize.STRING,
  spesialisasi: Sequelize.STRING,
  gender: Sequelize.ENUM("Laki-laki", "Perempuan"),
  nomor_ponsel: Sequelize.STRING,
  email: Sequelize.STRING,
  gambar_psikolog: Sequelize.BLOB,
});

module.exports = Psikolog;
