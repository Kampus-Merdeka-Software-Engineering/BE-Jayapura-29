// get the navbar
document.addEventListener("DOMContentLoaded", function () {
  fetch("navbar.html")
    .then((response) => response.text())
    .then((navbarHTML) => {
      document.getElementById("navbar-container").innerHTML = navbarHTML;
    });
});
// footer
document.addEventListener("DOMContentLoaded", function () {
  fetch("footer.html")
    .then((response) => response.text())
    .then((navbarHTML) => {
      document.getElementById("footer-container").innerHTML = navbarHTML;
    });
});
