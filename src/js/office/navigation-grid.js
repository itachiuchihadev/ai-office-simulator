// js/office/navigation-grid.js — Strict 4-Directional Orthogonal A* Pathfinding on Blue Floor Tiles

import { state } from '../config.js';
import { getOfficeLocations } from './rooms.js';

// 4x4 px grid resolution
export const GRID_CELL_SIZE = 4;

export const CELL_TYPE = {
  FLOOR: 0,        // Walkable Blue Floor Tile
  DOORWAY: 1,      // Walkable Doorway Opening / Threshold
  WALL: 2,         // Blocked Wall / Background
  PARTITION: 3,    // Blocked Partition Wall
  DESK: 4,         // Blocked Desk Furniture
  OBSTACLE: 5,     // Blocked Appliance / Decor
  SEAT: 6,         // Character Seat (walkable when reaching or leaving desk)
};

/**
 * Builds the 2D spatial grid mapping every pixel tile to its walkable component.
 */
export function createNavigationGrid() {
  const W = state.canvasW || 256;
  const H = state.canvasH || 224;
  const midX = Math.round(W / 2);

  const cols = Math.ceil(W / GRID_CELL_SIZE);
  const rows = Math.ceil(H / GRID_CELL_SIZE);

  // Initialize entire matrix as open blue floor
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = new Uint8Array(cols);
    row.fill(CELL_TYPE.FLOOR);
    grid.push(row);
  }

  function markRect(x1, y1, w, h, type) {
    const startCol = Math.max(0, Math.floor(x1 / GRID_CELL_SIZE));
    const endCol = Math.min(cols - 1, Math.floor((x1 + w - 1) / GRID_CELL_SIZE));
    const startRow = Math.max(0, Math.floor(y1 / GRID_CELL_SIZE));
    const endRow = Math.min(rows - 1, Math.floor((y1 + h - 1) / GRID_CELL_SIZE));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        grid[r][c] = type;
      }
    }
  }

  // 1. SKY & TOP WALL (y < 114 is non-walkable wall)
  markRect(0, 0, W, 114, CELL_TYPE.WALL);

  // 2. WALL AMENITIES (Top wall obstacles)
  markRect(0, 85, 36, 32, CELL_TYPE.OBSTACLE);           // Vending Machine
  markRect(38, 98, 30, 18, CELL_TYPE.OBSTACLE);          // Coffee & Snack Table
  markRect(midX - 22, 95, 14, 20, CELL_TYPE.OBSTACLE);   // Left Door Plant
  markRect(midX + 35, 95, 14, 20, CELL_TYPE.OBSTACLE);   // Right Door Plant
  markRect(Math.min(W - 72, midX + 58), 100, 38, 18, CELL_TYPE.OBSTACLE); // Lounge Sofa
  markRect(W - 38, 102, 12, 16, CELL_TYPE.OBSTACLE);     // Trash Bin
  markRect(W - 28, 88, 28, 32, CELL_TYPE.OBSTACLE);      // Document File Cabinet

  // 3. MANAGER'S PRIVATE CORNER OFFICE (Bottom-Left: x = 8..82, y = 158..216)
  const mgrX = 8;
  const mgrY = 158;
  const mgrW = 74;
  const mgrH = 58;

  // Top Glass Partition Wall
  markRect(mgrX, mgrY, mgrW, 6, CELL_TYPE.PARTITION);

  // Right Glass Partition Wall (Upper section: y = mgrY..mgrY+22)
  markRect(mgrX + mgrW - 3, mgrY, 4, 22, CELL_TYPE.PARTITION);

  // Doorway opening (y = mgrY+22..mgrY+38, x = mgrX+mgrW-4..mgrX+mgrW+4)
  markRect(mgrX + mgrW - 4, mgrY + 22, 8, 16, CELL_TYPE.DOORWAY);

  // Right Glass Partition Wall (Lower section: y = mgrY+38..mgrY+mgrH)
  markRect(mgrX + mgrW - 3, mgrY + 38, 4, mgrH - 38, CELL_TYPE.PARTITION);

  // Executive Desk inside Manager Office
  markRect(mgrX + 14, mgrY + 14, 44, 22, CELL_TYPE.DESK);

  // Plant & visitor chair in Manager Office
  markRect(mgrX + 2, mgrY + 34, 14, 18, CELL_TYPE.OBSTACLE);

  // 4. CUBICLE WORKSTATIONS
  const leftX = Math.max(88, midX - 95);
  const rightX = midX + 17;
  const cubW = 78;
  const cubH = 28;

  // Left Cubicle Block (Rows at y = 132, 162, 192)
  [132, 162, 192].forEach((cy, rowIdx) => {
    // Back partition wall & desk surface
    markRect(leftX, cy, cubW, 6, CELL_TYPE.PARTITION);
    markRect(leftX, cy + 6, cubW, cubH - 6, CELL_TYPE.DESK);

    // Left outer partition
    markRect(leftX, cy, 3, cubH, CELL_TYPE.PARTITION);
    // Right aisle partition (with open doorway at bottom of cubicle)
    markRect(leftX + cubW - 3, cy, 3, cubH - 8, CELL_TYPE.PARTITION);
    // Doorway opening to blue floor aisle
    markRect(leftX + cubW - 4, cy + cubH - 8, 6, 8, CELL_TYPE.DOORWAY);
  });

  // Right Cubicle Block (Rows at y = 132, 162, 192)
  [132, 162, 192].forEach((cy, rowIdx) => {
    markRect(rightX, cy, cubW, 6, CELL_TYPE.PARTITION);
    markRect(rightX, cy + 6, cubW, cubH - 6, CELL_TYPE.DESK);

    // Right outer partition
    markRect(rightX + cubW - 3, cy, 3, cubH, CELL_TYPE.PARTITION);
    // Left aisle partition (with open doorway at bottom of cubicle)
    markRect(rightX, cy, 3, cubH - 8, CELL_TYPE.PARTITION);
    // Doorway opening to blue floor aisle
    markRect(rightX - 2, cy + cubH - 8, 6, 8, CELL_TYPE.DOORWAY);
  });

  // Printer Station at bottom right
  markRect(rightX + 45, 196, 32, 24, CELL_TYPE.OBSTACLE);

  // 5. MARK SEATS & INTERACTION POINTS AS WALKABLE SEAT/DOORWAY
  const locs = getOfficeLocations();
  Object.values(locs.CHARACTER_HOMES).forEach(pos => {
    markRect(pos.x - 4, pos.y - 4, 8, 8, CELL_TYPE.SEAT);
  });

  // Manager desk seat
  markRect(locs.CHARACTER_HOMES['manager'].x - 4, locs.CHARACTER_HOMES['manager'].y - 4, 8, 8, CELL_TYPE.SEAT);

  return { grid, cols, rows, cellW: GRID_CELL_SIZE, W, H };
}

/**
 * Strictly Orthogonal 4-Directional A* Pathfinding (Horizontal & Vertical ONLY)
 */
export function findPathAStar(startX, startY, destX, destY) {
  const nav = createNavigationGrid();
  const { grid, cols, rows } = nav;

  const startCol = Math.max(0, Math.min(cols - 1, Math.floor(startX / GRID_CELL_SIZE)));
  const startRow = Math.max(0, Math.min(rows - 1, Math.floor(startY / GRID_CELL_SIZE)));
  const destCol = Math.max(0, Math.min(cols - 1, Math.floor(destX / GRID_CELL_SIZE)));
  const destRow = Math.max(0, Math.min(rows - 1, Math.floor(destY / GRID_CELL_SIZE)));

  if (startCol === destCol && startRow === destRow) {
    return [{ x: destX, y: destY }];
  }

  function isWalkable(c, r, isDestination = false) {
    if (c < 0 || c >= cols || r < 0 || r >= rows) return false;
    const type = grid[r][c];
    if (isDestination) {
      return type !== CELL_TYPE.WALL && type !== CELL_TYPE.PARTITION;
    }
    return type === CELL_TYPE.FLOOR || type === CELL_TYPE.DOORWAY || type === CELL_TYPE.SEAT;
  }

  const openSet = [];
  const closedSet = new Uint8Array(cols * rows);
  const gScore = new Float32Array(cols * rows);
  gScore.fill(Infinity);

  const startIndex = startRow * cols + startCol;
  const destIndex = destRow * cols + destCol;

  const cameFrom = new Int32Array(cols * rows);
  cameFrom.fill(-1);

  gScore[startIndex] = 0;

  // Manhattan Heuristic (|dx| + |dy|) for strictly orthogonal movement
  function heuristic(c, r) {
    return Math.abs(c - destCol) + Math.abs(r - destRow);
  }

  openSet.push({ col: startCol, row: startRow, f: heuristic(startCol, startRow) });

  // STRICT 4-DIRECTIONAL NEIGHBORS ONLY (NO DIAGONALS!)
  const neighbors = [
    { dc: 0, dr: -1, cost: 1.0 }, // UP
    { dc: 0, dr: 1, cost: 1.0 },  // DOWN
    { dc: -1, dr: 0, cost: 1.0 }, // LEFT
    { dc: 1, dr: 0, cost: 1.0 },  // RIGHT
  ];

  let found = false;

  while (openSet.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[minIdx].f) minIdx = i;
    }
    const current = openSet.splice(minIdx, 1)[0];
    const currIdx = current.row * cols + current.col;

    if (current.col === destCol && current.row === destRow) {
      found = true;
      break;
    }

    closedSet[currIdx] = 1;

    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i];
      const nc = current.col + n.dc;
      const nr = current.row + n.dr;
      const nIdx = nr * cols + nc;

      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      if (closedSet[nIdx]) continue;

      const isTargetCell = (nc === destCol && nr === destRow);
      if (!isWalkable(nc, nr, isTargetCell)) continue;

      const tentativeG = gScore[currIdx] + n.cost;

      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = currIdx;
        gScore[nIdx] = tentativeG;
        const f = tentativeG + heuristic(nc, nr);

        const existing = openSet.find(item => item.col === nc && item.row === nr);
        if (!existing) {
          openSet.push({ col: nc, row: nr, f });
        } else if (f < existing.f) {
          existing.f = f;
        }
      }
    }
  }

  if (!found) {
    // No path found — decompose direct line into orthogonal: horizontal then vertical
    if (Math.abs(destX - startX) > 0.5 && Math.abs(destY - startY) > 0.5) {
      return [{ x: destX, y: startY }, { x: destX, y: destY }];
    }
    return [{ x: destX, y: destY }];
  }

  // Reconstruct orthogonal node sequence
  const gridPath = [];
  let curr = destIndex;
  while (curr !== -1) {
    const c = curr % cols;
    const r = Math.floor(curr / cols);
    gridPath.unshift({
      x: c * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
      y: r * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    });
    curr = cameFrom[curr];
  }

  // Collinear segment merge (ensures strictly horizontal or vertical line segments)
  const smoothed = smoothOrthogonalPath(gridPath);

  if (smoothed.length > 0) {
    smoothed[smoothed.length - 1] = { x: destX, y: destY };
  }

  // Final safety pass: decompose any remaining diagonal segments into orthogonal L-steps
  return ensureOrthogonalPath(smoothed);
}

