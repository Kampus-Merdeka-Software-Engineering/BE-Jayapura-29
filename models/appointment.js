const Sequelize = require("sequelize");
const sequelize = require("../config/database"); //

const Pasien = require("./pasien");
const Psikolog = require("./psikolog");

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

// Establish the association after defining the Appointment model
Appointment.belongsTo(Pasien, { foreignKey: "id_pasien" });
Appointment.belongsTo(Psikolog, { foreignKey: "nama_psikolog" });

module.exports = Appointment;
