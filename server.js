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

// Konfigurasi koneksi MySQL
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "db_rumah_sakit",
// });

// Import file konfigurasi database Sequelize
const sequelize = require("./config/database");

// Import model-model Sequelize
const Pasien = require("./models/pasien");
const Psikolog = require("./models/psikolog");
const Appointment = require("./models/appointment");
const Pembayaran = require("./models/pembayaran");

// db.connect((err) => {
//   if (err) throw err;
//   console.log("Terhubung ke MySQL");
// });

// Konfigurasi Express
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.static(path.join(__dirname, "views")));

app.engine("html", require("ejs").renderFile); // Menggunakan ejs sebagai view engine untuk file HTML
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
    Pasien.findByPk(userId)
      .then((user) => {
        if (user) {
          const { nama_pasien, foto_pasien } = user;
          const id_pasien = userId;
          res.render("index", {
            nama: nama_pasien,
            id_pasien: id_pasien,
            foto_pasien: foto_pasien,
            isLoggedIn: true, // Add a flag to indicate the user is logged in
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
      isLoggedIn: false, // Add a flag to indicate the user is not logged in
    });
  }
});

// app.get("/index", (req, res) => {
//   if (req.session.userId) {
//     const userId = req.session.userId;
//     const query =
//       "SELECT CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek, foto_pasien FROM tb_pasien WHERE id_pasien = ?";
//     db.query(query, [userId], (err, results) => {
//       if (err) throw err;
//       if (results.length === 1) {
//         const { nama_pendek, foto_pasien } = results[0];
//         const id_pasien = userId;
//         res.render("index", {
//           nama: nama_pendek,
//           id_pasien: id_pasien,
//           foto_pasien: foto_pasien,
//         });
//       } else {
//         res.redirect("/login");
//       }
//     });
//   } else {
//     res.render("index", {
//       nama: null,
//       id_pasien: null,
//       foto_pasien: null,
//     });
//   }
// });

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

// app.get("/profile", checkLoggedIn, (req, res) => {
//   const id_pasien = req.session.userId;
//   const email_pasien = req.session.email_pasien;

//   // Query SQL untuk mengambil data pengguna dari tb_pasien
//   const query =
//     "SELECT foto_pasien, id_pasien, email_pasien, nama_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek, gender, alamat, nomor_ponsel FROM tb_pasien WHERE id_pasien = ?";

//   db.query(query, [id_pasien], (err, results) => {
//     if (err) {
//       throw err;
//     }

//     if (results.length === 1) {
//       const profileData = results[0];

//       // Query SQL untuk mengambil data appointment dari tb_appointment
//       const appointmentQuery =
//         "SELECT tanggal, waktu FROM tb_appointment WHERE id_pasien = ?";

//       db.query(appointmentQuery, [id_pasien], (err, appointmentResults) => {
//         if (err) {
//           throw err;
//         }

//         // Mengambil data appointment jika ada
//         if (appointmentResults.length > 0) {
//           const appointmentData = appointmentResults[0];
//           const formattedDate = moment(appointmentData.tanggal).format(
//             "dddd, MMM DD YYYY"
//           );
//           profileData.tanggal = formattedDate;
//           profileData.waktu = appointmentData.waktu;

//           // Query SQL untuk mengambil data pembayaran dari tb_pembayaran sesuai dengan id_pasien dan email_pasien
//           const pembayaranQuery =
//             "SELECT jumlah_biaya, tanggal_bayar, status_bayar, metode_pembayaran FROM tb_pembayaran WHERE id_pasien = ? AND email_pasien = ?";

//           db.query(
//             pembayaranQuery,
//             [id_pasien, email_pasien],
//             (err, pembayaranResults) => {
//               if (err) {
//                 throw err;
//               }

//               // Mengambil data pembayaran jika ada
//               if (pembayaranResults.length === 1) {
//                 const pembayaranData = pembayaranResults[0];
//                 profileData.jumlah_bayar = pembayaranData.jumlah_biaya;
//                 profileData.status_bayar = pembayaranData.status_bayar; // Menggunakan status bayar dari data pembayaran
//               } else {
//                 // Jika tidak ada data pembayaran, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
//                 profileData.jumlah_bayar = 70000; // Atur jumlah bayar sesuai dengan ketentuan
//                 profileData.status_bayar = "Belum"; // Set status bayar ke "Belum"
//               }

//               // Render halaman profil dengan data pengguna, data pembayaran, dan data appointment
//               res.render("profile.html", { profileData });
//             }
//           );
//         } else {
//           // Jika tidak ada appointment, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
//           profileData.jumlah_bayar = "-";
//           profileData.status_bayar = "-";

//           // Render halaman profil dengan data pengguna, data pembayaran, dan data appointment
//           res.render("profile.html", { profileData });
//         }
//       });
//     }
//   });
// });

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

// app.get("/edit_profile", checkLoggedIn, (req, res) => {
//   const id_pasien = req.session.userId;

//   // Query SQL untuk mengambil data pengguna dari tb_pasien
//   const query =
//     "SELECT foto_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek, email_pasien, nama_pasien, alamat, nomor_ponsel FROM tb_pasien WHERE id_pasien = ?";

//   db.query(query, [id_pasien], (err, results) => {
//     if (err) {
//       throw err;
//     }

//     if (results.length === 1) {
//       const profileData = results[0];

//       // Render halaman edit profil dengan data pengguna
//       res.render("edit_profile", { profileData });
//     }
//   });
// });

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

// app.get("/appointment", (req, res) => {
//   if (req.session.userId) {
//     const userId = req.session.userId;
//     const query =
//       "SELECT id_pasien, nama_pasien, email_pasien, foto_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek FROM tb_pasien WHERE id_pasien = ?";

//     db.query(query, [userId], (err, results) => {
//       if (err) {
//         throw err;
//       }
//       if (results.length === 1) {
//         const id_pasien = results[0].id_pasien;
//         const nama_pasien = results[0].nama_pasien;
//         const email_pasien = results[0].email_pasien;
//         const foto_pasien = results[0].foto_pasien;
//         const nama_pendek = results[0].nama_pendek;

//         // Ambil daftar nama psikolog dari database
//         db.query(
//           "SELECT id_psikolog, nama_psikolog FROM tb_psikolog",
//           (err, psikolog) => {
//             if (err) {
//               throw err;
//             }

//             // Render halaman appointment dengan data nama pasien, psikolog, email_pasien, dan id_pasien
//             res.render("appointment", {
//               nama: nama_pasien,
//               psikolog,
//               email_pasien,
//               id_pasien,
//               foto_pasien,
//               nama_pendek,
//             });
//           }
//         );
//       }
//     });
//   } else {
//     // Jika pengguna belum login, kirimkan pesan alert dan arahkan ke halaman login
//     const alertMessage = "Anda belum login. Silakan login terlebih dahulu.";
//     const loginRedirect = "/login";

//     res.send(`
//       <script>
//         alert('${alertMessage}');
//         window.location='${loginRedirect}';
//       </script>
//     `);
//   }
// });

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

// app.get("/pembayaran", checkLoggedIn, (req, res) => {
//   const id_pasien = req.session.userId;
//   const nama_pasien = req.session.nama_pasien;
//   const email_pasien = req.session.email_pasien;

//   // Query SQL untuk memeriksa apakah pengguna memiliki appointment yang aktif
//   const checkAppointmentQuery =
//     "SELECT COUNT(*) AS appointmentCount FROM tb_appointment WHERE id_pasien = ?";

//   db.query(checkAppointmentQuery, [id_pasien], (err, appointmentResult) => {
//     if (err) {
//       console.error("Kesalahan saat memeriksa appointment:", err);
//       res.status(500).send("Terjadi kesalahan saat memeriksa appointment.");
//       return;
//     }

//     const appointmentCount = appointmentResult[0].appointmentCount;

