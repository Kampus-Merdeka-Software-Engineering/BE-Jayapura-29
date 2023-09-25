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

// Set zona waktu server ke "Asia/Jakarta"
moment.tz.setDefault("Asia/Jakarta");

// Contoh penggunaan untuk memformat tanggal
const tanggal = moment().format("dddd, D MMMM YYYY");

// Konfigurasi koneksi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_rumah_sakit",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Terhubung ke MySQL");
});

// Konfigurasi Express
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: "your_secret_key",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(express.static(path.join(__dirname, "views")));

app.engine("html", require("ejs").renderFile); // Menggunakan ejs sebagai view engine untuk file HTML
app.set("view engine", "html");

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
    cb(null, "uploads/"); // Simpan gambar di folder "uploads/"
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

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Folder untuk file publik (CSS, gambar, dll.)

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
    const query =
      "SELECT nama_pasien, foto_pasien, email_pasien FROM tb_pasien WHERE id_pasien = ?";
    db.query(query, [userId], (err, results) => {
      if (err) throw err;
      if (results.length === 1) {
        const { nama_pasien, foto_pasien, email_pasien } = results[0];
        const id_pasien = userId;

        // Fetch the psikolog data, you should adapt this query to your database structure
        const queryPsikolog =
          "SELECT id_psikolog, nama_psikolog FROM tb_psikolog";
        db.query(queryPsikolog, (err, psikolog) => {
          if (err) throw err;

          res.render("index", {
            nama: nama_pasien,
            id_pasien: id_pasien,
            foto_pasien: foto_pasien,
            email_pasien: email_pasien,
            psikolog: psikolog, // Add psikolog data to the template context
          });
        });
      } else {
        res.redirect("/login");
      }
    });
  } else {
    // User is not logged in, render the template with empty psikolog data
    res.render("index", {
      nama: null,
      id_pasien: null,
      foto_pasien: null,
      email_pasien: null,
      psikolog: [], // Pass an empty array for psikolog data
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
    "SELECT foto_pasien, id_pasien, email_pasien, nama_pasien, alamat, nomor_ponsel FROM tb_pasien WHERE id_pasien = ?";

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
          profileData.tanggal = appointmentData.tanggal;
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
          // Jika tidak ada appointment, atur "jumlah bayar" dan "status bayar" sesuai ketentuan
          profileData.jumlah_bayar = "-";
          profileData.status_bayar = "-";

          // Render halaman profil dengan data pengguna, data pembayaran, dan data appointment
          res.render("profile.html", { profileData });
        }
      });
    }
  });
});

// Edit Profile
app.get("/edit_profile", checkLoggedIn, (req, res) => {
  const id_pasien = req.session.userId;

  // Query SQL untuk mengambil data pengguna dari tb_pasien
  const query =
    "SELECT id_pasien, email_pasien, nama_pasien, alamat, nomor_ponsel FROM tb_pasien WHERE id_pasien = ?";

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

// Route untuk halaman pembayaran
app.get("/pembayaran", checkLoggedIn, (req, res) => {
  // Mengambil data pengguna dari sesi
  const id_pasien = req.session.userId;
  const nama_pasien = req.session.nama_pasien;
  const email_pasien = req.session.email_pasien;

  // Render halaman pembayaran dengan data pengguna
  res.render("pembayaran", {
    id_pasien: id_pasien,
    nama_pasien: nama_pasien,
    email_pasien: email_pasien,
  });
});

// Implementasi POST routes untuk form submission

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});

// INDEX

