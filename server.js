const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");
const fs = require("fs");
const signupRouter = require("./routes/signup");
const loginRouter = require("./routes/login");
const appointmentRoutes = require("./routes/appointment");
const profileRoutes = require("./routes/profile");
const pembayaranRoutes = require("./routes/pembayaran");
const editprofileRoutes = require("./routes/edit_profile");
const apiRoutes = require("./routes/api");

const sequelize = require("./config/database");
const Pasien = require("./models/pasien");
const Psikolog = require("./models/psikolog");
const Appointment = require("./models/appointment");
const Pembayaran = require("./models/pembayaran");

sequelize
  .sync()
  .then(() => {
    console.log("Tabel telah disinkronkan dengan database.");
  })
  .catch((err) => {
    console.error("Gagal menyeimbangkan tabel:", err);
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Folder untuk file publik (CSS, gambar, dll.)

function checkLoggedIn(req, res, next) {
  if (req.session.userId && req.session.email_pasien) {
    next();
  } else {
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

app.use(express.static(path.join(__dirname, "views")));

// Routing
app.use("/", apiRoutes);

app.get("/", (req, res) => {
  res.redirect("/index");
});

// Route Login

app.use("/", loginRouter);
app.get("/login", (req, res) => {
  res.render("login");
});

// Route Signup
app.use("/", signupRouter);
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Route Dashboard

app.get("/index", (req, res) => {
  if (req.session.userId) {
    const userId = req.session.userId;
    const query =
      "SELECT CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek, foto_pasien FROM tb_pasien WHERE id_pasien = ?";
    db.query(query, [userId], (err, results) => {
      if (err) throw err;
      if (results.length === 1) {
        const { nama_pendek, foto_pasien } = results[0];
        const id_pasien = userId;
        res.render("index", {
          nama: nama_pendek,
          id_pasien: id_pasien,
          foto_pasien: foto_pasien, // Menambahkan foto_pasien ke konteks template
        });
      } else {
        res.redirect("/login");
      }
    });
  } else {
    res.render("index", {
      nama: null,
      id_pasien: null,
      foto_pasien: null,
    });
  }
});

// Route untuk halaman appointment

// Route untuk halaman profil
app.get("/profile", checkLoggedIn, (req, res) => {
  const id_pasien = req.session.userId;
  const email_pasien = req.session.email_pasien;

  // Query SQL untuk mengambil data pengguna dari tb_pasien
  const query =
    "SELECT foto_pasien, id_pasien, email_pasien, nama_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek, gender, alamat, nomor_ponsel FROM tb_pasien WHERE id_pasien = ?";

  db.query(query, [id_pasien], (err, results) => {
    if (err) {
      throw err;
    }

    if (results.length === 1) {
      const profileData = results[0];

      // Query SQL untuk mengambil data appointment dari tb_appointment
      const appointmentQuery =
        "SELECT tanggal, waktu FROM tb_appointment WHERE id_pasien = ?";

      db.query(appointmentQuery, [id_pasien], (err, appointmentResults) => {
        if (err) {
          throw err;
        }

        // Mengambil data appointment jika ada
        if (appointmentResults.length > 0) {
          const appointmentData = appointmentResults[0];
          const formattedDate = moment(appointmentData.tanggal).format(
            "dddd, MMM DD YYYY"
          );
          profileData.tanggal = formattedDate;
          profileData.waktu = appointmentData.waktu;

          // Query SQL untuk mengambil data pembayaran dari tb_pembayaran sesuai dengan id_pasien dan email_pasien
          const pembayaranQuery =
            "SELECT jumlah_biaya, tanggal_bayar, status_bayar, metode_pembayaran FROM tb_pembayaran WHERE id_pasien = ? AND email_pasien = ?";

          db.query(
            pembayaranQuery,
            [id_pasien, email_pasien],
            (err, pembayaranResults) => {
              if (err) {
                throw err;
              }

              // Mengambil data pembayaran jika ada
              if (pembayaranResults.length === 1) {
                const pembayaranData = pembayaranResults[0];
                profileData.jumlah_bayar = pembayaranData.jumlah_biaya;
                profileData.status_bayar = pembayaranData.status_bayar; // Menggunakan status bayar dari data pembayaran
              } else {
                // Jika tidak ada data pembayaran, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
                profileData.jumlah_bayar = 70000; // Atur jumlah bayar sesuai dengan ketentuan
                profileData.status_bayar = "Belum"; // Set status bayar ke "Belum"
              }

              // Render halaman profil dengan data pengguna, data pembayaran, dan data appointment
              res.render("profile.html", { profileData });
            }
          );
        } else {
          profileData.jumlah_bayar = "-";
          profileData.status_bayar = "-";
          profileData.tanggal_appointment = "Anda belum memiliki appointment";
          profileData.waktu_appointment = "";
        }

        const renderedHtml = profileHtml
          .replace(/<%= profileData.id_pasien %>/g, profileData.id_pasien)
          .replace(/<%= profileData.nama_pasien %>/g, profileData.nama_pasien)
          .replace(/<%= profileData.email_pasien %>/g, profileData.email_pasien)
          .replace(/<%= profileData.gender %>/g, profileData.gender)
          .replace(/<%= profileData.nomor_ponsel %>/g, profileData.nomor_ponsel)
          .replace(/<%= profileData.alamat %>/g, profileData.alamat)
          .replace(/<%= profileData.foto_pasien %>/g, profileData.foto_pasien)
          .replace(/<%= profileData.jumlah_bayar %>/g, profileData.jumlah_bayar)
          .replace(/<%= profileData.status_bayar %>/g, profileData.status_bayar)
          .replace(/<%= profileData.nama_pendek %>/g, profileData.nama_pendek)
          .replace(
            /<%= profileData.tanggal_appointment %>/g,
            `tanggal: ${profileData.tanggal_appointment}`
          )
          .replace(
            /<%= profileData.waktu_appointment %>/g,
            `waktu: ${profileData.waktu_appointment}`
          );

        res.send(renderedHtml);
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      console.error("Kesalahan saat mencari data pasien:", error);
      res.status(500).send("Terjadi kesalahan saat mencari data pasien.");
    }
  } else {
    res.redirect("/login");
  }
});

// Edit Profile
app.get("/edit_profile", checkLoggedIn, (req, res) => {
  const id_pasien = req.session.userId;

  // Query SQL untuk mengambil data pengguna dari tb_pasien
  const query =
    "SELECT foto_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek, email_pasien, nama_pasien, alamat, nomor_ponsel FROM tb_pasien WHERE id_pasien = ?";

  db.query(query, [id_pasien], (err, results) => {
    if (err) {
      throw err;
    }

    if (results.length === 1) {
      const profileData = results[0];

      // Render halaman edit profil dengan data pengguna
      res.render("edit_profile", { profileData });
    }
  });
});

// Route Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/index");
  });
});

// Route untuk Appointment
app.get("/appointment", (req, res) => {
  if (req.session.userId) {
    const userId = req.session.userId;
    const query =
      "SELECT id_pasien, nama_pasien, email_pasien, foto_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek FROM tb_pasien WHERE id_pasien = ?";

    db.query(query, [userId], (err, results) => {
      if (err) {
        throw err;
      }
      if (results.length === 1) {
        const id_pasien = results[0].id_pasien;
        const nama_pasien = results[0].nama_pasien;
        const email_pasien = results[0].email_pasien;
        const foto_pasien = results[0].foto_pasien;
        const nama_pendek = results[0].nama_pendek;

        // Ambil daftar nama psikolog dari database
        db.query(
          "SELECT id_psikolog, nama_psikolog FROM tb_psikolog",
          (err, psikolog) => {
            if (err) {
              throw err;
            }

            // Render halaman appointment dengan data nama pasien, psikolog, email_pasien, dan id_pasien
            res.render("appointment", {
              nama: nama_pasien,
              psikolog,
              email_pasien,
              id_pasien,
              foto_pasien,
              nama_pendek,
            });
          }
        );
      }
    });
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
});
// Route untuk halaman pembayaran
app.get("/pembayaran", checkLoggedIn, (req, res) => {
  const id_pasien = req.session.userId;
  const nama_pasien = req.session.nama_pasien;
  const email_pasien = req.session.email_pasien;

  // Query SQL untuk memeriksa apakah pengguna memiliki appointment yang aktif
  const checkAppointmentQuery =
    "SELECT COUNT(*) AS appointmentCount FROM tb_appointment WHERE id_pasien = ?";

  db.query(checkAppointmentQuery, [id_pasien], (err, appointmentResult) => {
    if (err) {
      console.error("Kesalahan saat memeriksa appointment:", err);
      res.status(500).send("Terjadi kesalahan saat memeriksa appointment.");
      return;
    }

    const appointmentCount = appointmentResult[0].appointmentCount;

    if (appointmentCount > 0) {
      // Pengguna memiliki appointment, lanjutkan dengan mengambil data appointment terakhir
      const getLastAppointmentQuery =
        "SELECT nama_psikolog FROM tb_appointment WHERE id_pasien = ? ORDER BY tanggal DESC LIMIT 1";

      db.query(
        getLastAppointmentQuery,
        [id_pasien],
        (err, appointmentResult) => {
          if (err) {
            console.error("Kesalahan saat mengambil data appointment:", err);
            res
              .status(500)
              .send("Terjadi kesalahan saat mengambil data appointment.");
            return;
          }

          // Menyimpan nama_psikolog dari hasil query
          const nama_psikolog = appointmentResult[0]
            ? appointmentResult[0].nama_psikolog
            : "";

          // Mengambil data psikolog berdasarkan nama_psikolog
          const getPsikologQuery =
            "SELECT gambar_psikolog, spesialisasi FROM tb_psikolog WHERE nama_psikolog = ?";

          db.query(getPsikologQuery, [nama_psikolog], (err, psikologResult) => {
            if (err) {
              console.error("Kesalahan saat mengambil data psikolog:", err);
              res
                .status(500)
                .send("Terjadi kesalahan saat mengambil data psikolog.");
              return;
            }

            // Menyimpan data gambar_psikolog dan spesialisasi dari hasil query
            const gambar_psikolog = psikologResult[0]
              ? psikologResult[0].gambar_psikolog
              : "";
            const spesialisasi = psikologResult[0]
              ? psikologResult[0].spesialisasi
              : "";

            // Query SQL untuk mengambil foto_pasien berdasarkan email_pasien
            const getFotoPasienQuery =
              "SELECT foto_pasien, CONCAT(SUBSTRING_INDEX(nama_pasien, ' ', 2), ' ') AS nama_pendek FROM tb_pasien WHERE email_pasien = ?";

            db.query(
              getFotoPasienQuery,
              [email_pasien],
              (err, fotoPasienResult) => {
                if (err) {
                  console.error("Kesalahan saat mengambil foto_pasien:", err);
                  res
                    .status(500)
                    .send("Terjadi kesalahan saat mengambil foto_pasien.");
                  return;
                }

                // Menyimpan data foto_pasien dari hasil query
                const foto_pasien = fotoPasienResult[0]
                  ? fotoPasienResult[0].foto_pasien
                  : "";
                const nama_pendek = fotoPasienResult[0]
                  ? fotoPasienResult[0].nama_pendek
                  : "";

                // Render halaman pembayaran dengan data pengguna, nama_psikolog, gambar_psikolog, dan spesialisasi
                res.render("pembayaran", {
                  id_pasien: id_pasien,
                  nama_pasien: nama_pasien,
                  email_pasien: email_pasien,
                  nama_psikolog: nama_psikolog,
                  gambar_psikolog: gambar_psikolog,
                  spesialisasi: spesialisasi,
                  nama_pendek: nama_pendek,
                  foto_pasien: foto_pasien, // Tambahkan foto_pasien ke dalam rendering context
                });
              }
            );
          });
        }
      );
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
  });
});

// Implementasi POST routes untuk form submission

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