//     if (appointmentCount > 0) {
//       // Pengguna memiliki appointment, lanjutkan dengan mengambil data appointment terakhir
//       const getLastAppointmentQuery =
//         "SELECT nama_psikolog FROM tb_appointment WHERE id_pasien = ? ORDER BY tanggal DESC LIMIT 1";

//       db.query(
//         getLastAppointmentQuery,
//         [id_pasien],
//         (err, appointmentResult) => {
//           if (err) {
//             console.error("Kesalahan saat mengambil data appointment:", err);
//             res
//               .status(500)
//               .send("Terjadi kesalahan saat mengambil data appointment.");
//             return;
//           }

//           // Menyimpan nama_psikolog dari hasil query
//           const nama_psikolog = appointmentResult[0]
//             ? appointmentResult[0].nama_psikolog
//             : "";

//           // Mengambil data psikolog berdasarkan nama_psikolog
//           const getPsikologQuery =
//             "SELECT gambar_psikolog, spesialisasi FROM tb_psikolog WHERE nama_psikolog = ?";

//           db.query(getPsikologQuery, [nama_psikolog], (err, psikologResult) => {
//             if (err) {
//               console.error("Kesalahan saat mengambil data psikolog:", err);
//               res
//                 .status(500)
//                 .send("Terjadi kesalahan saat mengambil data psikolog.");
//               return;
//             }

//             // Menyimpan data gambar_psikolog dan spesialisasi dari hasil query
//             const gambar_psikolog = psikologResult[0]
//               ? psikologResult[0].gambar_psikolog
//               : "";
//             const spesialisasi = psikologResult[0]
//               ? psikologResult[0].spesialisasi
//               : "";

//             // Query SQL untuk mengambil foto_pasien berdasarkan email_pasien
//             const getFotoPasienQuery =
//               "SELECT foto_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek FROM tb_pasien WHERE email_pasien = ?";

//             db.query(
//               getFotoPasienQuery,
//               [email_pasien],
//               (err, fotoPasienResult) => {
//                 if (err) {
//                   console.error("Kesalahan saat mengambil foto_pasien:", err);
//                   res
//                     .status(500)
//                     .send("Terjadi kesalahan saat mengambil foto_pasien.");
//                   return;
//                 }

//                 // Menyimpan data foto_pasien dari hasil query
//                 const foto_pasien = fotoPasienResult[0]
//                   ? fotoPasienResult[0].foto_pasien
//                   : "";
//                 const nama_pendek = fotoPasienResult[0]
//                   ? fotoPasienResult[0].nama_pendek
//                   : "";

//                 // Render halaman pembayaran dengan data pengguna, nama_psikolog, gambar_psikolog, dan spesialisasi
//                 res.render("pembayaran", {
//                   id_pasien: id_pasien,
//                   nama_pasien: nama_pasien,
//                   email_pasien: email_pasien,
//                   nama_psikolog: nama_psikolog,
//                   gambar_psikolog: gambar_psikolog,
//                   spesialisasi: spesialisasi,
//                   nama_pendek: nama_pendek,
//                   foto_pasien: foto_pasien, // Tambahkan foto_pasien ke dalam rendering context
//                 });
//               }
//             );
//           });
//         }
//       );
//     } else {
//       // Pengguna tidak memiliki appointment, tampilkan pesan kesalahan
//       const errorMessage = "Anda tidak memiliki appointment.";
//       res.send(`
//         <script>
//           alert('${errorMessage}');
//           window.location='/index'; // Redirect ke halaman awal
//         </script>
//       `);
//     }
//   });
// });

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

    // Enkripsi kata sandi
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
      password, // Simpan kata sandi yang telah dienkripsi
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

// app.post("/signup", upload.single("foto_pasien"), (req, res) => {
//   const {
//     nama_pasien,
//     tanggal_lahir,
//     gender,
//     nomor_ponsel,
//     email_pasien,
//     alamat,
//     password,
//   } = req.body;

//   // Ambil file gambar yang diunggah, atau gunakan foto profil default jika tidak ada yang diunggah
//   const foto_pasien = req.file || { path: "public/img/poto-profil.png" };