/**
 * Guarantees every segment is strictly horizontal or vertical.
 * Any diagonal segment is decomposed into an L-step (horizontal first, then vertical).
 */
function ensureOrthogonalPath(points) {
  if (points.length <= 1) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    // If both axes differ, insert an intermediate orthogonal waypoint
    if (Math.abs(curr.x - prev.x) > 0.5 && Math.abs(curr.y - prev.y) > 0.5) {
      result.push({ x: curr.x, y: prev.y });
    }
    result.push(curr);
  }
  return result;
}

/**
 * Merges consecutive orthogonal grid steps into long horizontal and vertical segments.
 */
function smoothOrthogonalPath(points) {
  if (points.length <= 2) return points;

  const result = [points[0]];
  let lastDir = null; // 'H' for horizontal, 'V' for vertical

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    let currentDir = null;
    if (curr.x !== prev.x && curr.y === prev.y) {
      currentDir = 'H';
    } else if (curr.y !== prev.y && curr.x === prev.x) {
      currentDir = 'V';
    } else {
      // Corner transition: decompose into pure orthogonal step
      result.push({ x: curr.x, y: prev.y });
      result.push(curr);
      lastDir = 'V';
      continue;
    }

    if (currentDir !== lastDir) {
      result.push(curr);
      lastDir = currentDir;
    } else {
      // Extend current horizontal or vertical segment
      result[result.length - 1] = curr;
    }
  }

  return result;
}
