const express = require("express");
const router = express.Router();
const Pasien = require("../models/pasien");
const Psikolog = require("../models/psikolog");
const Appointment = require("../models/appointment");
const Pembayaran = require("../models/pembayaran");

// Define an API route to get a list of all patients
router.get("/api/patients", async (req, res) => {
  try {
    const patients = await Pasien.findAll(); // Assuming Pasien is a model for patients
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to get a single patient by ID
router.get("/api/patients/:id", async (req, res) => {
  try {
    const patient = await Pasien.findById(req.params.id); // Assuming Pasien is a model for patients
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to create a new patient
router.post("/api/patients", async (req, res) => {
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

    // Create a new patient in the database
    const newPasien = await Pasien.create({
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password,
    });

    res.status(201).json(newPasien);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to update an existing patient by ID
router.put("/api/patients/:id", async (req, res) => {
  try {
    const updatedPatient = await Pasien.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ); // Assuming Pasien is a model for patients
    if (!updatedPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(updatedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to delete a patient by ID
router.delete("/api/patients/:id", async (req, res) => {
  try {
    const deletedPatient = await Pasien.findByIdAndRemove(req.params.id); // Assuming Pasien is a model for patients
    if (!deletedPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -------------------------------------------------------------------------

// Define an API route to get a list of all psychologists
router.get("/api/psychologists", async (req, res) => {
  try {
    const psychologists = await Psikolog.findAll();
    res.json(psychologists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to get a single psychologist by ID
router.get("/api/psychologists/:id", async (req, res) => {
  try {
    const psychologist = await Psikolog.findByPk(req.params.id);
    if (!psychologist) {
      return res.status(404).json({ error: "Psychologist not found" });
    }
    res.json(psychologist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to create a new psychologist
router.post("/api/psychologists", async (req, res) => {
  try {
    const {
      nama_psikolog,
      alamat,
      spesialisasi,
      gender,
      nomor_ponsel,
      email,
      gambar_psikolog,
    } = req.body;

    // Create a new psychologist in the database
    const newPsikolog = await Psikolog.create({
      nama_psikolog,
      alamat,
      spesialisasi,
      gender,
      nomor_ponsel,
      email,
      gambar_psikolog,
    });

    res.status(201).json(newPsikolog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to update an existing psychologist by ID
router.put("/api/psychologists/:id", async (req, res) => {
  try {
    const updatedPsikolog = await Psikolog.update(req.body, {
      where: { id_psikolog: req.params.id },
    });
    if (updatedPsikolog[0] === 0) {
      return res.status(404).json({ error: "Psychologist not found" });
    }
    res.json({ message: "Psychologist updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to delete a psychologist by ID
router.delete("/api/psychologists/:id", async (req, res) => {
  try {
    const deletedPsikolog = await Psikolog.destroy({
      where: { id_psikolog: req.params.id },
    });
    if (!deletedPsikolog) {
      return res.status(404).json({ error: "Psychologist not found" });
    }
    res.json({ message: "Psychologist deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --------------------------------------------------------------------------

// Define an API route to create a new appointment
router.post("/api/appointments", async (req, res) => {
  try {
    // Get data from the request body
    const { id_pasien, nama_pasien, nama_psikolog, tanggal, waktu, keluhan } =
      req.body; // Adjust this based on the required fields

    // Get the patient's email from the session or wherever you store it during login
    const { email_pasien } = req.session; // Adjust this based on your session management

    // Find the patient data based on email_pasien
    const pasien = await Pasien.findOne({
      where: { email_pasien },
    });

    if (!pasien) {
      return res.status(404).json({ error: "Pasien tidak ditemukan" });
    }

    // Create a new appointment entry in the database
    await Appointment.create({
      nama_pasien,
      email_pasien,
      nama_psikolog,
      tanggal,
      waktu,
      keluhan,
      id_pasien, // Assuming you have a relationship between Appointment and Pasien
    });

    // Respond with a success message or handle success as needed
    const successMessage = "Appointment berhasil";
    res.json({ message: successMessage });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Terjadi kesalahan" });
  }
});

// Define an API route to get a list of all appointments
router.get("/api/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.findAll();
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to get a single appointment by ID
router.get("/api/appointments/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to update an existing appointment by ID
router.put("/api/appointments/:id", async (req, res) => {
  try {
    const updatedAppointment = await Appointment.update(req.body, {
      where: { id: req.params.id },
    });
    if (updatedAppointment[0] === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json({ message: "Appointment updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to delete an appointment by ID
router.delete("/api/appointments/:id", async (req, res) => {
  try {
    const deletedAppointment = await Appointment.destroy({
      where: { id: req.params.id },
    });
    if (!deletedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --------------------------------------------------------------------------
// Define an API route to create a new payment
router.post("/api/payments", async (req, res) => {
  try {
    // Get data from the request body
    const {
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      metode_pembayaran,
    } = req.body;

    // Save payment data to the tb_pembayaran table
    const pembayaran = await Pembayaran.create({
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      tanggal_bayar: new Date(), // Set the payment date to the current date
      metode_pembayaran,
      status_bayar: "Sudah", // Set the payment status as needed
    });

    // Respond with a success message or handle success as needed
    const successMessage = "Pembayaran berhasil";
    res.json({ message: successMessage });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat menyimpan pembayaran." });
  }
});

// Define an API route to get a list of all payments
router.get("/api/payments", async (req, res) => {
  try {
    const payments = await Pembayaran.findAll();
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to get a single payment by ID
router.get("/api/payments/:id", async (req, res) => {
  try {
    const payment = await Pembayaran.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to update an existing payment by ID
router.put("/api/payments/:id", async (req, res) => {
  try {
    const updatedPayment = await Pembayaran.update(req.body, {
      where: { id: req.params.id },
    });
    if (updatedPayment[0] === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json({ message: "Payment updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define an API route to delete a payment by ID
router.delete("/api/payments/:id", async (req, res) => {
  try {
    const deletedPayment = await Pembayaran.destroy({
      where: { id: req.params.id },
    });
    if (!deletedPayment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
