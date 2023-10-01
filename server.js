const express = require("express");
const ejs = require("ejs");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const app = express();
const multer = require("multer");
const fs = require("fs");
const moment = require("moment-timezone");
const { Sequelize, DataTypes } = require("sequelize");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

// Set zona waktu server ke "Asia/Jakarta"
moment.tz.setDefault("Jakarta");

// Import file konfigurasi database Sequelize
const sequelize = require("./config/database");

// Import model-model Sequelize
const Pasien = require("./models/pasien");
const Psikolog = require("./models/psikolog");
const Appointment = require("./models/appointment");
const Pembayaran = require("./models/pembayaran");

// Konfigurasi Express
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "views")));

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Folder untuk file publik (CSS, gambar, dll.)

// Middleware untuk memeriksa apakah pengguna sudah login
const checkLoggedIn = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
};

// poto-profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // Simpan gambar di folder "uploads/"
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname); // Nama file unik
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Batas ukuran file (misalnya, 5MB)
  },
});

// Routing
app.get("/", (req, res) => {
  res.redirect("/index");
});

// Route Login
app.get("/login", (req, res) => {
  res.render("login");
});

// Route Signup
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Route Dashboard

app.get("/index", (req, res) => {
  if (req.session.userId) {
    const userId = req.session.userId;
    Pasien.findOne({ where: { id_pasien: userId } })
      .then((user) => {
        if (user) {
          const { nama_pasien, foto_pasien } = user;
          const id_pasien = userId;
          res.render("index", {
            nama: nama_pasien,
            id_pasien: id_pasien,
            foto_pasien: foto_pasien,
            isLoggedIn: true,
          });
        } else {
          res.redirect("/login");
        }
      })
      .catch((err) => {
        console.error("Kesalahan saat mencari data pasien:", err);
        res.status(500).send("Terjadi kesalahan saat mencari data pasien.");
      });
  } else {
    res.render("index", {
      nama: null,
      id_pasien: null,
      foto_pasien: null,
      isLoggedIn: false,
    });
  }
});

// Route untuk halaman profil

app.get("/profile", checkLoggedIn, async (req, res) => {
  try {
    const id_pasien = req.session.userId;
    const email_pasien = req.session.email_pasien;

    // Menggunakan Sequelize untuk mengambil data pengguna dari tb_pasien
    const profileData = await Pasien.findByPk(id_pasien, {
      attributes: [
        "foto_pasien",
        "id_pasien",
        "email_pasien",
        "nama_pasien",
        [
          sequelize.literal(
            "CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ')"
          ),
          "nama_pendek",
        ],
        "gender",
        "alamat",
        "nomor_ponsel",
      ],
    });

    if (profileData) {
      // Menggunakan Sequelize untuk mengambil data appointment dari tb_appointment
      const appointmentData = await Appointment.findOne({
        where: { id_pasien },
        attributes: ["tanggal", "waktu"],
        order: [["tanggal", "DESC"]], // Sesuaikan dengan urutan yang Anda inginkan
      });

      // Mengambil data appointment jika ada
      if (appointmentData) {
        const formattedDate = moment(appointmentData.tanggal).format(
          "dddd, MMM DD YYYY"
        );
        profileData.setDataValue("tanggal", formattedDate);
        profileData.setDataValue("waktu", appointmentData.waktu);

        // Menggunakan Sequelize untuk mengambil data pembayaran dari tb_pembayaran sesuai dengan id_pasien dan email_pasien
        const pembayaranData = await Pembayaran.findOne({
          where: { id_pasien, email_pasien },
          attributes: [
            "jumlah_biaya",
            "tanggal_bayar",
            "status_bayar",
            "metode_pembayaran",
          ],
        });

        // Mengambil data pembayaran jika ada
        if (pembayaranData) {
          profileData.setDataValue("jumlah_bayar", pembayaranData.jumlah_biaya);
          profileData.setDataValue("status_bayar", pembayaranData.status_bayar);
        } else {
          // Jika tidak ada data pembayaran, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
          profileData.setDataValue("jumlah_bayar", 70000); // Atur jumlah bayar sesuai dengan ketentuan
          profileData.setDataValue("status_bayar", "Belum"); // Set status bayar ke "Belum"
        }
      } else {
        // Jika tidak ada appointment, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
        profileData.setDataValue("jumlah_bayar", "-");
        profileData.setDataValue("status_bayar", "-");
      }

      // Render halaman profil dengan data pengguna, data pembayaran, dan data appointment
      res.render("profile.html", { profileData });
    } else {
      res.status(404).send("Data pengguna tidak ditemukan.");
    }
  } catch (error) {
    console.error("Kesalahan saat mengambil data profil:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data profil.");
  }
});

