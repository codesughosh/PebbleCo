const shopBtn = document.getElementById("shopBtn");
const shopSection = document.getElementById("shop");

shopBtn.addEventListener("click", () => {
  shopSection.scrollIntoView({ behavior: "smooth" });
});
