document.addEventListener("DOMContentLoaded", function () {
  const sectionToScroll = document.getElementById("section-to-scroll");
  if (sectionToScroll) {
    sectionToScroll.scrollIntoView({ behavior: "smooth" });
  }
});
