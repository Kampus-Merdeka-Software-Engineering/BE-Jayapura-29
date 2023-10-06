const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Psikolog = sequelize.define("tb_psikolog", {
  id_psikolog: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_psikolog: Sequelize.STRING,
  alamat: Sequelize.STRING,
  spesialisasi: Sequelize.STRING,
  gender: Sequelize.ENUM("Laki - laki", "Perempuan"),
  nomor_ponsel: Sequelize.STRING,
  email: Sequelize.STRING,
  gambar_psikolog: Sequelize.BLOB,
});

module.exports = Psikolog;