// Edit Profile

app.get("/edit_profile", checkLoggedIn, async (req, res) => {
  try {
    const id_pasien = req.session.userId;

    // Menggunakan Sequelize untuk mengambil data pengguna dari tb_pasien
    const profileData = await Pasien.findByPk(id_pasien, {
      attributes: [
        "foto_pasien",
        [
          sequelize.literal(
            "CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ')"
          ),
          "nama_pendek",
        ],
        "email_pasien",
        "nama_pasien",
        "alamat",
        "nomor_ponsel",
      ],
    });

    if (profileData) {
      // Render halaman edit profil dengan data pengguna
      res.render("edit_profile", { profileData });
    } else {
      res.status(404).send("Data pengguna tidak ditemukan.");
    }
  } catch (error) {
    console.error("Kesalahan saat mengambil data profil:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data profil.");
  }
});

// Route Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/index");
  });
});

// Route untuk Appointment

app.get("/appointment", async (req, res) => {
  try {
    if (req.session.userId) {
      const userId = req.session.userId;

      // Menggunakan Sequelize untuk mengambil data pengguna dari tb_pasien
      const profileData = await Pasien.findByPk(userId, {
        attributes: [
          "id_pasien",
          "nama_pasien",
          "email_pasien",
          "foto_pasien",
          [
            sequelize.literal(
              "CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ')"
            ),
            "nama_pendek",
          ],
        ],
      });

      if (profileData) {
        // Menggunakan Sequelize untuk mengambil daftar nama psikolog dari tb_psikolog
        const psikolog = await Psikolog.findAll({
          attributes: ["id_psikolog", "nama_psikolog"],
        });

        // Render halaman appointment dengan data nama pasien, psikolog, email_pasien, dan id_pasien
        res.render("appointment", {
          nama: profileData.nama_pasien,
          psikolog,
          email_pasien: profileData.email_pasien,
          id_pasien: profileData.id_pasien,
          foto_pasien: profileData.foto_pasien,
          nama_pendek: profileData.nama_pendek,
        });
      } else {
        res.status(404).send("Data pengguna tidak ditemukan.");
      }
    } else {
      // Jika pengguna belum login, kirimkan pesan alert dan arahkan ke halaman login
      const alertMessage = "Anda belum login. Silakan login terlebih dahulu.";
      const loginRedirect = "/login";

      res.send(`
        <script>
          alert('${alertMessage}');
          window.location='${loginRedirect}';
        </script>
      `);
    }
  } catch (error) {
    console.error("Kesalahan saat mengambil data appointment:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data appointment.");
  }
});

// Route untuk halaman pembayaran

app.get("/pembayaran", checkLoggedIn, async (req, res) => {
  try {
    const id_pasien = req.session.userId;
    const nama_pasien = req.session.nama_pasien;
    const email_pasien = req.session.email_pasien;

    // Menggunakan Sequelize untuk memeriksa apakah pengguna memiliki appointment yang aktif
    const appointmentCount = await Appointment.count({
      where: {
        id_pasien,
      },
    });

    if (appointmentCount > 0) {
      // Pengguna memiliki appointment, lanjutkan dengan mengambil data appointment terakhir
      const lastAppointment = await Appointment.findOne({
        where: {
          id_pasien,
        },
        order: [["tanggal", "DESC"]],
      });

      if (lastAppointment) {
        const nama_psikolog = lastAppointment.nama_psikolog;

        // Menggunakan Sequelize untuk mengambil data psikolog berdasarkan nama_psikolog
        const psikologData = await Psikolog.findOne({
          where: {
            nama_psikolog,
          },
          attributes: ["gambar_psikolog", "spesialisasi"],
        });

        // Menggunakan Sequelize untuk mengambil foto_pasien berdasarkan email_pasien
        const pasienData = await Pasien.findOne({
          where: {
            email_pasien,
          },
          attributes: [
            "foto_pasien",
            [
              sequelize.literal(
                "CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ')"
              ),
              "nama_pendek",
            ],
          ],
        });

        // Render halaman pembayaran dengan data pengguna, nama_psikolog, gambar_psikolog, dan spesialisasi
        res.render("pembayaran", {
          id_pasien,
          nama_pasien,
          email_pasien,
          nama_psikolog,
          gambar_psikolog: psikologData.gambar_psikolog,
          spesialisasi: psikologData.spesialisasi,
          nama_pendek: pasienData.nama_pendek,
          foto_pasien: pasienData.foto_pasien,
        });
      } else {
        res.status(404).send("Data appointment tidak ditemukan.");
      }
    } else {
      // Pengguna tidak memiliki appointment, tampilkan pesan kesalahan
      const errorMessage = "Anda tidak memiliki appointment.";
      res.send(`
        <script>
          alert('${errorMessage}');
          window.location='/index'; // Redirect ke halaman awal
        </script>
      `);
    }
  } catch (error) {
    console.error("Kesalahan saat mengambil data pembayaran:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data pembayaran.");
  }
});

