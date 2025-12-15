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

if (shopBtn && shopSection) {
  shopBtn.addEventListener("click", () => {
    shopSection.scrollIntoView({ behavior: "smooth" });
  });
}

const products = [
  {
    id: 1,
    name: "Pink Pearl Bracelet",
    price: 199,
    image: "assets/images/bracelet1.jpg"
  },
  {
    id: 2,
    name: "Lavender Charm",
    price: 149,
    image: "assets/images/charm1.jpg"
  },
  {
    id: 3,
    name: "Ocean Blue Bracelet",
    price: 179,
    image: "assets/images/bracelet2.jpg"
  }
];

const productGrid = document.getElementById("productGrid");

if (productGrid) {
  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>₹${product.price}</p>
      <button>Add to Cart</button>
    `;

    productGrid.appendChild(card);
  });
}
