let menu = document.querySelector("#menu-btn");
let navbar = document.querySelector(".header .navbar");

menu.onclick = () => {
  menu.classList.toggle("fa-times");
  navbar.classList.toggle("active");
};

window.onscroll = () => {
  menu.classList.remove("fa-times");
  navbar.classList.remove("active");
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
// document.addEventListener("DOMContentLoaded", function () {
//   const bookingForm = document.getElementById("bookingForm");
//   bookingForm.addEventListener("submit", function (event) {
//     event.preventDefault(); // Prevent the default form submission

//     // You can customize the notification message here
//     const notificationMessage = "Booking berhasil dilakukan.";

//     // Display the notification
//     alert(notificationMessage);
//   });
// });
