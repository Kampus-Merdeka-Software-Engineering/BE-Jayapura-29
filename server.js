const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const app = express();
const multer = require("multer");
const fs = require("fs");
const moment = require("moment-timezone");
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const signupRouter = require("./routes/signup");
const loginRouter = require("./routes/login");
const appointmentRoutes = require("./routes/appointment");
const profileRoutes = require("./routes/profile");

// Set zona waktu server ke "Asia/Jakarta"
moment.tz.setDefault("Jakarta");

// Import file konfigurasi database Sequelize
const sequelize = require("./config/database");

// Import model-model Sequelize
const Pasien = require("./models/pasien");
const Psikolog = require("./models/psikolog");
const Appointment = require("./models/appointment");
const Pembayaran = require("./models/pembayaran");

// Sinkronisasi model dengan database
sequelize
  .sync()
  .then(() => {
    console.log("Tabel telah disinkronkan dengan database.");
  })
  .catch((err) => {
    console.error("Gagal menyeimbangkan tabel:", err);
  });

// Konfigurasi Express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Inisialisasi session
app.use(
  session({
    secret: "your-secret-key", // Ganti dengan kunci rahasia yang kuat
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Folder untuk file publik (CSS, gambar, dll.)

// Middleware untuk memeriksa apakah pengguna sudah login
function checkLoggedIn(req, res, next) {
  if (req.session.userId) {
    // Jika pengguna sudah login, lanjutkan ke halaman appointment.html
    next();
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
}

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

app.use(express.static(path.join(__dirname, "views"))); // Serve file statis

// Routing

// Rute untuk menampilkan halaman utama (belum login)
app.get("/", (req, res) => {
  const indexHtml = fs.readFileSync(
    path.join(__dirname, "views", "index.html"),
    "utf8"
  );
  res.send(indexHtml);
});

// Rute untuk menampilkan halaman utama (sudah login)
app.get("/index2", (req, res) => {
  if (req.session.userId) {
    const index2Html = fs.readFileSync(
      path.join(__dirname, "views", "index2.html"),
      "utf8"
    );
    // Mengganti placeholder dengan nilai yang sesuai dari sesi
    const renderedHtml = index2Html
      .replace("<%= nama_pendek %>", req.session.nama_pendek || "")
      .replace("<%= foto_pasien %>", req.session.foto_pasien || "");

    res.send(renderedHtml);
  } else {
    res.redirect("/login"); // Mengarahkan ke halaman login jika pengguna belum masuk
  }
});

// Route Login

app.use("/", loginRouter);
app.get("/login", (req, res) => {
  const loginHtml = fs.readFileSync(
    path.join(__dirname, "views", "login.html"),
    "utf8"
  );
  res.send(loginHtml);
});

// Route Signup
app.use("/", signupRouter);
app.get("/signup", (req, res) => {
  const signupHtml = fs.readFileSync(
    path.join(__dirname, "views", "signup.html"),
    "utf8"
  );
  res.send(signupHtml);
});

// Route Dashboard

app.get("/index", (req, res) => {
  if (req.session.email_pasien) {
    // Ubah req.session.userId menjadi req.session.email_pasien
    const email_pasien = req.session.email_pasien; // Ubah userId menjadi email_pasien
    Pasien.findOne({ where: { email_pasien: email_pasien } }) // Ubah id menjadi email_pasien
      .then((user) => {
        if (user) {
          const { nama_pasien, foto_pasien } = user;
          const id_pasien = user.id_pasien; // Menggunakan id yang sesuai dengan pengguna
          const isLoggedIn = true;

          // Mengambil dua kata pertama dari nama_pasien
          const namaPasienArray = nama_pasien.split(" ");
          const duaKataPertama = namaPasienArray.slice(0, 2).join(" ");

          res.sendFile(path.join(__dirname, "views", "index2.html"), {
            nama: duaKataPertama,
            id_pasien: id_pasien,
            foto_pasien: foto_pasien,
            isLoggedIn: isLoggedIn,
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
    const isLoggedIn = false;
    res.sendFile(path.join(__dirname, "views", "index.html"), {
      nama: null,
      id_pasien: null,
      foto_pasien: null,
      isLoggedIn: isLoggedIn,
    });
  }
});

// Route untuk Appointment
app.use(express.json());
app.use("/appointment", appointmentRoutes);
app.get("/appointment", checkLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "appointment.html"));
});

// app.get("/appointment", (req, res) => {
//   if (req.session.userId) {
//     // Jika pengguna sudah login, tampilkan pesan
//     res.sendFile(path.join(__dirname, "views", "appointment.html"));
//   } else {
//     // Jika pengguna belum login, kirimkan pesan alert dan arahkan ke halaman login
//     const alertMessage = "Anda belum login. Silakan login terlebih dahulu.";
//     const loginRedirect = "/login";

//     res.send(`
//     <script>
//     alert('${alertMessage}');
//     window.location='${loginRedirect}';
//     </script>
//     `);
//   }
// });

// app.get("/appointment", async (req, res) => {
//   try {
//     // Mengambil userId yang sudah login berdasarkan session
//     const userId = req.session.userId; // Gantilah sesuai dengan cara Anda menyimpan userId setelah login

//     if (!userId) {
//       return res.status(404).send("User tidak ditemukan");
//     }

//     // Mengambil data pasien berdasarkan userId
//     const pasien = await Pasien.findByPk(userId); // Menggunakan findByPk untuk mencari berdasarkan primary key

//     if (!pasien) {
//       return res.status(404).send("Pasien tidak ditemukan");
//     }

//     // Mengambil daftar psikolog
//     const psikologs = await Psikolog.findAll();

//     res.sendFile(path.join(__dirname, "views", "appointment.html"));
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Terjadi kesalahan");
//   }
// });
// Route untuk halaman pembayaran

app.get("/pembayaran", async (req, res) => {
  try {
    // Ambil data psikolog dari database
    const psikologData = {
      nama_psikolog: "Nama Psikolog", // Ganti dengan data psikolog yang sesuai
      spesialisasi: "Spesialisasi Psikolog", // Ganti dengan data spesialisasi yang sesuai
    };

    // Mendapatkan jalur file pembayaran.html
    const filePath = path.join(__dirname, "../public/pembayaran.html");

    // Kirim file HTML sebagai respons
    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat memuat halaman pembayaran." });
  }
});
// app.get("/pembayaran", checkLoggedIn, async (req, res) => {
//   try {
//     const id_pasien = req.session.userId;
//     const nama_pasien = req.session.nama_pasien;
//     const email_pasien = req.session.email_pasien;

//     // Menggunakan Sequelize untuk memeriksa apakah pengguna memiliki appointment yang aktif
//     const appointmentCount = await Appointment.count({
//       where: {
//         id_pasien,
//       },
//     });

//     if (appointmentCount > 0) {
//       // Pengguna memiliki appointment, lanjutkan dengan mengambil data appointment terakhir
//       const lastAppointment = await Appointment.findOne({
//         where: {
//           id_pasien,
//         },
//         order: [["tanggal", "DESC"]],
//       });

//       if (lastAppointment) {
//         const nama_psikolog = lastAppointment.nama_psikolog;

//         // Menggunakan Sequelize untuk mengambil data psikolog berdasarkan nama_psikolog
//         const psikologData = await Psikolog.findOne({
//           where: {
//             nama_psikolog,
//           },
//           attributes: ["gambar_psikolog", "spesialisasi"],
//         });

//         // Menggunakan Sequelize untuk mengambil foto_pasien berdasarkan email_pasien
//         const pasienData = await Pasien.findOne({
//           where: {
//             email_pasien,
//           },
//           attributes: [
//             "foto_pasien",
//             [
//               sequelize.literal(
//                 "CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ')"
//               ),
//               "nama_pendek",
//             ],
//           ],
//         });

//         // Render halaman pembayaran dengan data pengguna, nama_psikolog, gambar_psikolog, dan spesialisasi
//         res.render("pembayaran", {
//           id_pasien,
//           nama_pasien,
//           email_pasien,
//           nama_psikolog,
//           gambar_psikolog: psikologData.gambar_psikolog,
//           spesialisasi: psikologData.spesialisasi,
//           nama_pendek: pasienData.nama_pendek,
//           foto_pasien: pasienData.foto_pasien,
//         });
//       } else {
//         res.status(404).send("Data appointment tidak ditemukan.");
//       }
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
//   } catch (error) {
//     console.error("Kesalahan saat mengambil data pembayaran:", error);
//     res.status(500).send("Terjadi kesalahan saat mengambil data pembayaran.");
//   }
// });

// Route untuk halaman profil
app.use("/profile", profileRoutes);
app.get("/profile", (req, res) => {
  // Mengirimkan berkas HTML langsung sebagai respons
  res.sendFile(__dirname + "/views/profile.html");
});

// app.get("/profile", checkLoggedIn, async (req, res) => {
//   try {
//     const id = req.session.userId;
//     const email_pasien = req.session.email_pasien;

//     // Menggunakan Sequelize untuk mengambil data pengguna dari tb_pasien
//     const profileData = await Pasien.findByPk(id, {
//       attributes: [
//         "foto_pasien",
//         "id",
//         "email_pasien",
//         "nama_pasien",
//         [
//           sequelize.literal(
//             "CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ')"
//           ),
//           "nama_pendek",
//         ],
//         "gender",
//         "alamat",
//         "nomor_ponsel",
//       ],
//     });

//     if (profileData) {
//       // Menggunakan Sequelize untuk mengambil data appointment dari tb_appointment
//       const appointmentData = await Appointment.findOne({
//         where: { id },
//         attributes: ["tanggal", "waktu"],
//         order: [["tanggal", "DESC"]], // Sesuaikan dengan urutan yang Anda inginkan
//       });

//       // Mengambil data appointment jika ada
//       if (appointmentData) {
//         const formattedDate = moment(appointmentData.tanggal).format(
//           "dddd, MMM DD YYYY"
//         );
//         profileData.setDataValue("tanggal", formattedDate);
//         profileData.setDataValue("waktu", appointmentData.waktu);

//         // Menggunakan Sequelize untuk mengambil data pembayaran dari tb_pembayaran sesuai dengan id dan email_pasien
//         const pembayaranData = await Pembayaran.findOne({
//           where: { id, email_pasien },
//           attributes: [
//             "jumlah_biaya",
//             "tanggal_bayar",
//             "status_bayar",
//             "metode_pembayaran",
//           ],
//         });

//         // Mengambil data pembayaran jika ada
//         if (pembayaranData) {
//           profileData.setDataValue("jumlah_bayar", pembayaranData.jumlah_biaya);
//           profileData.setDataValue("status_bayar", pembayaranData.status_bayar);
//         } else {
//           // Jika tidak ada data pembayaran, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
//           profileData.setDataValue("jumlah_bayar", 70000); // Atur jumlah bayar sesuai dengan ketentuan
//           profileData.setDataValue("status_bayar", "Belum"); // Set status bayar ke "Belum"
//         }
//       } else {
//         // Jika tidak ada appointment, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
//         profileData.setDataValue("jumlah_bayar", "-");
//         profileData.setDataValue("status_bayar", "-");
//       }

//       // Render halaman profil dengan data pengguna, data pembayaran, dan data appointment
//       res.render("profile.html", { profileData });
//     } else {
//       res.status(404).send("Data pengguna tidak ditemukan.");
//     }
//   } catch (error) {
//     console.error("Kesalahan saat mengambil data profil:", error);
//     res.status(500).send("Terjadi kesalahan saat mengambil data profil.");
//   }
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

// Route Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/index");
  });
});

// Implementasi POST routes untuk form submission

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});

