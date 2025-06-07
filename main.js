const ROWS = 15;
const COLS = 15;
let grid = [];
let gridEl = document.querySelector(".grid");
let moving = false;
let heldInterval;
let lastPos = [];
let activeBuilding;
let activeCell;
let cellOffsetX = 0;
let cellOffsetY = 0;
let imagePreviewElement;

let buildings = {
   fountain: {
      handle: "fountain",
      name: "Fountain",
      image: "fountain.png",
      height: 2,
      width: 3,
   },
   fertilizer: {
      handle: "fertilizer",
      name: "Fertilizer Bag",
      image: "fertilizer.png",
      height: 2,
      width: 2,
   },
   plot: {
      handle: "plot",
      name: "Plot",
      image: "plot.png",
      height: 5,
      width: 5,
   },
   bush: {
      handle: "bush",
      name: "Shrubbery",
      image: "bush.png",
      height: 1,
      width: 3
   },
   tree: {
      handle: "tree",
      name: "Decorative Tree",
      image: "tree.png",
      height: 2,
      width: 4
   }
}

let inventory;
let gridBuildings;
// let inventory = [
//    ["plot", 2],
//    ["fertilizer", 2],
//    ["fountain", 2],
//    ["bush", 4],
//    ["tree", 1]
// ];


const SaveManager = {
   decrementInventoryItem(handle) {
      let itemIndex = inventory.findIndex((arr) => arr[0] == handle);
      inventory[itemIndex][1]--;
      if (inventory[itemIndex][1] === 0) inventory.splice(itemIndex, 1);

      localStorage.setItem("citybuilder-inventory", JSON.stringify(inventory));
   },
   incrementInventoryItem(handle) {
      let itemIndex = inventory.findIndex((arr) => arr[0] == handle);
      if (itemIndex != -1) inventory[itemIndex][1]++;
      else inventory.push([handle, 1]);
      localStorage.setItem("citybuilder-inventory", JSON.stringify(inventory));
   },
   loadInventory() {
      let savedInventory = localStorage.getItem("citybuilder-inventory");
      if (savedInventory) inventory = JSON.parse(savedInventory);
      else {
         inventory = [
            ["plot", 2],
            ["fertilizer", 2],
            ["fountain", 2],
            ["bush", 4],
            ["tree", 1]
         ];
      }
      return inventory;
   },

   addGridItem(handle, id, position) {
      gridBuildings.push({ handle, id, position });
      localStorage.setItem("citybuilder-grid", JSON.stringify(gridBuildings));
   },
   moveGridItem(id, newPosition) {
      let itemIndex = gridBuildings.findIndex((arr) => arr.id == id);
      gridBuildings[itemIndex].position = newPosition;
      localStorage.setItem("citybuilder-grid", JSON.stringify(gridBuildings));
   },
   removeGridItem(id) {
      gridBuildings = gridBuildings.filter(item => { item.id != id });
      localStorage.setItem("citybuilder-grid", JSON.stringify(gridBuildings));
   },
   loadGrid() {
      let savedGrid = localStorage.getItem("citybuilder-grid");
      if (savedGrid) gridBuildings = JSON.parse(savedGrid);
      else {
         gridBuildings = [];
      }
      console.log(gridBuildings)
      return gridBuildings;
   }
};

generateGrid();
createImagePreviewElement();

document.querySelector(".inventory-parent").addEventListener("mouseup", () => {
   if (moving) {
      moving = false;
      activeBuilding.imageElement.remove();
      SaveManager.incrementInventoryItem(activeBuilding.handle);
      SaveManager.removeGridItem(activeBuilding.id);
      postMoveCleanup();
      populateInventoryElements();
   }
});

function findPlaceForBuilding(building)  {
   for (let i = 0; i < ROWS; i++)
      for (let j = 0; j < COLS; j++)
         if (canPlaceBuilding(building, { x: i, y: j }))
            return { x: i, y: j };
   return { x: -1, y: -1 };
}

async function init() {
   await SaveManager.loadInventory();
   populateInventoryElements();
   await SaveManager.loadGrid();
   populateGridBuildings();
}
init();

function populateInventoryElements() {
   console.log("populating inventory")
   let inventoryBox = document.querySelector(".inventory");
   inventoryBox.innerHTML = "";
   inventory.forEach((data) => {
      let buildingId = data[0];
      let quantity = data[1];
      let building = buildings[buildingId];

      let element = document.createElement("div");
      element.classList.add("inventory-item");
      element.innerHTML = `
         <img src="${building.image}">
         <p>${building.name}</p>
         <p>${building.height}x${building.width}</p>
         <p>quantity ${quantity}</p>
      `;
      element.addEventListener("click", () => {
         let position = findPlaceForBuilding(building);
         if (position.x === -1) {
            alert("no space! clear up the board first");
            return;
         }
         let newBuilding = structuredClone(building);
         newBuilding.id = window.crypto.randomUUID();
         placeBuilding(newBuilding, position);
         SaveManager.decrementInventoryItem(building.handle);
         SaveManager.addGridItem(building.handle, newBuilding.id, position);
         populateInventoryElements();
      });
      inventoryBox.appendChild(element);
   });
}
function populateGridBuildings() {
   gridBuildings.forEach((building) => {
      let buildingData = buildings[building.handle];
      let newBuilding = structuredClone(buildingData);
      newBuilding.id = building.id;
      placeBuilding(newBuilding, building.position);
   });
}

