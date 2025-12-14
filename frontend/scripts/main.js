fetch("/components/header.html")
  .then(res => res.text())
  .then(data => {
    const header = document.getElementById("header");
    if (header) header.innerHTML = data;
  });

fetch("/components/footer.html")
  .then(res => res.text())
  .then(data => {
    const footer = document.getElementById("footer");
    if (footer) footer.innerHTML = data;
  });

const shopBtn = document.getElementById("shopBtn");
const shopSection = document.getElementById("shop");

shopBtn.addEventListener("click", () => {
  shopSection.scrollIntoView({ behavior: "smooth" });
});

if (shopBtn && shopSection) {
  shopBtn.addEventListener("click", () => {
    shopSection.scrollIntoView({ behavior: "smooth" });
  });
}