// Implementasi POST routes untuk form submission

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});

// INDEX

// SIGNUP

app.post("/signup", upload.single("foto_pasien"), async (req, res) => {
  try {
    const {
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password,
    } = req.body;

    // Ambil file gambar yang diunggah, atau gunakan foto profil default jika tidak ada yang diunggah
    const foto_pasien = req.file ? req.file.path : "public/img/poto-profil.png";

    // Konversi gambar menjadi bentuk Base64 jika diperlukan
    const gambarBase64 = fs.readFileSync(foto_pasien, "base64");

    // Enkripsi kata sandi dengan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan data pengguna ke database menggunakan model Pasien
    await Pasien.sync(); // Sinkronisasi model dengan tabel di database

    const newUser = await Pasien.create({
      foto_pasien: gambarBase64, // Simpan gambar dalam format Base64 (sesuaikan dengan model Anda)
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password: hashedPassword, // Simpan kata sandi yang telah dienkripsi
    });

    // Tampilkan pesan sukses dan arahkan pengguna ke halaman login
    const successMessage = "Pendaftaran berhasil";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/login'; // Ubah '/login' sesuai dengan URL login Anda
      </script>
    `);
  } catch (error) {
    console.error("Gagal mendaftarkan pasien:", error);
    res.status(500).send("Pendaftaran gagal. Coba lagi nanti.");
  }
});

// LOGIN

app.post("/login", async (req, res) => {
  const { email_pasien, password } = req.body;
  try {
    const user = await Pasien.findOne({
      where: { email_pasien: email_pasien },
    });

    if (user) {
      const match = await bcrypt.compare(password, user.password); // Memeriksa kata sandi dengan bcrypt

      if (match) {
        // Kata sandi cocok, lanjutkan
        req.session.userId = user.id_pasien;
        req.session.nama_pasien = user.nama_pasien;
        req.session.email_pasien = user.email_pasien;
        res.render("index", { user: req.session.nama_pasien });
      } else {
        // Kata sandi tidak cocok
        res.send(
          "<script>alert('Password Anda salah'); window.location='/login';</script>"
        );
      }
    } else {
      // Email tidak ditemukan
      res.send(
        "<script>alert('Email tidak ditemukan'); window.location='/login';</script>"
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan dalam proses login");
  }
});

// Profil

app.post("/profile", checkLoggedIn, async (req, res) => {
  try {
    const id_pasien = req.session.userId;
    const { tanggal, waktu } = req.body;

    // Cari appointment berdasarkan id_pasien
    const appointment = await Appointment.findOne({
      where: { id_pasien },
    });

    if (!appointment) {
      return res.status(404).send("Appointment tidak ditemukan");
    }

    // Perbarui tanggal dan waktu appointment
    appointment.tanggal = tanggal;
    appointment.waktu = waktu;

    // Simpan perubahan ke dalam database
    await appointment.save();

    // Tampilkan pesan sukses dan arahkan kembali ke halaman profil
    const successMessage = "Appointment berhasil diperbarui";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/profile'; // Redirect ke halaman profil
      </script>
    `);
  } catch (error) {
    console.error("Kesalahan saat memperbarui appointment:", error);
    res.status(500).send("Terjadi kesalahan saat memperbarui appointment.");
  }
});

