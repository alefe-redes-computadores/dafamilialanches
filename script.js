// ===== CONTAGEM REGRESSIVA =====
function atualizarContagem() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const restante = fim - agora;

  if (restante <= 0) {
    document.getElementById("countdown-timer").textContent = "00:00:00";
    return;
  }

  const horas = String(Math.floor(restante / 1000 / 60 / 60)).padStart(2, '0');
  const minutos = String(Math.floor((restante / 1000 / 60) % 60)).padStart(2, '0');
  const segundos = String(Math.floor((restante / 1000) % 60)).padStart(2, '0');

  document.getElementById("countdown-timer").textContent = `${horas}:${minutos}:${segundos}`;
}

setInterval(atualizarContagem, 1000);
atualizarContagem();

// ===== MAPA INTERATIVO =====
const mapa = L.map('mapa-entregas').setView([-18.5789, -46.5181], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(mapa);

const circulo = L.circle([-18.5789, -46.5181], {
  color: '#d4af37',
  fillColor: '#d4af37',
  fillOpacity: 0.15,
  radius: 4500
}).addTo(mapa);
circulo.bindPopup("Entregamos em toda Patos de Minas 💛");