// SIGNUP
app.post("/signup", upload.single("foto_pasien"), (req, res) => {
  const {
    nama_pasien,
    tanggal_lahir,
    gender,
    nomor_ponsel,
    email_pasien,
    alamat,
    password,
  } = req.body;

  // Ambil file gambar yang diunggah
  const foto_pasien = req.file;

  // Pastikan file gambar telah diunggah dengan benar
  if (!foto_pasien) {
    return res.status(400).send("Gambar profil harus diunggah.");
  }

  // Konversi gambar menjadi bentuk Base64
  const gambarBase64 = fs.readFileSync(foto_pasien.path, "base64");

  // Simpan data pengguna ke database, termasuk gambar profil
  const user = {
    foto_pasien: gambarBase64, // Simpan gambar dalam format Base64
    nama_pasien,
    tanggal_lahir,
    gender,
    nomor_ponsel,
    email_pasien,
    alamat,
    password, // Simpan kata sandi dalam teks biasa (tanpa hashing)
  };

  const query = "INSERT INTO tb_pasien SET ?";
  db.query(query, user, (err, results) => {
    if (err) {
      return res.status(500).send("Pendaftaran gagal. Coba lagi nanti.");
    }

    // Tampilkan pesan sukses dan arahkan pengguna ke halaman login
    const successMessage = "Pendaftaran berhasil";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/login'; // Ubah '/login' sesuai dengan URL login Anda
      </script>
    `);
  });
});

// LOGIN
app.post("/login", (req, res) => {
  const { email_pasien, password } = req.body;
  const query = "SELECT * FROM tb_pasien WHERE email_pasien = ?";

  db.query(query, [email_pasien], (err, results) => {
    if (err) throw err;

    if (results.length === 1) {
      const user = results[0];
      if (password === user.password) {
        // Memeriksa kata sandi tanpa hashing
        // Sesuaikan sesi pengguna di sini
        req.session.userId = user.id_pasien;
        req.session.nama_pasien = user.nama_pasien;
        req.session.email_pasien = user.email_pasien; // Menyimpan email_pasien dalam sesi
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
  });
});

// Profil
app.post("/profile", checkLoggedIn, (req, res) => {
  const id_pasien = req.session.userId;
  const { tanggal, waktu } = req.body;

  // Query SQL untuk memperbarui tanggal dan waktu appointment di tb_appointment
  const updateQuery =
    "UPDATE tb_appointment SET tanggal = ?, waktu = ? WHERE id_pasien = ?";

  db.query(updateQuery, [tanggal, waktu, id_pasien], (err, result) => {
    if (err) {
      console.error("Kesalahan saat memperbarui appointment:", err);
      return res
        .status(500)
        .send("Terjadi kesalahan saat memperbarui appointment.");
    }

    // Tampilkan pesan sukses dan arahkan kembali ke halaman profil
    const successMessage = "Appointment berhasil diperbarui";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/profile'; // Redirect ke halaman profil
      </script>
    `);
  });
});

// Update Profil
app.post(
  "/edit_profile",
  checkLoggedIn,
  upload.single("foto_pasien"),
  (req, res) => {
    const id_pasien = req.session.userId;
    const { nama_pasien, email_pasien, alamat, nomor_ponsel } = req.body;

    // Lakukan validasi dan pembaruan data profil di sini sesuai kebutuhan
    // Misalnya, Anda dapat melakukan validasi data yang diterima dan memastikan data tersebut valid

    // Jika foto profil berhasil diunggah, Anda dapat menghandle pembaruan gambar profil di sini
    if (req.file) {
      const newProfilePicture = req.file.filename;
      // Lakukan sesuatu dengan gambar profil yang baru diunggah, jika diperlukan
    }

    // Query SQL untuk melakukan pembaruan data profil di tabel tb_pasien
    const updateQuery =
      "UPDATE tb_pasien SET nama_pasien = ?, email_pasien = ?, alamat = ?, nomor_ponsel = ? WHERE id_pasien = ?";

    db.query(
      updateQuery,
      [nama_pasien, email_pasien, alamat, nomor_ponsel, id_pasien],
      (err, result) => {
        if (err) {
          // Handle kesalahan jika query gagal
          console.error("Kesalahan saat memperbarui profil:", err);
          return res
            .status(500)
            .send("Terjadi kesalahan saat memperbarui profil.");
        }

        // Setelah pembaruan berhasil, tampilkan pesan sukses dan arahkan ke halaman profil
        const successMessage = "Profil berhasil diperbarui";
        res.send(`
        <script>
          alert('${successMessage}');
          window.location='/profile'; // Redirect ke halaman profil
        </script>
      `);
      }
    );
  }
);

