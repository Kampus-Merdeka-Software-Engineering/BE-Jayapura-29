// navbar responsive

function toggleMenu() {
  let menu = document.querySelector("#menu-btn");
  let navbar = document.querySelector(".header .navbar");
  menu.classList.toggle("fa-times");
  navbar.classList.toggle("active");
}

//
function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

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

// posisi tombol
function updateLayout() {
  const navbar = document.querySelector(".navbar");
  const tombolKanan = document.querySelector(".tombol_kanan");
  const baru = document.querySelector(".baru");
  const windowWidth = window.innerWidth;

  if (windowWidth <= 768) {
    if (tombolKanan.parentNode !== navbar) {
      navbar.appendChild(tombolKanan);
    }
  } else {
    const baru = document.querySelector(".baru");
    if (tombolKanan.parentNode !== baru) {
      baru.appendChild(tombolKanan);
    }
  }
}
window.addEventListener("resize", updateLayout);

// async function getDataFromBackend() {
//   try {
//     const response = await fetch(`${backendUrl}/api/data`);
//     const data = await response.json();
//     // Lakukan sesuatu dengan data dari backend
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }
