const ROWS = 16;
const COLS = 16;
let grid = [];
let preview = document.querySelector(".cursor-preview");
let gridEl = document.querySelector(".grid");
let moving = false;
let heldInterval;
let lastPos = [];
let activeBuilding;
let activeCell;
let cellOffsetX = 0;
let cellOffsetY = 0;

generateGrid();
placeBuilding({
   name: "test",
   height: 3,
   width: 4,
   getHeight() {
      return this.height;
   },
   getWidth() {
      return this.width;
   }
}, { x: 3, y: 3 });

// listeners
document.addEventListener("mousemove", (event) => {
   if (preview) {
      preview.style.left = `${event.clientX}px`;
      preview.style.top = `${event.clientY}px`;
   }
});
document.querySelector(".grid").addEventListener("mousedown", () => {
   if (!activeCell || moving) return;
   let i = activeCell.position.x;
   let j = activeCell.position.y;
   if (!grid[i][j]["filled"]) return;
   heldInterval = setTimeout(() => {
      if (!activeCell) return;
      console.log("start moving")
      clearTimeout(heldInterval);
      moving = true;
      lastPos = [i, j];
      activeBuilding = grid[i][j]["building"];

      let firstCellOfBuildingPosition = getBuildingTopLeftPosition();
      cellOffsetX = i - firstCellOfBuildingPosition.x;
      cellOffsetY = j - firstCellOfBuildingPosition.y;

      // image overlays
      removeBuilding(activeBuilding);
      updateArea(activeCell.position.x, activeCell.position.y, activeBuilding.getHeight(), activeBuilding.getWidth());
   }, 800);
});
document.querySelector(".grid").addEventListener("mouseup", () => {
   if (moving) cancelMove();
   clearTimeout(heldInterval);
});

// functions
function generateGrid() {
   if (gridEl) gridEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
   for (let i = 0; i < ROWS; i++) {
      grid[i] = [];
      for (let j = 0; j < COLS; j++) {
         let cell = document.createElement("div");
         cell.classList.add("box");
         grid[i][j] = {
            element: cell,
            filled: false,
            building: undefined,
            position: {
               x: i,
               y: j
            }
         }
         gridEl.appendChild(cell);
         addTracking(i, j);
      }
   }
   let breakEl = document.createElement("br");
   gridEl === null || gridEl === void 0 ? void 0 : gridEl.appendChild(breakEl);
}
function addTracking(i, j) {
   let cellObj = grid[i][j];
   let cell = cellObj.element;

   cell.addEventListener("mouseover", (e) => {
      activeCell = cellObj;
      if (moving) updateArea(i, j, activeBuilding.getHeight(), activeBuilding.getWidth());
   });
   cell.addEventListener("mouseout", () => {
      if (activeBuilding)
         for (let row = i; row < i + activeBuilding.getHeight(); row++)
            for (let col = j; col < j + activeBuilding.getWidth(); col++)
               if (row < ROWS && col < COLS) {
                  grid[row][col]["element"].classList.remove("preview-full");
                  grid[row][col]["element"].classList.remove("preview-empty");
               }
      activeCell = undefined;
   });
}

function cancelMove() {
   if (!activeCell) return;
   let i = activeCell.position.x;
   let j = activeCell.position.y;
   if (activeCell) {
      if (canPlaceBuilding(activeBuilding, { x: i, y: j })) {
         placeBuilding(activeBuilding, { x: i, y: j });
         updateArea(activeCell.position.x, activeCell.position.y, activeBuilding.getHeight(), activeBuilding.getWidth());
      } else returnToCurrentPosition();
   }
   else returnToCurrentPosition();

   function returnToCurrentPosition() {
      placeBuilding(activeBuilding, { x: lastPos[0], y: lastPos[1] });
      updateArea(lastPos[0] + cellOffsetX, lastPos[1] + cellOffsetY, activeBuilding.getHeight(), activeBuilding.getWidth());
   }
   cellOffsetX = 0;
   cellOffsetY = 0;
   moving = false;
   clearPreview();
}

function getBuildingTopLeftPosition() {
   for (let row = 0; row < grid.length; row++)
      for (let col = 0; col < grid[row].length; col++)
         if (grid[row][col]["building"] === activeBuilding)
            return { x: row, y: col };
   return { x: -1, y: -1 };
}

function removeBuilding(buildingId) {
   grid.forEach((row) => {
      row.forEach((cell) => {
         if (cell["building"] === buildingId) {
            cell["filled"] = false;
            cell["building"] = undefined;
            cell["element"].classList.remove("full");
         }
      });
   });
}

function updateArea(activeX, activeY, height, width) {
   clearPreview();

   let buildingPosX = activeX - cellOffsetX;
   let buildingPosY = activeY - cellOffsetY;

   for (let i = buildingPosX; i < buildingPosX + height; i++) {
      for (let j = buildingPosY; j < buildingPosY + width; j++) {
         if (i < ROWS && j < COLS && i >= 0 && j >= 0) {
            const cell = grid[i][j]["element"];
            cell.classList.remove("full", "preview-full", "preview-empty");

            if (grid[i][j]["filled"]) {
               cell.classList.add("full");
               if (moving) cell.classList.add("preview-full");
            } else {
               if (moving) cell.classList.add("preview-empty");
            }
         }
      }
   }
}

function clearPreview() {
   document.querySelectorAll(".preview-full").forEach((element) => {
      element.classList.remove("preview-full");
   });
   document.querySelectorAll(".preview-empty").forEach((element) => {
      element.classList.remove("preview-empty");
   });
}

function canPlaceBuilding(building, position) {
   let buildingPosX = position.x - cellOffsetX;
   let buildingPosY = position.y - cellOffsetY;

   if (buildingPosX < 0 || buildingPosY < 0 ||
      buildingPosX + building.getHeight() > ROWS ||
      buildingPosY + building.getWidth() > COLS) {
      return false;
   }

   for (let i = buildingPosX; i < buildingPosX + building.getHeight(); i++) {
      for (let j = buildingPosY; j < buildingPosY + building.getWidth(); j++) {
         if (grid[i][j]["filled"]) return false;
      }
   }
   return true;
}
function placeBuilding(building, position) {
   let buildingPosX = position.x - cellOffsetX;
   let buildingPosY = position.y - cellOffsetY;

   for (let i = buildingPosX; i < buildingPosX + building.getHeight(); i++) {
      for (let j = buildingPosY; j < buildingPosY + building.getWidth(); j++) {
         grid[i][j]["filled"] = true;
         grid[i][j]["element"].classList.add("full");
         grid[i][j]["building"] = building;
      }
   }
}

// zoom
let gridScale = .6;
function zoomIn() {
   gridScale += .1;
   if (gridScale > 1)
      gridScale = 1;
   renderGrid();
}
function zoomOut() {
   if (gridScale > .3)
      gridScale -= .1;
   renderGrid();
}
function renderGrid() {
   if (gridEl)
      gridEl.style.transform = `scale(${gridScale})`;
}