//   // Konversi gambar menjadi bentuk Base64
//   const gambarBase64 = fs.readFileSync(foto_pasien.path, "base64");

//   // Simpan data pengguna ke database, termasuk gambar profil
//   const user = {
//     foto_pasien: gambarBase64, // Simpan gambar dalam format Base64
//     nama_pasien,
//     tanggal_lahir,
//     gender,
//     nomor_ponsel,
//     email_pasien,
//     alamat,
//     password, // Simpan kata sandi dalam teks biasa (tanpa hashing)
//   };

//   const query = "INSERT INTO tb_pasien SET ?";
//   db.query(query, user, (err, results) => {
//     if (err) {
//       return res.status(500).send("Pendaftaran gagal. Coba lagi nanti.");
//     }

//     // Tampilkan pesan sukses dan arahkan pengguna ke halaman login
//     const successMessage = "Pendaftaran berhasil";
//     res.send(`
//       <script>
//         alert('${successMessage}');
//         window.location='/login'; // Ubah '/login' sesuai dengan URL login Anda
//       </script>
//     `);
//   });
// });

// LOGIN

app.post("/login", async (req, res) => {
  try {
    const { email_pasien, password } = req.body;

    // Cari pengguna berdasarkan email
    const user = await Pasien.findOne({ where: { email_pasien } });

    if (user) {
      // Memeriksa kata sandi tanpa hashing
      if (password === user.password) {
        req.session.userId = user.id_pasien;
        req.session.nama_pasien = user.nama_pasien;
        req.session.email_pasien = user.email_pasien;
        res.redirect("/index");
      } else {
        res.send(
          "<script>alert('Password Anda salah'); window.location='/login';</script>"
        );
      }
    } else {
      res.send(
        "<script>alert('Email tidak ditemukan'); window.location='/login';</script>"
      );
    }
  } catch (error) {
    console.error("Gagal login:", error);
    res.status(500).send("Terjadi kesalahan saat login.");
  }
});

// app.post("/login", async (req, res) => {
//   try {
//     const { email_pasien, password } = req.body;

//     // Cari pengguna berdasarkan email
//     const user = await Pasien.findOne({ where: { email_pasien } });

//     if (user) {
//       // Memeriksa kata sandi dengan bcrypt
//       const passwordMatch = await bcrypt.compare(password, user.password);

//       if (passwordMatch) {
//         // Sesuaikan sesi pengguna di sini
//         req.session.userId = user.id_pasien;
//         req.session.nama_pasien = user.nama_pasien;
//         req.session.email_pasien = user.email_pasien; // Menyimpan email_pasien dalam sesi
//         res.redirect("/index");
//       } else {
//         res.send(
//           "<script>alert('Password Anda salah'); window.location='/login';</script>"
//         );
//       }
//     } else {
//       res.send(
//         "<script>alert('Email tidak ditemukan'); window.location='/login';</script>"
//       );
//     }
//   } catch (error) {
//     console.error("Gagal login:", error);
//     res.status(500).send("Terjadi kesalahan saat login.");
//   }
// });

// app.post("/login", (req, res) => {
//   const { email_pasien, password } = req.body;
//   const query = "SELECT * FROM tb_pasien WHERE email_pasien = ?";

//   db.query(query, [email_pasien], (err, results) => {
//     if (err) throw err;

//     if (results.length === 1) {
//       const user = results[0];
//       if (password === user.password) {
//         // Memeriksa kata sandi tanpa hashing
//         // Sesuaikan sesi pengguna di sini
//         req.session.userId = user.id_pasien;
//         req.session.nama_pasien = user.nama_pasien;
//         req.session.email_pasien = user.email_pasien; // Menyimpan email_pasien dalam sesi
//         res.redirect("/index");
//       } else {
//         res.send(
//           "<script>alert('Password Anda salah'); window.location='/login';</script>"
//         );
//       }
//     } else {
//       res.send(
//         "<script>alert('Email tidak ditemukan'); window.location='/login';</script>"
//       );
//     }
//   });
// });

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

