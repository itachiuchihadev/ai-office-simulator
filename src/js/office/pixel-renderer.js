// js/office/pixel-renderer.js — Pixel-perfect Office Renderer with Manager Corner Office

import { state } from '../config.js';
import { updateCharacterPosition } from './characters.js';
import { getOfficeLocations } from './rooms.js';

// ── Sprite Image Cache ────────────────────────────────────

const SPRITE_BASE = '/assets/extracted_assets/all/';

const ALL_SPRITE_NAMES = [
  'sky_with_clouds',
  'wall_partition_blue', 'wall_partition_white',
  'door_panel_left', 'door_frame_divider', 'door_panel_right',
  'window_double_blue', 'window_with_notes', 'glass_door_tall',
  'chair_red', 'chair_orange', 'chair_green', 'chair_blue', 'chair_purple', 'chair_grey',
  'desk_long_blue', 'table_small_orange',
  'sofa_red', 'sofa_blue', 'sofa_light_blue', 'sofa_green', 'sofa_orange',
  'vending_machine', 'refrigerator_drinks', 'water_dispenser', 'water_cooler',
  'trash_bin_blue', 'trash_bin_green', 'trash_bin_red', 'trash_bin_purple',
  'potted_plant', 'wall_calendar', 'coat_rack',
  'flag_india', 'flag_uk', 'flag_usa',
  'framed_art_sunset', 'building_tower',
  'digital_clock', 'printer_scanner',
  'smartphone', 'tablet', 'coffee_mug',
  'id_card_red', 'id_card_blue', 'id_card_green',
  'paper_stack_white', 'paper_stack_red',
  'card_reader',
  'character_red_hair_girl', 'character_dark_hair_boy',
  'character_glasses_boy', 'character_blue_shirt_girl',
  'character_dark_hair_girl', 'character_designer_girl',
  'character_blond_boy',
  'cat_black', 'dog_corgi',
];

const sprites = {};
let loadedCount = 0;
const totalRequired = ALL_SPRITE_NAMES.length;

ALL_SPRITE_NAMES.forEach(name => {
  const img = new Image();
  img.src = `${SPRITE_BASE}${name}.png`;
  img.onload = () => { loadedCount++; };
  img.onerror = () => { loadedCount++; };
  sprites[name] = img;
});

function drawSprite(ctx, name, x, y, flipX = false) {
  const img = sprites[name];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  if (flipX) {
    ctx.save();
    ctx.translate(Math.round(x + img.naturalWidth), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, Math.round(x), Math.round(y));
  }
}

// ── Main Render Function ──────────────────────────────────

