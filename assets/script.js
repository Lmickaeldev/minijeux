function generateRandomSet(size = 3, min = 1, max = 9) {
  const set = new Set();
  while (set.size < size) {
    set.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return [...set];
}

// Valeurs fixes pour les multiplicateurs et leurs icônes
const multiplierValues = [1, 2, 10];
const multiplierIcons = {
  1: "./assets/icons/mult-1.webp",
  2: "./assets/icons/mult-2.webp",
  10: "./assets/icons/mult-10.webp",
};

const numbersLeft = generateRandomSet(3, 1, 30);
const shuffledMultipliers = shuffle([...multiplierValues]); // visuel
const colors = ["#ffcc00", "#ff3355", "#3366ff"];

// ⛓️ mapping logique aléatoire (0→2, 1→0, etc.)
const indexMapping = shuffle([0, 1, 2]);
const TARGET = numbersLeft.reduce((acc, v, i) => {
  const mappedIndex = indexMapping[i];
  return acc + v * shuffledMultipliers[mappedIndex];
}, 0);

let selectedLeft = null;
let connections = {};
let svgLines = [];
let cursor = { col: 0, row: 0 };

window.onload = () => {
  document.getElementById("targetDisp").textContent = pad3(TARGET);
  renderColumns();
  updateResult();
  highlightCursor();
  validate();
};

document.getElementById("resetBtn").addEventListener("click", resetAll);
document
  .getElementById("refreshBtn")
  .addEventListener("click", () => location.reload());

function renderColumns() {
  const leftCol = document.getElementById("leftCol");
  const rightCol = document.getElementById("rightCol");
  leftCol.innerHTML = "";
  rightCol.innerHTML = "";

  numbersLeft.forEach((num, i) => {
    const n = document.createElement("div");
    n.classList.add("node", "left");
    n.dataset.index = i;
    n.textContent = num;
    n.style.borderColor = colors[i];
    leftCol.appendChild(n);
  });

  shuffledMultipliers.forEach((mult, i) => {
    const n = document.createElement("div");
    n.classList.add("node", "right");
    n.dataset.index = i;
    n.innerHTML = `<img src="${multiplierIcons[mult]}" style="width:32px;height:32px;" alt="×${mult}">`;
    rightCol.appendChild(n);
  });
}

function highlightCursor() {
  document
    .querySelectorAll(".node")
    .forEach((n) => n.classList.remove("active"));
  const selector = `.node.${cursor.col === 0 ? "left" : "right"}[data-index="${
    cursor.row
  }"]`;
  const target = document.querySelector(selector);
  if (target) target.classList.add("active");
}

function connectCurrent() {
  if (cursor.col !== 1) return;
  const rightIndex = cursor.row;
  const leftIndex = selectedLeft;
  if (leftIndex == null || rightIndex == null) return;
  if (Object.values(connections).includes(rightIndex)) return;
  connections[leftIndex] = rightIndex;
  requestAnimationFrame(() => drawWire(leftIndex, rightIndex));
  updateResult();
  selectedLeft = null;
  validate();
}

function validate() {
  const sum = calcResult();
  const res = document.getElementById("resultDisp");
  if (
    sum === TARGET &&
    Object.keys(connections).length === numbersLeft.length
  ) {
    res.style.color = "#00ff8a";
    setTimeout(() => {
      if (confirm("Bravo ! Recommencer ?")) {
        location.reload();
      }
    }, 300);
  } else {
    res.style.color = "#ff4d4d";
  }
  res.textContent = pad3(sum);
}

function calcResult() {
  let total = 0;
  for (let i in connections) {
    const leftVal = numbersLeft[i];
    const rightIdx = connections[i];
    const mult = shuffledMultipliers[rightIdx];
    total += leftVal * mult;
  }
  return total;
}

function updateResult() {
  document.getElementById("resultDisp").textContent = pad3(calcResult());
}

function resetAll() {
  connections = {};
  clearWires();
  updateResult();
  selectedLeft = null;
}

function clearWires() {
  const svg = document.getElementById("wires");
  svgLines.forEach((l) => l?.remove());
  svgLines = [];
}

function drawWire(leftIdx, rightIdx) {
  const leftNode = document.querySelector(
    `.left.node[data-index="${leftIdx}"]`
  );
  const rightNode = document.querySelector(
    `.right.node[data-index="${rightIdx}"]`
  );
  const svg = document.getElementById("wires");

  if (!leftNode || !rightNode) return;

  if (svgLines[leftIdx]) {
    svg.removeChild(svgLines[leftIdx]);
    svgLines[leftIdx] = null;
  }

  const start = anchorPoint(leftNode, "right");
  const end = anchorPoint(rightNode, "left");
  const midX = (start.x + end.x) / 2;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const d = `M ${start.x},${start.y} L ${midX},${start.y} L ${midX},${end.y} L ${end.x},${end.y}`;
  path.setAttribute("d", d);
  path.setAttribute("stroke", colors[leftIdx]);
  path.setAttribute("stroke-width", "4");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("opacity", "0.9");
  path.setAttribute("filter", `drop-shadow(0 0 6px ${colors[leftIdx]})`);

  svg.appendChild(path);
  svgLines[leftIdx] = path;
}

function anchorPoint(el, side) {
  const svg = document.getElementById("wires");
  const pt = svg.createSVGPoint();
  const rect = el.getBoundingClientRect();
  const wrapperRect = document
    .querySelector(".wrapper")
    .getBoundingClientRect();

  pt.x =
    side === "right"
      ? rect.right - wrapperRect.left
      : rect.left - wrapperRect.left;
  pt.y = rect.top - wrapperRect.top + rect.height / 2;

  return pt;
}

function pad3(n) {
  return n.toString().padStart(3, "0");
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    cursor.row = (cursor.row - 1 + numbersLeft.length) % numbersLeft.length;
  } else if (e.key === "ArrowDown") {
    cursor.row = (cursor.row + 1) % numbersLeft.length;
  } else if (e.key === "ArrowLeft") {
    cursor.col = 0;
  } else if (e.key === "ArrowRight") {
    cursor.col = 1;
  } else if (e.key === "Enter") {
    if (cursor.col === 0) {
      selectedLeft = cursor.row;
    } else {
      connectCurrent();
    }
  } else if (e.key.toLowerCase() === "v") {
    validate();
  } else if (e.key.toLowerCase() === "r") {
    resetAll();
  }
  highlightCursor();
});
