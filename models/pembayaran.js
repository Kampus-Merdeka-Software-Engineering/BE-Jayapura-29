const Sequelize = require("sequelize");
const sequelize = require("../config/database"); // Import dari direktori config

const Pembayaran = sequelize.define("tb_pembayaran", {
  jumlah_biaya: Sequelize.INTEGER,
  tanggal_bayar: Sequelize.DATE,
  metode_pembayaran: Sequelize.ENUM("Dana", "Gopay", "BRI"),
  status_bayar: Sequelize.STRING,
});

module.exports = Pembayaran;
