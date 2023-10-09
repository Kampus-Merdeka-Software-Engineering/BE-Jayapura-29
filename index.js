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
const cors = require("cors");

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
  cors({
    // origin: "http://127.0.0.1:5501", // Allow requests from this origin
    origin:
      "https://kampus-merdeka-software-engineering.github.io/FE-Jayapura-29",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow these HTTP methods
    credentials: true, // Allow sending cookies with the request
  })
);

// app.use(
//   express.static(
//     // "https://kampus-merdeka-software-engineering.github.io/FE-Jayapura-29"
//     // localhost
//     "localhost:5501"
//   )
// );

// middleware
app.use("/", loginRouter);
app.use("/", signupRouter);
app.use("/", apiRoutes);
app.use("/", appointmentRoutes);
app.use("/", pembayaranRoutes);
app.use("/", profileRoutes);
app.use("/", editprofileRoutes);

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});

module.exports = {
  checkLoggedIn: checkLoggedIn,
};