// Update Profil

app.post(
  "/edit_profile",
  checkLoggedIn,
  upload.single("foto_pasien"),
  async (req, res) => {
    try {
      const id_pasien = req.session.userId;
      const { nama_pasien, email_pasien, gender, alamat, nomor_ponsel } =
        req.body;

      // Jika foto profil berhasil diunggah, Anda dapat menghandle pembaruan gambar profil di sini
      if (req.file) {
        const newProfilePicturePath = req.file.path;

        // Membaca gambar dan mengonversi ke base64
        const newProfilePictureBase64 = await fs.promises.readFile(
          newProfilePicturePath,
          { encoding: "base64" }
        );

        // Perbarui kolom foto_pasien dengan gambar baru
        await Pasien.update(
          { foto_pasien: newProfilePictureBase64 },
          { where: { id_pasien } }
        );

        // Jika query berhasil dijalankan, maka Anda dapat mengirimkan respons sukses
        const successMessage = "Foto profil berhasil diperbarui";
        res.send(`
        <script>
          alert('${successMessage}');
          window.location='/profile'; // Redirect ke halaman profil
        </script>
      `);
      } else {
        // Jika tidak ada file yang diunggah, lakukan pembaruan data profil tanpa foto
        await Pasien.update(
          { nama_pasien, email_pasien, gender, alamat, nomor_ponsel },
          { where: { id_pasien } }
        );

        // Setelah pembaruan berhasil, tampilkan pesan sukses dan arahkan ke halaman profil
        const successMessage = "Profil berhasil diperbarui";
        res.send(`
        <script>
          alert('${successMessage}');
          window.location='/profile'; // Redirect ke halaman profil
        </script>
      `);
      }
    } catch (error) {
      // Handle kesalahan jika ada
      console.error("Kesalahan saat memperbarui profil:", error);
      res.status(500).send("Terjadi kesalahan saat memperbarui profil.");
    }
  }
);

// APPOINTMENT

app.post("/appointment", async (req, res) => {
  try {
    const { nama_pasien, nama_psikolog, tanggal, waktu, keluhan } = req.body;
    const email_pasien = req.session.email_pasien; // Mengambil email_pasien dari sesi

    // Cari data pasien berdasarkan nama_pasien dan email_pasien
    const pasien = await Pasien.findOne({
      where: { nama_pasien, email_pasien },
    });

    if (!pasien) {
      res.status(400).send("Nama pasien tidak ditemukan"); // Handle jika nama pasien tidak ditemukan
      return;
    }

    // Cari data psikolog berdasarkan nama_psikolog
    const psikolog = await Psikolog.findOne({ where: { nama_psikolog } });

    if (!psikolog) {
      res.status(400).send("Nama psikolog tidak ditemukan"); // Handle jika nama psikolog tidak ditemukan
      return;
    }

    // Simpan data appointment ke database
    const appointment = {
      id_pasien: pasien.id_pasien,
      email_pasien,
      nama_pasien,
      nama_psikolog,
      tanggal,
      waktu,
      keluhan,
    };

    await Appointment.create(appointment);

    // Tampilkan pesan sukses dan arahkan kembali ke halaman dashboard
    const successMessage = "Appointment berhasil";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/index';
      </script>
    `);
  } catch (error) {
    // Handle kesalahan jika ada
    console.error("Kesalahan saat membuat appointment:", error);
    res.status(500).send("Terjadi kesalahan saat membuat appointment.");
  }
});

// Route untuk memproses pembayaran

app.post("/proses_pembayaran", checkLoggedIn, async (req, res) => {
  try {
    const {
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      metode_pembayaran,
    } = req.body;

    // Simpan data pembayaran ke tabel tb_pembayaran
    const tanggal_bayar = new Date();

    await Pembayaran.create({
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      tanggal_bayar,
      metode_pembayaran,
    });

    // Tampilkan pesan sukses dan arahkan pengguna ke halaman lain jika diperlukan
    const successMessage = "Pembayaran berhasil";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/index'; // Ubah '/dashboard' sesuai dengan URL yang sesuai
      </script>
    `);
  } catch (error) {
    // Handle kesalahan jika ada
    console.error("Kesalahan saat menyimpan data pembayaran:", error);
    res.status(500).send("Terjadi kesalahan saat menyimpan data pembayaran.");
  }
});
