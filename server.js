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
app.use(express.static("../frontend"));

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
  const indexHtml = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "index.html"),
    "utf8"
  );
  res.send(indexHtml);
});

app.get("/index2", checkLoggedIn, (req, res) => {
  if (req.session.email_pasien) {
    const email_pasien = req.session.email_pasien;
    Pasien.findOne({ where: { email_pasien: email_pasien } })
      .then((user) => {
        if (user) {
          const { nama_pasien, foto_pasien } = user;

          const namaPasienArray = nama_pasien.split(" ");
          const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

          const index2Html = fs.readFileSync(
            path.join(__dirname, "../frontend/views", "index2.html"),
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
  }
});

// Route Login

app.use("/", loginRouter);
app.get("/login", (req, res) => {
  const loginHtml = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "login.html"),
    "utf8"
  );
  res.send(loginHtml);
});

// Route Signup
app.use("/", signupRouter);
app.get("/signup", (req, res) => {
  const signupHtml = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "signup.html"),
    "utf8"
  );
  res.send(signupHtml);
});

// Route Dashboard

app.get("/index", (req, res) => {
  const indexHtml = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "index.html"),
    "utf8"
  );
  res.send(indexHtml);
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

    const appointmentHtml = fs.readFileSync(
      path.join(__dirname, "../frontend/views", "appointment.html"),
      "utf8"
    );

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

    const pembayaranHtml = fs.readFileSync(
      path.join(__dirname, "../frontend/views", "pembayaran.html"),
      "utf8"
    );

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

        const profileHtml = fs.readFileSync(
          path.join(__dirname, "../frontend/views", "profile.html"),
          "utf8"
        );

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
app.get("/edit_profile", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/login");
  }

  Pasien.findOne({ where: { id_pasien: userId } })
    .then((profileData) => {
      if (!profileData) {
        return res.status(404).send("Profil tidak ditemukan");
      }
      const editprofileHtml = fs.readFileSync(
        path.join(__dirname, "../frontend/views", "edit_profile.html"),
        "utf8"
      );

      const renderedHtml = editprofileHtml
        .replace(/<%= profileData.id_pasien %>/g, profileData.id_pasien)
        .replace(/<%= profileData.foto_pasien %>/g, profileData.foto_pasien)
        .replace(/<%= profileData.nama_pasien %>/g, profileData.nama_pasien)
        .replace(/<%= profileData.email_pasien %>/g, profileData.email_pasien)
        .replace(/<%= profileData.nomor_ponsel %>/g, profileData.nomor_ponsel)
        .replace(/<%= profileData.alamat %>/g, profileData.alamat);

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

// checklogin
app.get("/check-login-status", (req, res) => {
  const isLoggedIn =
    req.session.userId && req.session.email_pasien ? true : false;
  res.json({ isLoggedIn });
});

// navbar
app.get("/navbar-before-login", (req, res) => {
  const navbarHtml = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "navbar.html"),
    "utf8"
  );
  res.send(navbarHtml);
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

    const navbar2Html = fs.readFileSync(
      path.join(__dirname, "../frontend/views", "navbar2.html"),
      "utf8"
    );

    const renderedHtml = navbar2Html
      .replace(/<%= nama_pendek %>/g, nama_pendek)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien);

    res.send(renderedHtml);
  } catch (error) {
    res.status(500).send("An error occurred: " + error.message);
  }
});

// article & team
app.get("/article1", (req, res) => {
  const article1Html = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "article1.html"),
    "utf8"
  );
  res.send(article1Html);
});
app.get("/article2", (req, res) => {
  const article2Html = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "article2.html"),
    "utf8"
  );
  res.send(article2Html);
});
app.get("/article3", (req, res) => {
  const article3Html = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "article3.html"),
    "utf8"
  );
  res.send(article3Html);
});
app.get("/article4", (req, res) => {
  const article4Html = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "article4.html"),
    "utf8"
  );
  res.send(article4Html);
});
app.get("/team", (req, res) => {
  const teamHtml = fs.readFileSync(
    path.join(__dirname, "../frontend/views", "team.html"),
    "utf8"
  );
  res.send(teamHtml);
});

// Implementasi POST routes untuk form submission

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
