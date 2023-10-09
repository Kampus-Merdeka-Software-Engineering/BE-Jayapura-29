const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");
const axios = require("axios");
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
app.use(express.static("public"));

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

app.use(
  express.static(
    "https://kampus-merdeka-software-engineering.github.io/FE-Jayapura-29"
  )
);

// Routing
app.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/index.html"
    );
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching HTML:", error);
    res.status(500).send("Error fetching HTML from external URL");
  }
});

app.get("/index2", checkLoggedIn, async (req, res) => {
  try {
    if (req.session.email_pasien) {
      const email_pasien = req.session.email_pasien;
      const user = await Pasien.findOne({
        where: { email_pasien: email_pasien },
      });

      if (user) {
        const { nama_pasien, foto_pasien } = user;
        const namaPasienArray = nama_pasien.split(" ");
        const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

        const response = await axios.get(
          "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/index2.html"
        );

        const renderedHtml = response.data
          .replace(/<%= nama_pendek %>/g, nama_pendek)
          .replace(/<%= foto_pasien %>/g, foto_pasien);

        res.send(renderedHtml);
      } else {
        res.redirect("/login");
      }
    } else {
      // Handle the case where req.session.email_pasien is not defined
    }
  } catch (error) {
    console.error("Error fetching and rendering HTML:", error);
    res.status(500).send("Error fetching and rendering HTML from GitHub.");
  }
});

// Route Login
app.get("/login", async (req, res) => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/login.html"
    );

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching login HTML:", error);
    res.status(500).send("Error fetching login HTML from GitHub.");
  }
});

// Route Signup
app.get("/signup", async (req, res) => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/signup.html"
    );

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching signup HTML:", error);
    res.status(500).send("Error fetching signup HTML from GitHub.");
  }
});

// Route Dashboard
app.get("/index", async (req, res) => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/index.html"
    );

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching index HTML:", error);
    res.status(500).send("Error fetching index HTML from GitHub.");
  }
});

// Route untuk Appointment
app.use("/", appointmentRoutes);

app.get("/appointment", checkLoggedIn, async (req, res) => {
  try {
    const email_pasien = req.session.email_pasien;

    const pasien = await Pasien.findOne({
      where: { email_pasien },
    });

    if (!pasien) {
      return res.status(404).send("Pasien tidak ditemukan");
    }

    const psikologOptions = await Psikolog.findAll();

    const psikologOptionsHtml = psikologOptions
      .map((psikolog) => {
        return `
        <option value="${psikolog.nama_psikolog}">
          ${psikolog.nama_psikolog}
        </option>
      `;
      })
      .join("");

    const namaPasienArray = pasien.nama_pasien.split(" ");
    const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/appointment.html"
    );

    const appointmentHtml = response.data;

    const renderedHtml = appointmentHtml
      .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
      .replace(/<%= email_pasien %>/g, pasien.email_pasien)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien)
      .replace(/<%= psikologOptions %>/g, psikologOptionsHtml)
      .replace(/<%= nama_pendek %>/g, nama_pendek);

    res.send(renderedHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan");
  }
});

// Route untuk halaman pembayaran
app.use("/", pembayaranRoutes);
app.get("/pembayaran", checkLoggedIn, async (req, res) => {
  try {
    const userEmail = req.session.email_pasien;

    if (!userEmail) {
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

    const pasien = await Pasien.findOne({
      where: { email_pasien: userEmail },
    });

    if (!pasien) {
      return res.status(404).send("Data pasien tidak ditemukan");
    }

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
      return res.status(404).send("Data psikolog tidak ditemukan");
    }

    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/pembayaran.html"
    );

    const pembayaranHtml = response.data;

    const renderedHtml = pembayaranHtml
      .replace(/<%= id_pasien %>/g, pasien.id_pasien)
      .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
      .replace(/<%= email_pasien %>/g, pasien.email_pasien)
      .replace(/<%= nama_psikolog %>/g, psikolog.nama_psikolog)
      .replace(/<%= gambar_psikolog %>/g, psikolog.gambar_psikolog)
      .replace(/<%= spesialisasi %>/g, psikolog.spesialisasi)
      .replace(/<%= nama_pendek %>/g, nama_pendek)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien);

    res.send(renderedHtml);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route untuk halaman profil
// app.use("/", profileRoutes);
app.get("/profile", checkLoggedIn, async (req, res) => {
  if (req.session.email_pasien) {
    const email_pasien = req.session.email_pasien;
    const id_pasien = req.session.id_pasien;

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
          nama_pendek: nama_pendek,
        };

        const response = await axios.get(
          "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/profile.html"
        );

        const profileHtml = response.data;

        const appointment = await Appointment.findOne({
          where: { email_pasien },
        });

        if (appointment) {
          if (pembayaran) {
            profileData.jumlah_bayar = 8000;
            profileData.status_bayar = "sudah";
          } else {
            profileData.jumlah_bayar = 80000;
            profileData.status_bayar = "belum";
          }
          const appointmentDate = new Date(appointment.tanggal);

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

          const day = appointmentDate.getDate();
          const month = monthNames[appointmentDate.getMonth()];
          const year = appointmentDate.getFullYear();

          const formattedDate = `${appointmentDate
            .toDateString()
            .substr(0, 3)} ${month} ${day} ${year}`;
          profileData.tanggal_appointment = formattedDate;
          profileData.waktu_appointment = appointment.waktu;
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
app.use("/", editprofileRoutes);

app.get("/edit_profile", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/login");
  }

  try {
    const profileData = await Pasien.findOne({ where: { id_pasien: userId } });

    if (!profileData) {
      return res.status(404).send("Profil tidak ditemukan");
    }

    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/edit_profile.html"
    );

    const editprofileHtml = response.data;

    const renderedHtml = editprofileHtml
      .replace(/<%= profileData.id_pasien %>/g, profileData.id_pasien)
      .replace(/<%= profileData.foto_pasien %>/g, profileData.foto_pasien)
      .replace(/<%= profileData.nama_pasien %>/g, profileData.nama_pasien)
      .replace(/<%= profileData.email_pasien %>/g, profileData.email_pasien)
      .replace(/<%= profileData.nomor_ponsel %>/g, profileData.nomor_ponsel)
      .replace(/<%= profileData.alamat %>/g, profileData.alamat);

    res.send(renderedHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data profil");
  }
});

// Route Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/index");
  });
});

// checklogin
app.get("/check-login-status", (req, res) => {
  const isLoggedIn =
    req.session.userId && req.session.email_pasien ? true : false;
  res.json({ isLoggedIn });
});

// navbar
app.get("/navbar-before-login", async (req, res) => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/navbar.html"
    );

    const navbarHtml = response.data;
    res.send(navbarHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data navbar");
  }
});

// navbar
app.get("/navbar-after-login", async (req, res) => {
  try {
    const email_pasien = req.session.email_pasien;

    const pasien = await Pasien.findOne({
      where: {
        email_pasien: email_pasien,
      },
    });

    if (!pasien) {
      throw new Error("Pasien not found");
    }

    const namaPasienArray = pasien.nama_pasien.split(" ");
    const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

    const response = await axios.get(
      "https://raw.githubusercontent.com/Kampus-Merdeka-Software-Engineering/FE-Jayapura-29/main/navbar2.html"
    );

    const navbar2Html = response.data;

    const renderedHtml = navbar2Html
      .replace(/<%= nama_pendek %>/g, nama_pendek)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien);

    res.send(renderedHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred: " + error.message);
  }
});

// Implementasi POST routes untuk form submission

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