export function renderPixelOffice() {
  const { ctx, canvasW, canvasH, characters, frameCount } = state;
  ctx.save();
  ctx.imageSmoothingEnabled = false; // Keep pixel art crisp

  if (loadedCount < totalRequired * 0.7) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Loading office assets...', canvasW / 2, canvasH / 2);
    ctx.restore();
    return;
  }

  const W = canvasW || 256;
  const H = canvasH || 224;
  const midX = Math.round(W / 2);

  // 1. SKY (y = 0 to 48) — Full width sky
  ctx.fillStyle = '#41a6f6';
  ctx.fillRect(0, 0, W, 48);

  const skyImg = sprites['sky_with_clouds'];
  const skyW = skyImg && skyImg.naturalWidth ? skyImg.naturalWidth : 256;
  for (let sx = 0; sx < W; sx += skyW) {
    drawSprite(ctx, 'sky_with_clouds', sx, 0);
  }

  // 2. CEILING BEAM / DIVIDER (y = 48 to 52)
  ctx.fillStyle = '#566c86';
  ctx.fillRect(0, 48, W, 4);

  // 3. WALL (y = 52 to 115) — Light grey office wall spanning full width
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(0, 52, W, 63);

  // Horizontal wall panel stripes
  ctx.fillStyle = '#94b0c2';
  ctx.fillRect(0, 60, W, 1);
  ctx.fillRect(0, 70, W, 1);
  ctx.fillRect(0, 80, W, 1);
  ctx.fillRect(0, 94, W, 1);

  // Baseboard trim at bottom of wall
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 114, W, 2);

  // ── Wall Amenities & Fixtures ──
  drawSprite(ctx, 'vending_machine', 8, 85);
  drawSprite(ctx, 'table_small_orange', 42, 102);
  drawSprite(ctx, 'coffee_mug', 44, 105);
  drawSprite(ctx, 'water_cooler', 54, 102);
  drawSprite(ctx, 'window_with_notes', Math.max(70, midX - 95), 80);
  drawSprite(ctx, 'wall_calendar', Math.max(100, midX - 62), 90);

  // Center Glass Double Doors & Clock
  const doorX = midX - 17;
  drawSprite(ctx, 'digital_clock', midX - 10, 73);
  drawSprite(ctx, 'glass_door_tall', doorX, 82);
  drawSprite(ctx, 'glass_door_tall', doorX + 18, 82, true);
  drawSprite(ctx, 'door_frame_divider', doorX + 16, 82);

  // Plants near entrance door
  drawSprite(ctx, 'potted_plant', doorX - 20, 97);
  drawSprite(ctx, 'potted_plant', doorX + 37, 97);

  // Right Amenities
  drawSprite(ctx, 'window_double_blue', Math.min(W - 95, midX + 70), 80);
  drawSprite(ctx, 'sofa_orange', Math.min(W - 70, midX + 60), 104);
  drawSprite(ctx, 'trash_bin_purple', W - 35, 106);
  drawSprite(ctx, 'refrigerator_drinks', W - 25, 89);

  // 4. SPREAD-OUT BLUE BRICK FLOOR
  drawBlueBrickFloor(ctx, 115, W, H);

  // 5. MANAGER'S PRIVATE EXECUTIVE CORNER OFFICE (Bottom-Left Corner)
  drawManagerCornerOffice(ctx, 8, 158, 74, 58);

  // 6. CUBICLE WORKSTATIONS
  drawCubicleRows(ctx, midX);

  // 7. ANIMATED OFFICE PETS
  const petBob = Math.sin(frameCount * 0.05) * 1.5;
  drawSprite(ctx, 'cat_black', midX + 9, 198 + petBob);
  drawSprite(ctx, 'dog_corgi', midX - 36, 208);

  // 8. CHARACTERS
  renderAgentCharacters(ctx, characters, frameCount);

  ctx.restore();
}

// ── Blue Brick Floor ──────────────────────────────────────
function drawBlueBrickFloor(ctx, startY, width, height) {
  const brickW = 32;
  const brickH = 12;
  const colors = ['#51a2e8', '#4598de', '#3b8dd4', '#4c9ee5'];

  for (let y = startY; y < height; y += brickH) {
    const row = Math.floor((y - startY) / brickH);
    const offsetX = (row % 2) * (brickW / 2);

    for (let x = -brickW; x < width + brickW; x += brickW) {
      const bx = x + offsetX;
      const colIdx = Math.abs((Math.floor(x / brickW) + row)) % colors.length;
      ctx.fillStyle = colors[colIdx];
      ctx.fillRect(bx, y, brickW - 1, brickH - 1);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(bx, y, brickW - 1, 1);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(bx, y + brickH - 2, brickW - 1, 1);
    }
  }
}

// ── Manager Private Corner Office (Bottom-Left) ───────────
function drawManagerCornerOffice(ctx, x, y, w, h) {
  // Executive suite floor carpet (warm navy tone with border)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Top Glass Partition Wall
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = 'rgba(147, 197, 253, 0.35)';
  ctx.fillRect(x, y + 1, w, 3);

  // Right Glass Partition Wall (with doorway opening at y+18..y+38)
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x + w - 2, y, 2, 18);
  ctx.fillRect(x + w - 2, y + 38, 2, h - 38);

  // Doorway threshold / Welcome mat
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(x + w - 4, y + 18, 5, 20);

  // Suite Label on glass
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 5px sans-serif';
  ctx.fillText('👔 EXECUTIVE SUITE', x + 6, y + 10);

  // Framed Artwork on back partition
  drawSprite(ctx, 'framed_art_sunset', x + 50, y + 3);

  // Executive Wooden Desk
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(x + 16, y + 16, 42, 22);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(x + 16, y + 16, 42, 2);
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 16, y + 16, 42, 22);

  // Executive Red Leather Chair
  drawSprite(ctx, 'chair_red', x + 30, y + 13);

  // Desk Electronics & Items
  drawSprite(ctx, 'tablet', x + 38, y + 20);
  drawSprite(ctx, 'coffee_mug', x + 20, y + 22);
  drawSprite(ctx, 'paper_stack_white', x + 46, y + 22);
  drawSprite(ctx, 'flag_usa', x + 18, y + 15);

  // Potted plant in corner
  drawSprite(ctx, 'potted_plant', x + 3, y + 36);

  // Lounge armchair for visitors
  drawSprite(ctx, 'chair_grey', x + 56, y + 36);
}