// listeners
document.querySelector(".grid").addEventListener("mousedown", () => {
   if (!activeCell || moving) return;
   let i = activeCell.position.x;
   let j = activeCell.position.y;
   if (!grid[i][j]["filled"]) return;
   heldInterval = setTimeout(() => {
      if (!activeCell) return;
      clearTimeout(heldInterval);
      moving = true;
      lastPos = [i, j];
      activeBuilding = grid[i][j]["building"];

      let firstCellOfBuildingPosition = getBuildingTopLeftPosition();
      cellOffsetX = i - firstCellOfBuildingPosition.x;
      cellOffsetY = j - firstCellOfBuildingPosition.y;

      document.querySelector(":root").style.setProperty("--building-opacity", ".4")
      removeBuilding(activeBuilding);
      updateArea(activeCell.position.x, activeCell.position.y, activeBuilding.height, activeBuilding.width);
   }, 650);
});
document.body.addEventListener("mouseup", () => {
   imagePreviewElement.remove();
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
function createImagePreviewElement() {
   imagePreviewElement = document.createElement("img");
   imagePreviewElement.style.opacity = "var(--building-opacity)";
   imagePreviewElement.style.pointerEvents = "none";
   imagePreviewElement.style.position = "absolute";
   imagePreviewElement.style.right = "0";
   imagePreviewElement.style.bottom = "0";
}
function addTracking(i, j) {
   let cellObj = grid[i][j];
   let cell = cellObj.element;

   cell.addEventListener("mouseover", () => {
      activeCell = cellObj;
      if (moving) updateArea(i, j, activeBuilding.height, activeBuilding.width);
   });
   cell.addEventListener("mouseout", () => {
      if (activeBuilding)
         for (let row = i; row < i + activeBuilding.height; row++)
            for (let col = j; col < j + activeBuilding.width; col++)
               if (row < ROWS && col < COLS) {
                  grid[row][col]["element"].classList.remove("preview-full");
                  grid[row][col]["element"].classList.remove("preview-empty");
               }
      activeCell = undefined;
   });
}

function cancelMove() {
   if (!moving) return;
   if (!activeCell) returnToCurrentPosition();
   else {
      let i = activeCell.position.x;
      let j = activeCell.position.y;
      if (canPlaceBuilding(activeBuilding, { x: i, y: j })) {
         placeBuilding(activeBuilding, { x: i, y: j });
         SaveManager.moveGridItem(activeBuilding.id, { x: i - cellOffsetX, y: j - cellOffsetY });
         updateArea(activeCell.position.x, activeCell.position.y, activeBuilding.height, activeBuilding.width);
      } else returnToCurrentPosition();
   }

   postMoveCleanup();

   function returnToCurrentPosition() {
      placeBuilding(activeBuilding, { x: lastPos[0], y: lastPos[1] });
      updateArea(lastPos[0] + cellOffsetX, lastPos[1] + cellOffsetY, activeBuilding.height, activeBuilding.width);
   }
}

function postMoveCleanup() {
   cellOffsetX = 0;
   cellOffsetY = 0;
   moving = false;
   document.querySelector(":root").style.setProperty("--building-opacity", "1")
   clearPreview();
   imagePreviewElement.remove();
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

   let lastItem;
   for (let i = buildingPosX; i < buildingPosX + height; i++) {
      for (let j = buildingPosY; j < buildingPosY + width; j++) {
         if (!grid[i] || !grid[i][j]) continue;
         const cell = grid[i][j]["element"];
         cell.classList.remove("full", "preview-full", "preview-empty");

         if (grid[i][j]["filled"]) {
            cell.classList.add("full");
            if (moving) cell.classList.add("preview-full");
         } else {
            if (moving) cell.classList.add("preview-empty");
         }
         lastItem = grid[i][j];
      }
   }
   lastItem.element.appendChild(imagePreviewElement);
   imagePreviewElement.src = activeBuilding.image;
   let cellSideLength = document.querySelector(".grid").firstElementChild.offsetWidth;
   imagePreviewElement.style.width = cellSideLength * activeBuilding.width + "px";
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
      buildingPosX + building.height > ROWS ||
      buildingPosY + building.width > COLS) {
      return false;
   }

   for (let i = buildingPosX; i < buildingPosX + building.height; i++) {
      for (let j = buildingPosY; j < buildingPosY + building.width; j++) {
         if (grid[i][j]["filled"]) return false;
      }
   }
   return true;
}
function placeBuilding(building, position) {
   let buildingPosX = position.x - cellOffsetX;
   let buildingPosY = position.y - cellOffsetY;

   let lastItem;
   for (let i = buildingPosX; i < buildingPosX + building.height; i++) {
      for (let j = buildingPosY; j < buildingPosY + building.width; j++) {
         grid[i][j]["filled"] = true;
         grid[i][j]["element"].classList.add("full");
         grid[i][j]["building"] = building;
         lastItem = grid[i][j];
      }
   }
   let buildingImage = lastItem.building.imageElement;
   if (!buildingImage) {
      buildingImage = document.createElement("img");
      buildingImage.style.opacity = "var(--building-opacity)";
      buildingImage.style.pointerEvents = "none";
      buildingImage.style.position = "absolute";
      buildingImage.style.right = "0";
      buildingImage.style.bottom = "0";
      lastItem.building.imageElement = buildingImage;
   }
   buildingImage.src = lastItem.building.image;
   let cellSideLength = document.querySelector(".grid").firstElementChild.offsetWidth;
   buildingImage.style.width = cellSideLength * lastItem.building.width + "px";
   lastItem.element.style.position = "relative";
   lastItem.element.append(buildingImage);
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
