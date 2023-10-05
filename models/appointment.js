const Sequelize = require("sequelize");
const sequelize = require("../config/database"); //

const Appointment = sequelize.define("tb_appointment", {
  id_appointment: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pasien: {
    type: Sequelize.INTEGER,
  },
  email_pasien: Sequelize.STRING,
  nama_pasien: Sequelize.STRING,
  nama_psikolog: Sequelize.STRING,
  tanggal: Sequelize.DATE,
  waktu: Sequelize.TIME,
  keluhan: Sequelize.STRING,
});

module.exports = Appointment;
