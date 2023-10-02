let menu = document.querySelector("#menu-btn");
let navbar = document.querySelector(".header .navbar");

menu.onclick = () => {
  menu.classList.toggle("fa-times");
  navbar.classList.toggle("active");
};

//
function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

//
function updateLayout() {
  const navbar = document.querySelector(".navbar");
  const tombolKanan = document.querySelector(".tombol_kanan");
  const baru = document.querySelector(".baru");
  const windowWidth = window.innerWidth;

  if (windowWidth <= 768) {
    // Saat lebar layar kurang dari atau sama dengan 768px, tambahkan .tombol_kanan ke dalam .navbar
    if (tombolKanan.parentNode !== navbar) {
      navbar.appendChild(tombolKanan);
    }
  } else {
    // Saat lebar layar lebih besar dari 768px, pastikan .tombol_kanan ada dalam .baru
    const baru = document.querySelector(".baru");
    if (tombolKanan.parentNode !== baru) {
      baru.appendChild(tombolKanan);
    }
  }
}

// Panggil fungsi saat halaman dimuat dan saat jendela diubah ukurannya.
window.addEventListener("resize", updateLayout);
