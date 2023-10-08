const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");

// Konfigurasi koneksi ke database
const sequelize = new Sequelize(
  "mysql://avnadmin:AVNS_SykRuM38IyST7lPXCgQ@mysql-25f6aff-capstone-project-jayapura.aivencloud.com:16041/defaultdb?ssl-mode=REQUIRED",
  {
    ssl: fs.readFileSync(path.join(__dirname, "ca.pem")),
    dialect: "mysql",
    logging: false,
    // Anda dapat menambahkan pengaturan lain yang diperlukan di sini
  }
);

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