// app.post("/profile", checkLoggedIn, (req, res) => {
//   const id_pasien = req.session.userId;
//   const { tanggal, waktu } = req.body;

//   // Query SQL untuk memperbarui tanggal dan waktu appointment di tb_appointment
//   const updateQuery =
//     "UPDATE tb_appointment SET tanggal = ?, waktu = ? WHERE id_pasien = ?";

//   db.query(updateQuery, [tanggal, waktu, id_pasien], (err, result) => {
//     if (err) {
//       console.error("Kesalahan saat memperbarui appointment:", err);
//       return res
//         .status(500)
//         .send("Terjadi kesalahan saat memperbarui appointment.");
//     }

//     // Tampilkan pesan sukses dan arahkan kembali ke halaman profil
//     const successMessage = "Appointment berhasil diperbarui";
//     res.send(`
//       <script>
//         alert('${successMessage}');
//         window.location='/profile'; // Redirect ke halaman profil
//       </script>
//     `);
//   });
// });

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

// app.post(
//   "/edit_profile",
//   checkLoggedIn,
//   upload.single("foto_pasien"),
//   (req, res) => {
//     const id_pasien = req.session.userId;
//     const { nama_pasien, email_pasien, gender, alamat, nomor_ponsel } =
//       req.body;

//     // Jika foto profil berhasil diunggah, Anda dapat menghandle pembaruan gambar profil di sini
//     if (req.file) {
//       const newProfilePicturePath = req.file.path;

//       // Membaca gambar dan mengonversi ke base64
//       fs.readFile(
//         newProfilePicturePath,
//         { encoding: "base64" },
//         (err, data) => {
//           if (err) {
//             // Handle kesalahan jika ada
//             console.error("Kesalahan saat membaca gambar:", err);
//             return res
//               .status(500)
//               .send("Terjadi kesalahan saat membaca gambar.");
//           }

//           const newProfilePictureBase64 = data;

//           // Query SQL untuk mengupdate kolom foto_pasien
//           const updatePhotoQuery =
//             "UPDATE tb_pasien SET foto_pasien = ? WHERE id_pasien = ?";

//           db.query(
//             updatePhotoQuery,
//             [newProfilePictureBase64, id_pasien],
//             (err, result) => {
//               if (err) {
//                 // Handle kesalahan jika query gagal
//                 console.error("Kesalahan saat mengupdate foto profil:", err);
//                 return res
//                   .status(500)
//                   .send("Terjadi kesalahan saat mengupdate foto profil.");
//               }

//               // Jika query berhasil dijalankan, maka Anda dapat mengirimkan respons sukses
//               const successMessage = "Foto profil berhasil diperbarui";
//               res.send(`
//               <script>
//                 alert('${successMessage}');
//                 window.location='/profile'; // Redirect ke halaman profil
//               </script>
//             `);
//             }
//           );
//         }
//       );
//     } else {
//       // Jika tidak ada file yang diunggah, lakukan pembaruan data profil tanpa foto
//       const updateQuery =
//         "UPDATE tb_pasien SET nama_pasien = ?, email_pasien = ?, gender =?, alamat = ?, nomor_ponsel = ? WHERE id_pasien = ?";

//       db.query(
//         updateQuery,
//         [nama_pasien, email_pasien, gender, alamat, nomor_ponsel, id_pasien],
//         (err, result) => {
//           if (err) {
//             // Handle kesalahan jika query gagal
//             console.error("Kesalahan saat memperbarui profil:", err);
//             return res
//               .status(500)
//               .send("Terjadi kesalahan saat memperbarui profil.");
//           }

//           // Setelah pembaruan berhasil, tampilkan pesan sukses dan arahkan ke halaman profil
//           const successMessage = "Profil berhasil diperbarui";
//           res.send(`
//             <script>
//               alert('${successMessage}');
//               window.location='/profile'; // Redirect ke halaman profil
//             </script>
//           `);
//         }
//       );
//     }
//   }
// );

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

