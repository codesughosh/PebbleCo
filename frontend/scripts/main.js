fetch("components/header.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;
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