// APPOINTMENT
app.post("/index", (req, res) => {
  // Updated route for handling POST requests
  if (req.session.userId) {
    // Process the form data here, just like you did in your "/buat-appointment" route handler
    const id_pasien = req.body.id_pasien;
    const email_pasien = req.body.email_pasien;
    const nama_pasien = req.body.nama_pasien;
    const nama_psikolog = req.body.nama_psikolog;
    const tanggal = req.body.tanggal;
    const waktu = req.body.waktu;
    const keluhan = req.body.keluhan;

    // Lakukan query untuk mendapatkan id_psikolog berdasarkan nama_psikolog
    const queryPsikolog =
      "SELECT nama_psikolog FROM tb_psikolog WHERE id_psikolog = ?";
    db.query(queryPsikolog, [nama_psikolog], (err, results) => {
      if (err) throw err;
      if (results.length === 1) {
        const nama_psikolog = results[0].nama_psikolog;

        // Lakukan query untuk menyimpan data ke tb_appointment
        const queryAppointment =
          "INSERT INTO tb_appointment (id_pasien, email_pasien, nama_pasien, nama_psikolog, tanggal, waktu, keluhan) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(
          queryAppointment,
          [
            id_pasien,
            email_pasien,
            nama_pasien,
            nama_psikolog,
            tanggal,
            waktu,
            keluhan,
          ],
          (err, results) => {
            if (err) throw err;

            // Tampilkan pesan sukses dan arahkan kembali ke halaman index
            const successMessage = "Appointment berhasil";
            res.send(`
              <script>
                alert('${successMessage}');
                window.location='/index'; // Ubah '/index' sesuai dengan URL index Anda
              </script>
            `);
          }
        );
      } else {
        res.status(500).send("Nama psikolog tidak valid.");
      }
    });
  } else {
    // User is not logged in, render the template with empty psikolog data
    res.render("index", {
      nama: null,
      id_pasien: null,
      foto_pasien: null,
      email_pasien: null,
      psikolog: [], // Pass an empty array for psikolog data
    });
  }
});

// Route untuk memproses pembayaran
app.post("/proses_pembayaran", checkLoggedIn, (req, res) => {
  const id_pasien = req.body.id_pasien;
  const nama_pasien = req.body.nama_pasien;
  const email_pasien = req.body.email_pasien;
  const jumlah_biaya = req.body.jumlah_biaya;
  const metode_pembayaran = req.body.metode_pembayaran;

  // Simpan data pembayaran ke tabel tb_pembayaran
  const tanggal_bayar = new Date();
  const pembayaran = {
    id_pasien,
    nama_pasien,
    email_pasien,
    jumlah_biaya,
    tanggal_bayar,
    metode_pembayaran,
  };

  const insertPembayaranQuery = "INSERT INTO tb_pembayaran SET ?";
  db.query(insertPembayaranQuery, pembayaran, (err, result) => {
    if (err) {
      console.error("Kesalahan saat menyimpan data pembayaran:", err);
      // Handle kesalahan penyimpanan data pembayaran
      res.status(500).send("Terjadi kesalahan saat menyimpan data pembayaran.");
    } else {
      // Tampilkan pesan sukses dan arahkan pengguna ke halaman lain jika diperlukan
      const successMessage = "Pembayaran berhasil";
      res.send(`
        <script>
          alert('${successMessage}');
          window.location='/index'; // Ubah '/dashboard' sesuai dengan URL yang sesuai
        </script>
      `);
    }
  });
});
