const Psikolog = require("./models/psikolog"); // Sesuaikan dengan path yang sesuai

async function hapusPsikologById(idPsikolog) {
  try {
    const psikolog = await Psikolog.findByPk(idPsikolog);

    if (!psikolog) {
      console.log(`Psikolog dengan ID "${idPsikolog}" tidak ditemukan.`);
      return;
    }

    await psikolog.destroy();
    console.log(`Psikolog dengan ID "${idPsikolog}" berhasil dihapus.`);
  } catch (error) {
    console.error("Gagal menghapus data psikolog:", error);
  }
}

// Ganti 6 dengan id_psikolog yang ingin Anda hapus
const idPsikologYangAkanDihapus = 6;
hapusPsikologById(idPsikologYangAkanDihapus);
