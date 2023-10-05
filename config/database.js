const Sequelize = require("sequelize");

// Konfigurasi koneksi ke database
const sequelize = new Sequelize("db_kesehatan", "root", "", {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
  // Anda dapat menambahkan pengaturan lain yang diperlukan di sini
});

// Coba koneksi ke database
sequelize
  .authenticate()
  .then(() => {
    console.log("Terhubung ke database MySQL");
  })
  .catch((err) => {
    console.error("Gagal terhubung ke database:", err);
  });

module.exports = sequelize;
