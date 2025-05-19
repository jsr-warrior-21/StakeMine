 
      document.addEventListener("DOMContentLoaded", () => {
        const balance = 1000;
        let currentBalance = balance;

        if (localStorage.getItem("mineGameBalance")) {
          currentBalance = parseInt(localStorage.getItem("mineGameBalance"));
        }

        document.getElementById("currentBalance").textContent = currentBalance;

        document
          .getElementById("startGameBtn")
          .addEventListener("click", () => {
            const betAmount = parseInt(
              document.getElementById("betAmount").value
            );
            const mineCount = parseInt(
              document.getElementById("mineCount").value
            );
            const betError = document.getElementById("betError");

            if (isNaN(betAmount)) {
              betError.textContent = "Please enter a valid bet amount";
              return;
            }

            if (betAmount < 1) {
              betError.textContent = "Bet amount must be at least $1";
              return;
            }

            if (betAmount > currentBalance) {
              betError.textContent = "You don't have enough balance";
              return;
            }

            betError.textContent = "";

            localStorage.setItem("mineGameBet", betAmount);
            localStorage.setItem("mineGameMines", mineCount);
            localStorage.setItem("mineGameBalance", currentBalance - betAmount);

            window.location.href = "game.html";
          });
      });
    

      
      document.addEventListener("DOMContentLoaded", () => {
        const clickSound = document.getElementById("clickSound");
        const winSound = document.getElementById("winSound");
        const loseSound = document.getElementById("loseSound");
        const cashoutSound = document.getElementById("cashoutSound");

        document
          .querySelectorAll("button:not(#cashOutBtn)")
          .forEach((button) => {
            button.addEventListener("click", () => {
              clickSound.currentTime = 0;
              clickSound.play();
            });
          });

        const betAmount = parseInt(localStorage.getItem("mineGameBet")) || 10;
        const mineCount = parseInt(localStorage.getItem("mineGameMines")) || 5;
        let balance = parseInt(localStorage.getItem("mineGameBalance")) || 1000;

        const gameState = {
          balance: balance,
          betAmount: betAmount,
          profit: 0,
          multiplier: 1.0,
          mineCount: mineCount,
          mines: [],
          revealedTiles: [],
          gameActive: true,
          cashOutMultiplier: 0,
        };

        const elements = {
          currentBet: document.getElementById("currentBet"),
          profit: document.getElementById("profit"),
          multiplier: document.getElementById("multiplier"),
          gameBoard: document.getElementById("gameBoard"),
          cashOutBtn: document.getElementById("cashOutBtn"),
          newGameBtn: document.getElementById("newGameBtn"),
          resultModal: document.getElementById("resultModal"),
          resultTitle: document.getElementById("resultTitle"),
          resultMessage: document.getElementById("resultMessage"),
          playAgainBtn: document.getElementById("playAgainBtn"),
        };

        function initGame() {
          elements.currentBet.textContent = `$${gameState.betAmount}`;
          updateUI();
          createBoard();
          generateMines();
          setupEventListeners();
        }

        function createBoard() {
          elements.gameBoard.innerHTML = "";
          const tileCount = 25;

          for (let i = 0; i < tileCount; i++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.dataset.index = i;

            const imgContainer = document.createElement("div");
            imgContainer.className = "tile-content";
            tile.appendChild(imgContainer);

            tile.addEventListener("click", handleTileClick);
            elements.gameBoard.appendChild(tile);
          }
        }

        function generateMines() {
          gameState.mines = [];
          const tileCount = 25;

          while (gameState.mines.length < gameState.mineCount) {
            const randomIndex = Math.floor(Math.random() * tileCount);
            if (!gameState.mines.includes(randomIndex)) {
              gameState.mines.push(randomIndex);
            }
          }
        }

        function handleTileClick(e) {
          if (!gameState.gameActive) return;

          const tile = e.currentTarget;
          const tileIndex = parseInt(tile.dataset.index);

          if (gameState.revealedTiles.includes(tileIndex)) return;

          if (gameState.mines.includes(tileIndex)) {
            const imgContainer = tile.querySelector(".tile-content");
            imgContainer.innerHTML = `<img src="./image/og.png" alt="Mine" class="mine-image">`;
            tile.classList.add("mine-revealed");
            endGame(false);
            return;
          }

          clickSound.currentTime = 0;
          clickSound.play();

          const imgContainer = tile.querySelector(".tile-content");
          imgContainer.innerHTML = `<img src="./image/rename.png" alt="Diamond" class="diamond-image">`;
          tile.classList.add("diamond-revealed");
          gameState.revealedTiles.push(tileIndex);

          const totalTiles = 25;
          const safeTiles = totalTiles - gameState.mineCount;
          const revealedSafeTiles = gameState.revealedTiles.length;

          gameState.multiplier = calculateMultiplier(
            revealedSafeTiles,
            safeTiles
          );
          gameState.cashOutMultiplier = gameState.multiplier;
          gameState.profit = gameState.betAmount * (gameState.multiplier - 1);

          if (revealedSafeTiles === safeTiles) {
            endGame(true);
          }

          updateUI();
        }

        function calculateMultiplier(revealedSafeTiles, totalSafeTiles) {
          const base = 1.0;
          const riskFactor = 1.5;
          const multiplier =
            base + (revealedSafeTiles / totalSafeTiles) * riskFactor;
          return parseFloat(multiplier.toFixed(2));
        }

        function cashOut() {
          if (!gameState.gameActive || gameState.cashOutMultiplier <= 1.0)
            return;

          cashoutSound.currentTime = 0;
          cashoutSound.play();

          gameState.balance +=
            gameState.betAmount * gameState.cashOutMultiplier;
          gameState.profit =
            gameState.betAmount * (gameState.cashOutMultiplier - 1);
          endGame(true, true);
        }

        function endGame(win, cashout = false) {
          gameState.gameActive = false;

          if (!win) {
            loseSound.currentTime = 0;
            loseSound.play();

            document.querySelectorAll(".tile").forEach((tile, index) => {
              if (gameState.mines.includes(index)) {
                const imgContainer = tile.querySelector(".tile-content");
                imgContainer.innerHTML = `<img src="./image/og.png" alt="Mine" class="mine-image">`;
                tile.classList.add("mine-revealed");
              }
            });

            elements.resultTitle.textContent = "Game Over!";
            elements.resultMessage.textContent = `You hit a mine and lost $${gameState.betAmount}.`;
          } else {
            if (cashout) {
              elements.resultTitle.textContent = "Cashed Out!";
              elements.resultMessage.textContent = `You won $${gameState.profit.toFixed(
                2
              )} at ${gameState.multiplier.toFixed(2)}x!`;
            } else {
              winSound.currentTime = 0;
              winSound.play();

              elements.resultTitle.textContent = "You Won!";
              elements.resultMessage.textContent = `You found all diamonds and won $${gameState.profit.toFixed(
                2
              )} at ${gameState.multiplier.toFixed(2)}x!`;
              gameState.balance += gameState.betAmount * gameState.multiplier;
            }
          }

      
          localStorage.setItem("mineGameBalance", gameState.balance);

          elements.resultModal.style.display = "flex";
          updateUI();
        }

        function updateUI() {
          elements.profit.textContent = `$${gameState.profit.toFixed(2)}`;
          elements.multiplier.textContent = `${gameState.multiplier.toFixed(
            2
          )}x`;

          if (gameState.profit > 0) {
            elements.profit.style.color = "var(--profit-color)";
          } else if (gameState.profit < 0) {
            elements.profit.style.color = "var(--loss-color)";
          } else {
            elements.profit.style.color = "var(--text-color)";
          }
        }

      
        function setupEventListeners() {
          elements.cashOutBtn.addEventListener("click", cashOut);

          elements.newGameBtn.addEventListener("click", () => {
            window.location.href = "index.html";
          });

          elements.playAgainBtn.addEventListener("click", () => {
            window.location.href = "index.html";
          });
        }

        initGame();
      });
   