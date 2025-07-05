document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
  document
    .getElementById("dark-mode-toggle")
    .addEventListener("click", toggleDarkMode);
  document.getElementById("menu-toggle").addEventListener("click", toggleMenu);
});

function toggleMenu() {
  document.getElementById("menu-container").classList.toggle("active");
}

const gameModes = {
  mtg: 20,
  edh: 40,
  lorcana: 0,
  yugioh: 8000,
  grand_archive: 30, // Default value for Grand Archive
  sorcery: 20,
};

let currentGameMode = "yugioh"; // Default on load

function setGameMode(mode) {
  if (gameModes[mode] !== undefined) {
    currentGameMode = mode;
    document.querySelectorAll(".life-total").forEach((lifeElement) => {
      lifeElement.textContent = gameModes[mode];
    });
  }
}

document.getElementById("reset-game").addEventListener("click", () => {
  setGameMode(currentGameMode);
});

function initializeGame(playerCount) {
  const container = document.getElementById("players-container");
  container.innerHTML = "";

  if (playerCount === 2) {
    container.className = "players-grid players-2";
    createPlayer(1);
    createPlayer(2);
  } else {
    container.className = "players-grid players-4";
    createPlayer(1);
    createPlayer(2);
    createPlayer(4); // Switched order
    createPlayer(3); // Switched order
  }
}

function createPlayer(playerId) {
  const playerDiv = document.createElement("div");
  playerDiv.classList.add("player");
  playerDiv.dataset.playerId = playerId;

  playerDiv.innerHTML = `
    <div class="player-name" contenteditable="true" onfocus="this.select()">Player ${playerId}</div>
    <div class="life-total" onclick="openLifeInput(${playerId})">8000</div>

    <div class="player-buttons">
        <button class="life-adjust-button">+1</button>

        <button class="icon-button" onclick="rollDice(${playerId}, 6)">
            <img src="path-to-d6-icon.png" alt="D6">
        </button>
        <button class="icon-button" onclick="rollDice(${playerId}, 20)">
            <img src="path-to-d20-icon.png" alt="D20">
        </button>
        <button class="icon-button" onclick="flipCoin(${playerId})">
            <img src="path-to-coin-icon.png" alt="Coin Flip">
        </button>
        <button class="icon-button" onclick="invertPlayer(${playerId})">
            <img src="invert icon.png" alt="Invert">
        </button>

        <button class="life-adjust-button">-1</button>
    </div>
  `;

  document.getElementById("players-container").appendChild(playerDiv);

  // ✅ Clean event handling to avoid double tap
  setTimeout(() => {
    const playerElem = document.querySelector(`[data-player-id="${playerId}"]`);
    const buttons = playerElem.querySelectorAll(".life-adjust-button");

    buttons.forEach((btn) => {
      const amount = btn.textContent.includes("+") ? 1 : -1;

      const start = (e) => {
        e.preventDefault(); // Prevent ghost taps or zoom on mobile
        if (!btn.dataset.holding) {
          btn.dataset.holding = "true";
          startLifeAdjust(playerId, amount);
        }
      };

      const stop = () => {
        if (btn.dataset.holding === "true") {
          stopLifeAdjust();
          btn.dataset.holding = "";
        }
      };

      btn.addEventListener("touchstart", start);
      btn.addEventListener("touchend", stop);
      btn.addEventListener("mousedown", start);
      btn.addEventListener("mouseup", stop);
      btn.addEventListener("mouseleave", stop);
    });
  }, 0);
}

function openLifeInput(playerId) {
  closeExistingPopups(); // Close any existing popups

  let popup = document.createElement("div");
  popup.classList.add("life-input-popup");
  popup.innerHTML = `
        <h3>Adjust Life</h3>
        <input type="text" id="life-input-${playerId}" value="" readonly>
        <div class="calculator-buttons">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
              .map(
                (num) =>
                  `<button class="calc-button" onclick="appendToLifeInput(${playerId}, '${num}')">${num}</button>`
              )
              .join("")}
        </div>
        <div class="popup-actions">
            <button class="calc-button" onclick="applyLifeChange(${playerId}, -1)">-</button>
            <button class="calc-button" onclick="applyLifeChange(${playerId}, 1)">+</button>
            <button class="popup-close" onclick="closeExistingPopups()">Close</button>
        </div>
    `;
  document.querySelector(".container").appendChild(popup);
}

function appendToLifeInput(playerId, number) {
  let inputField = document.getElementById(`life-input-${playerId}`);
  inputField.value += number; // Append number to input field
}

function applyLifeChange(playerId, operation) {
  let inputField = document.getElementById(`life-input-${playerId}`);
  let amount = parseInt(inputField.value);

  if (!isNaN(amount) && amount > 0) {
    adjustLife(playerId, operation * amount); // Apply + or - change
  }

  closeExistingPopups(); // Close after applying change
}

function closeExistingPopups() {
  document
    .querySelectorAll(".life-input-popup")
    .forEach((popup) => popup.remove());
}

function adjustLife(playerId, amount) {
  const lifeElement = document.querySelector(
    `[data-player-id="${playerId}"] .life-total`
  );
  let newLife = parseInt(lifeElement.textContent) + amount;
  if (newLife < 0) newLife = 0;
  lifeElement.textContent = newLife;
}

// Rapidly Adjust Life on Hold (Now Works on PC & Mobile)
let interval = null;
let holdTimeout = null;
let holdTime = 500;

function startLifeAdjust(playerId, amount) {
  // Start with one change on press
  adjustLife(playerId, amount);

  holdTime = 500;

  // Begin acceleration after short delay
  holdTimeout = setTimeout(function repeat() {
    adjustLife(playerId, amount);
    holdTime = Math.max(holdTime * 0.85, 100);
    interval = setTimeout(repeat, holdTime);
  }, 400); // Delay before starting repeat (prevents quick double tap)
}

function stopLifeAdjust() {
  clearTimeout(interval);
  clearTimeout(holdTimeout);
}

// Updated to prevent double input on tap
function singleLifeAdjust(playerId, amount) {
  if (!document.getElementById(`life-btn-${playerId}-${amount}`).disabled) {
    adjustLife(playerId, amount);
    disableTapTemporarily(playerId, amount);
  }
}

function disableTapTemporarily(playerId, amount) {
  let button = document.getElementById(`life-btn-${playerId}-${amount}`);
  if (button) {
    button.disabled = true;
    setTimeout(() => {
      button.disabled = false;
    }, tapDelay);
  }
}

function flipCoin(playerId) {
  const result = Math.random() < 0.5 ? "Heads" : "Tails";
  alert(`Player ${playerId} flipped: ${result}`);
}

function rollDice(playerId, diceType) {
  const result = Math.floor(Math.random() * diceType) + 1;
  alert(`Player ${playerId} rolled a D${diceType}: ${result}`);
}

function invertPlayer(playerId) {
  let playerDiv = document.querySelector(`[data-player-id="${playerId}"]`);
  if (playerDiv) {
    playerDiv.classList.toggle("inverted");
  }
}

// Change Life Using Pop-up
function changeLife(playerId, amount) {
  adjustLife(playerId, parseInt(amount));
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark-mode")
  );
}
