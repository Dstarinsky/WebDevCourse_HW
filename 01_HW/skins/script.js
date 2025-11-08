const skins = ["basic.css", "dark.css", "modern.css"];
let currentSkin = 0;

function changeSkin() {
  const link = document.getElementById("theme-style");

  currentSkin = (currentSkin + 1) % skins.length;

  link.href = skins[currentSkin];

  console.log("Skin changed to:", skins[currentSkin]);
}