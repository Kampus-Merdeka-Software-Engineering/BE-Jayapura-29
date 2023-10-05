const Sequelize = require("sequelize");
const sequelize = require("../config/database"); // Import dari direktori config

// Import model Appointment
// const Appointment = require("./appointment");

const Pasien = sequelize.define("tb_pasien", {
  id_pasien: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_pasien: Sequelize.STRING,
  tanggal_lahir: Sequelize.DATE,
  gender: Sequelize.ENUM("Laki-laki", "Perempuan"),
  nomor_ponsel: Sequelize.STRING,
  email_pasien: Sequelize.STRING,
  alamat: Sequelize.STRING,
  password: Sequelize.STRING,
  foto_pasien: Sequelize.BLOB,
});

module.exports = Pasien;

// Menentukan hubungan antara Pasien dan Appointment
// Pasien.hasMany(Appointment, { foreignKey: "id_pasien" });
