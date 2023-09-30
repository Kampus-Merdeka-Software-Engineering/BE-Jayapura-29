const Sequelize = require("sequelize");
const sequelize = require("../config/database"); // Import dari direktori config

const Appointment = sequelize.define("tb_appointment", {
  nama_pasien: Sequelize.STRING,
  nama_psikolog: Sequelize.STRING,
  tanggal: Sequelize.DATE,
  waktu: Sequelize.TIME,
  keluhan: Sequelize.STRING,
});

module.exports = Appointment;