// ── Cubicle Layout ────────────────────────────────────────
function drawCubicleRows(ctx, midX) {
  const leftX = Math.max(88, midX - 95);
  const rightX = midX + 17;

  // Left Column (Subagents)
  drawCubicleDesk(ctx, leftX, 132, 'flag_usa', 'id_card_red', 'coffee_mug', 'chair_purple');
  drawCubicleDesk(ctx, leftX, 162, null, 'paper_stack_white', 'tablet', 'chair_grey');
  drawCubicleDesk(ctx, leftX, 192, null, 'id_card_green', 'smartphone', 'chair_purple');

  // Right Column (Subagents)
  drawCubicleDesk(ctx, rightX, 132, 'flag_india', 'paper_stack_white', 'coffee_mug', 'chair_grey');
  drawCubicleDesk(ctx, rightX, 162, 'flag_uk', 'id_card_blue', 'tablet', 'chair_green');
  drawCubicleDesk(ctx, rightX, 192, null, 'paper_stack_red', 'potted_plant', 'chair_blue');

  // Bottom right printer station
  drawSprite(ctx, 'table_small_orange', rightX + 47, 198);
  drawSprite(ctx, 'printer_scanner', rightX + 60, 200);
}

function drawCubicleDesk(ctx, x, y, flagSprite, item1, item2, chairSprite) {
  const w = 78;
  const h = 28;

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x, y, w, 1);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(x, y + 6, w, h - 6);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y + 6, w, h - 6);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(x, y, 2, h);
  ctx.fillRect(x + w - 2, y, 2, h);
  ctx.fillRect(x + w / 2 - 1, y, 2, h);

  if (chairSprite) {
    drawSprite(ctx, chairSprite, x + 5, y + 6);
  }

  if (flagSprite) {
    drawSprite(ctx, flagSprite, x + 58, y + 2);
  }
  if (item1) {
    drawSprite(ctx, item1, x + 38, y + 10);
  }
  if (item2) {
    drawSprite(ctx, item2, x + 22, y + 8);
  }
}

// ── Render Agent Characters ───────────────────────────────
function renderAgentCharacters(ctx, characters, frameCount) {
  const sorted = Object.values(characters).sort((a, b) => a.y - b.y);

  sorted.forEach(char => {
    updateCharacterPosition(char);

    const spriteName = char.spriteName || 'character_dark_hair_boy';
    const img = sprites[spriteName];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const isWalking = char.state === 'walking';
    const isTalking = char.state === 'talking' || char.state === 'working';
    const facing = char.facing || 'down';

    const stepBob = isWalking ? Math.abs(Math.sin(frameCount * 0.4)) * 2 : 0;
    const idleBob = char.state === 'idle' ? Math.sin(frameCount * 0.05 + char.bobOffset) * 0.8 : 0;

    // Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(char.x, char.y + 1, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawX = Math.round(char.x - img.naturalWidth / 2);
    const drawY = Math.round(char.y - img.naturalHeight + 1 - stepBob + idleBob);

    drawSprite(ctx, spriteName, drawX, drawY, facing === 'left');

    if (isTalking) {
      ctx.fillStyle = char.color;
      const wave = (frameCount * 2) % 4;
      ctx.fillRect(char.x + 8, drawY + 2 - wave, 2, 2);
    }

    if (char.state === 'working') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(char.x + 8, drawY + Math.sin(frameCount * 0.15) * 2, 2, 2);
    }

    ctx.fillStyle = char.color;
    ctx.fillRect(char.x - 1, char.y, 2, 2);
  });
}