// SIGNUP

// app.post("/signup", upload.single("foto_pasien"), async (req, res) => {
//   try {
//     const {
//       nama_pasien,
//       tanggal_lahir,
//       gender,
//       nomor_ponsel,
//       email_pasien,
//       alamat,
//       password,
//     } = req.body;

//     // Ambil file gambar yang diunggah, atau gunakan foto profil default jika tidak ada yang diunggah
//     const foto_pasien = req.file ? req.file.path : "public/img/poto-profil.png";

//     // Konversi gambar menjadi bentuk Base64 jika diperlukan
//     const gambarBase64 = fs.readFileSync(foto_pasien, "base64");

//     // Enkripsi kata sandi dengan bcrypt
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Simpan data pengguna ke database menggunakan model Pasien
//     await Pasien.sync(); // Sinkronisasi model dengan tabel di database

//     const newUser = await Pasien.create({
//       foto_pasien: gambarBase64, // Simpan gambar dalam format Base64 (sesuaikan dengan model Anda)
//       nama_pasien,
//       tanggal_lahir,
//       gender,
//       nomor_ponsel,
//       email_pasien,
//       alamat,
//       password: hashedPassword, // Simpan kata sandi yang telah dienkripsi
//     });

//     // Tampilkan pesan sukses dan arahkan pengguna ke halaman login
//     const successMessage = "Pendaftaran berhasil";
//     res.send(`
//       <script>
//         alert('${successMessage}');
//         window.location='/login'; // Ubah '/login' sesuai dengan URL login Anda
//       </script>
//     `);
//   } catch (error) {
//     console.error("Gagal mendaftarkan pasien:", error);
//     res.status(500).send("Pendaftaran gagal. Coba lagi nanti.");
//   }
// });

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
        res.sendFile(path.join(__dirname, "views", "index2.html"));
      } else {
        // Kata sandi tidak cocok
        res.send(
          '<script>alert("Password Anda salah"); window.location="/login";</script>'
        );
      }
    } else {
      // Email tidak ditemukan
      res.send(
        '<script>alert("Email tidak ditemukan"); window.location="/login";</script>'
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

    // Cari appointment berdasarkan id
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

// app.post("/appointment", async (req, res) => {
//   try {
//     const { nama_pasien, nama_psikolog, tanggal, waktu, keluhan } = req.body;
//     const email_pasien = req.session.email_pasien; // Mengambil email_pasien dari sesi

//     // Cari data pasien berdasarkan nama_pasien dan email_pasien
//     const pasien = await Pasien.findOne({
//       where: { nama_pasien, email_pasien },
//     });

//     if (!pasien) {
//       res.status(400).send("Nama pasien tidak ditemukan"); // Handle jika nama pasien tidak ditemukan
//       return;
//     }

//     // Cari data psikolog berdasarkan nama_psikolog
//     const psikolog = await Psikolog.findOne({ where: { nama_psikolog } });

//     if (!psikolog) {
//       res.status(400).send("Nama psikolog tidak ditemukan"); // Handle jika nama psikolog tidak ditemukan
//       return;
//     }

//     // Simpan data appointment ke database
//     const appointment = {
//       id: pasien.id,
//       email_pasien,
//       nama_pasien,
//       nama_psikolog,
//       tanggal,
//       waktu,
//       keluhan,
//     };

//     await Appointment.create(appointment);

//     // Tampilkan pesan sukses dan arahkan kembali ke halaman dashboard
//     const successMessage = "Appointment berhasil";
//     res.send(`
//       <script>
//         alert('${successMessage}');
//         window.location='/index';
//       </script>
//     `);
//   } catch (error) {
//     // Handle kesalahan jika ada
//     console.error("Kesalahan saat membuat appointment:", error);
//     res.status(500).send("Terjadi kesalahan saat membuat appointment.");
//   }
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