// app.post("/appointment", (req, res) => {
//   const { nama_pasien, nama_psikolog, tanggal, waktu, keluhan } = req.body;
//   const email_pasien = req.session.email_pasien; // Mengambil email_pasien dari sesi

//   // Query SQL untuk mengambil id_pasien berdasarkan nama_pasien
//   const getIdPasienQuery =
//     "SELECT id_pasien FROM tb_pasien WHERE nama_pasien = ? AND email_pasien = ?";

//   db.query(
//     getIdPasienQuery,
//     [nama_pasien, email_pasien],
//     (err, pasienResults) => {
//       if (err) {
//         throw err;
//       }

//       if (pasienResults.length === 0) {
//         res.status(400).send("Nama pasien tidak ditemukan"); // Handle jika nama pasien tidak ditemukan
//         return;
//       }

//       const id_pasien = pasienResults[0].id_pasien; // Mengambil id_pasien yang sesuai

//       // Query SQL untuk mengambil nama_psikolog berdasarkan id_psikolog
//       const getIdPsikologQuery =
//         "SELECT nama_psikolog FROM tb_psikolog WHERE id_psikolog = ?";

//       db.query(getIdPsikologQuery, [nama_psikolog], (err, psikologResults) => {
//         if (err) {
//           throw err;
//         }

//         if (psikologResults.length === 0) {
//           res.status(400).send("Nama psikolog tidak ditemukan"); // Handle jika nama psikolog tidak ditemukan
//           return;
//         }

//         const nama_psikolog = psikologResults[0].nama_psikolog; // Mengambil nama_psikolog yang sesuai

//         // Simpan data appointment ke database dengan id_pasien, nama_psikolog, dan email_pasien yang sesuai
//         const appointment = {
//           id_pasien,
//           email_pasien, // Memasukkan email_pasien yang sesuai
//           nama_pasien,
//           nama_psikolog,
//           tanggal,
//           waktu,
//           keluhan,
//         };

//         // Query SQL untuk memasukkan data appointment ke dalam tb_appointment
//         const insertQuery = "INSERT INTO tb_appointment SET ?";

//         db.query(insertQuery, appointment, (err, result) => {
//           if (err) {
//             throw err;
//           }

//           // Tampilkan pesan sukses dan arahkan kembali ke halaman dashboard
//           const successMessage = "Appointment berhasil";
//           res.send(`
//           <script>
//             alert('${successMessage}');
//             window.location='/index';
//           </script>
//         `);
//         });
//       });
//     }
//   );
// });

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

// app.post("/proses_pembayaran", checkLoggedIn, (req, res) => {
//   const id_pasien = req.body.id_pasien;
//   const nama_pasien = req.body.nama_pasien;
//   const email_pasien = req.body.email_pasien;
//   const jumlah_biaya = req.body.jumlah_biaya;
//   const metode_pembayaran = req.body.metode_pembayaran;

//   // Simpan data pembayaran ke tabel tb_pembayaran
//   const tanggal_bayar = new Date();
//   const pembayaran = {
//     id_pasien,
//     nama_pasien,
//     email_pasien,
//     jumlah_biaya,
//     tanggal_bayar,
//     metode_pembayaran,
//   };

//   const insertPembayaranQuery = "INSERT INTO tb_pembayaran SET ?";
//   db.query(insertPembayaranQuery, pembayaran, (err, result) => {
//     if (err) {
//       console.error("Kesalahan saat menyimpan data pembayaran:", err);
//       // Handle kesalahan penyimpanan data pembayaran
//       res.status(500).send("Terjadi kesalahan saat menyimpan data pembayaran.");
//     } else {
//       // Tampilkan pesan sukses dan arahkan pengguna ke halaman lain jika diperlukan
//       const successMessage = "Pembayaran berhasil";
//       res.send(`
//         <script>
//           alert('${successMessage}');
//           window.location='/index'; // Ubah '/dashboard' sesuai dengan URL yang sesuai
//         </script>
//       `);
//     }
//   });
// });
