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
app.get("/index2", checkLoggedIn, (req, res) => {
  if (req.session.email_pasien) {
    const email_pasien = req.session.email_pasien;
    Pasien.findOne({ where: { email_pasien: email_pasien } })
      .then((user) => {
        if (user) {
          const { nama_pasien, foto_pasien } = user;

          // Mengambil dua kata pertama dari nama_pasien
          const namaPasienArray = nama_pasien.split(" ");
          const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

          // Mengganti placeholder dengan nilai yang sesuai dari sesi
          const index2Html = fs.readFileSync(
            path.join(__dirname, "views", "index2.html"),
            "utf8"
          );
          const renderedHtml = index2Html
            .replace(/<%= nama_pendek %>/g, nama_pendek)
            .replace(/<%= foto_pasien %>/g, foto_pasien);

          res.send(renderedHtml);
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
    res.sendFile(path.join(__dirname, "views", "index2.html"), {
      nama: null,
      id_pasien: null,
      foto_pasien: null,
      isLoggedIn: isLoggedIn,
    });
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
  const indexHtml = fs.readFileSync(
    path.join(__dirname, "views", "index.html"),
    "utf8"
  );
  res.send(indexHtml);
});

// Route untuk Appointment
app.use("/", appointmentRoutes);

app.get("/appointment", checkLoggedIn, async (req, res) => {
  try {
    // Ambil email_pasien dari sesi atau tempat Anda menyimpannya saat login
    const { email_pasien } = req.session; // Sesuaikan dengan cara Anda menyimpan email_pasien

    // Cari data pasien berdasarkan email_pasien
    const pasien = await Pasien.findOne({
      where: { email_pasien },
    });

    if (!pasien) {
      return res.status(404).send("Pasien tidak ditemukan");
    }

    // Ambil data psikolog dari tabel tb_psikolog
    const psikologOptions = await Psikolog.findAll();

    // Buat string HTML untuk pilihan dropdown psikolog
    const psikologOptionsHtml = psikologOptions
      .map((psikolog) => {
        return `
        <option value="${psikolog.nama_psikolog}">
          ${psikolog.nama_psikolog}
        </option>
      `;
      })
      .join("");

    // Mengambil nama_pendek dari nama_pasien
    const namaPasienArray = pasien.nama_pasien.split(" ");
    const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

    // Baca isi file HTML appointment.html
    const appointmentHtml = fs.readFileSync(
      path.join(__dirname, "views", "appointment.html"),
      "utf8"
    );

    // Ganti nilai <%= nama_pasien %> dalam file HTML dengan nama_pasien dari hasil pencarian
    const renderedHtml = appointmentHtml
      .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
      .replace(/<%= email_pasien %>/g, pasien.email_pasien)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien)
      .replace(/<%= psikologOptions %>/g, psikologOptionsHtml)
      .replace(/<%= nama_pendek %>/g, nama_pendek); // Menambahkan nama_pendek

    // Kirim file HTML yang telah diubah
    res.send(renderedHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan");
  }
});

// Route untuk halaman pembayaran
app.use("/", pembayaranRoutes);
app.get("/pembayaran", async (req, res) => {
  try {
    // Check if the user is logged in and their email is stored in a session or variable (e.g., req.session.email)
    const userEmail = req.session.email_pasien; // Replace with your actual way of storing the user's email

    if (!userEmail) {
      // User is not logged in
      const alertMessage = "Anda belum login. Silakan login terlebih dahulu.";
      const loginRedirect = "/login";

      res.send(`
        <script>
          alert('${alertMessage}');
          window.location='${loginRedirect}';
        </script>
      `);
      return;
    }

    // Fetch additional data from tb_pasien based on the user's email
    const pasien = await Pasien.findOne({
      where: { email_pasien: userEmail },
    });

    if (!pasien) {
      // No matching pasien found
      return res.status(404).send("Data pasien tidak ditemukan");
    }

    // Calculate nama_pendek based on the formula
    const namaPasienArray = pasien.nama_pasien.split(" ");
    const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

    const appointment = await Appointment.findOne({
      where: { email_pasien: userEmail },
    });

    if (!appointment) {
      const errorMessage = "Anda tidak memiliki appointment.";
      res.send(`
        <script>
          alert('${errorMessage}');
          window.location='/index'; // Redirect ke halaman awal
        </script>
      `);
      return;
    }

    const psikolog = await Psikolog.findOne({
      where: { nama_psikolog: appointment.nama_psikolog },
    });

    if (!psikolog) {
      // No matching psikolog found
      return res.status(404).send("Data psikolog tidak ditemukan");
    }

    // Read the HTML template file
    const pembayaranHtml = fs.readFileSync(
      path.join(__dirname, "views", "pembayaran.html"),
      "utf8"
    );

    // Replace placeholders with data
    const renderedHtml = pembayaranHtml
      .replace(/<%= id_pasien %>/g, pasien.id_pasien)
      .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
      .replace(/<%= email_pasien %>/g, pasien.email_pasien)
      .replace(/<%= nama_psikolog %>/g, psikolog.nama_psikolog)
      .replace(/<%= gambar_psikolog %>/g, psikolog.gambar_psikolog)
      .replace(/<%= spesialisasi %>/g, psikolog.spesialisasi)
      .replace(/<%= nama_pendek %>/g, nama_pendek)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien); // Assuming you have a placeholder for the photo

    res.send(renderedHtml);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route untuk halaman profil
// app.use("/", profileRoutes);
app.get("/profile", async (req, res) => {
  if (req.session.email_pasien) {
    const email_pasien = req.session.email_pasien;
    const id_pasien = req.session.id_pasien; // Ambil id_pasien dari sesi jika sudah tersedia

    // Buat objek untuk mencari berdasarkan email_pasien dan/atau id_pasien
    const query = id_pasien ? { id_pasien, email_pasien } : { email_pasien };

    try {
      const user = await Pasien.findOne({ where: query });

      if (user) {
        const {
          id_pasien,
          nama_pasien,
          email_pasien,
          gender,
          nomor_ponsel,
          alamat,
          foto_pasien,
        } = user;

        const pembayaran = await Pembayaran.findOne({ where: { id_pasien } });

        // Mengambil nama_pendek dari nama_pasien
        const namaPasienArray = nama_pasien.split(" ");
        const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

        const profileData = {
          id_pasien: id_pasien,
          nama_pasien: nama_pasien,
          email_pasien: email_pasien,
          gender: gender,
          nomor_ponsel: nomor_ponsel,
          alamat: alamat,
          foto_pasien: foto_pasien,
          jumlah_bayar: pembayaran ? pembayaran.jumlah_bayar : "-",
          status_bayar: pembayaran ? pembayaran.status_bayar : "-",
          nama_pendek: nama_pendek, // Menambahkan nama_pendek ke profileData
        };

        // Baca file HTML menggunakan fs.readFileSync
        const profileHtml = fs.readFileSync(
          path.join(__dirname, "views", "profile.html"),
          "utf8"
        );

        // Periksa apakah ada appointment atau tidak
        const appointment = await Appointment.findOne({
          where: { email_pasien },
        });

        if (appointment) {
          if (pembayaran) {
            // Sudah melakukan pembayaran
            profileData.jumlah_bayar = 8000;
            profileData.status_bayar = "sudah";
          } else {
            // Belum melakukan pembayaran
            profileData.jumlah_bayar = 80000;
            profileData.status_bayar = "belum";
          }
          // Mengambil tanggal dari objek appointment
          const appointmentDate = new Date(appointment.tanggal);

          // Membuat daftar nama bulan dalam bahasa Inggris
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];

          // Mengambil informasi tanggal, bulan, dan tahun dari objek tanggal
          const day = appointmentDate.getDate();
          const month = monthNames[appointmentDate.getMonth()];
          const year = appointmentDate.getFullYear();

          // Menggabungkan informasi tersebut untuk membuat format "Fri Oct 06 2023"
          const formattedDate = `${appointmentDate
            .toDateString()
            .substr(0, 3)} ${month} ${day} ${year}`;
          // Jika ada appointment, isi tanggal dan waktu berdasarkan yang ada di tb_appointment
          profileData.tanggal_appointment = formattedDate;
          profileData.waktu_appointment = appointment.waktu;
        } else {
          // Jika tidak ada appointment, tampilkan pesan "Anda belum memiliki appointment"
          profileData.jumlah_bayar = "-";
          profileData.status_bayar = "-";
          profileData.tanggal_appointment = "Anda belum memiliki appointment";
          profileData.waktu_appointment = "";
        }

        // Gantilah placeholder dengan data yang sesuai
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
app.use("/", editprofileRoutes);
app.get("/edit_profile", (req, res) => {
  // Di sini Anda perlu mengganti kode berikut sesuai dengan logika autentikasi yang Anda miliki
  const userId = req.session.userId; // Gantilah ini dengan cara Anda mengidentifikasi user yang sedang login
  if (!userId) {
    // Jika user tidak terautentikasi, arahkan ke halaman login
    return res.redirect("/login"); // Gantilah dengan URL login yang sesuai
  }

  // Query database untuk mendapatkan data profil berdasarkan id_pasien atau email_pasien
  Pasien.findOne({ where: { id_pasien: userId } })
    .then((profileData) => {
      if (!profileData) {
        // Jika data profil tidak ditemukan, tangani sesuai kebutuhan Anda
        return res.status(404).send("Profil tidak ditemukan");
      }
      const editprofileHtml = fs.readFileSync(
        path.join(__dirname, "views", "edit_profile.html"),
        "utf8"
      );

      // Render HTML dengan mengganti placeholder dengan data profil
      const renderedHtml = editprofileHtml
        .replace(/<%= profileData.id_pasien %>/g, profileData.id_pasien)
        .replace(/<%= profileData.foto_pasien %>/g, profileData.foto_pasien)
        .replace(/<%= profileData.nama_pasien %>/g, profileData.nama_pasien)
        .replace(/<%= profileData.email_pasien %>/g, profileData.email_pasien)
        .replace(/<%= profileData.nomor_ponsel %>/g, profileData.nomor_ponsel)
        .replace(/<%= profileData.alamat %>/g, profileData.alamat);

      // Tampilkan halaman edit profil dengan data profil yang telah dirender
      res.send(renderedHtml);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).send("Terjadi kesalahan saat mengambil data profil");
    });
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
