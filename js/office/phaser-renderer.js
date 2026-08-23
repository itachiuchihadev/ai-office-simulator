// js/office/phaser-renderer.js — Option B: Phaser 3 Renderer Engine

import Phaser from 'phaser';
import { AGENTS } from '../config.js';
import { ROOMS, DESK_POSITIONS, CHARACTER_HOMES } from './rooms.js';

let phaserGame = null;
let phaserScene = null;

class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
    this.agentSprites = {};
    this.bubbles = {};
  }

  preload() {
    this.load.image('char_gif', '/Idle_rotations_8dir.gif');
  }

  create() {
    phaserScene = this;
    const { width, height } = this.scale;

    // Draw Floor Grid
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1d2e, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.lineStyle(1, 0x25293e, 0.6);
    const tileSize = 25;
    for (let x = 0; x < width; x += tileSize) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += tileSize) {
      graphics.lineBetween(0, y, width, y);
    }

    // Main Corridor
    graphics.fillStyle(0x22263d, 0.8);
    graphics.fillRect(0, 195, width, 70);

    // Draw Rooms
    ROOMS.forEach(room => {
      // Room Wall Shadow
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRoundedRect(room.x + 3, room.y + 3, room.w, room.h, 6);

      // Room Floor
      const colorNum = parseInt(room.wallColor.replace('#', '0x'));
      graphics.fillStyle(0x1e2238, 1);
      graphics.fillRoundedRect(room.x, room.y, room.w, room.h, 6);
      graphics.lineStyle(3, colorNum, 1);
      graphics.strokeRoundedRect(room.x, room.y, room.w, room.h, 6);

      // Label
      this.add.text(room.x + room.w / 2, room.y + room.h + 10, room.label, {
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        fontStyle: 'bold',
        color: room.wallColor,
      }).setOrigin(0.5);

      // Door cutout indicator
      graphics.fillStyle(0x1a1d2e, 1);
      graphics.fillRect(room.x + room.w / 2 - 12, room.y + room.h - 2, 24, 4);
    });

    // Draw Desks
    Object.keys(DESK_POSITIONS).forEach(deskId => {
      const desk = DESK_POSITIONS[deskId];
      graphics.fillStyle(0x2d3248, 1);
      graphics.fillRoundedRect(desk.x, desk.y, desk.deskW, desk.deskH, 4);
      graphics.lineStyle(1, 0x3d4360, 1);
      graphics.strokeRoundedRect(desk.x, desk.y, desk.deskW, desk.deskH, 4);

      // Monitor
      const monX = desk.x + desk.deskW / 2;
      const monY = desk.y + 12;
      graphics.fillStyle(0x111625, 1);
      graphics.fillRect(monX - 12, monY - 6, 24, 12);
      graphics.fillStyle(0x4f6ef7, 1);
      graphics.fillRect(monX - 10, monY - 4, 20, 8);

      const agent = AGENTS.find(a => a.deskRoom === deskId);
      if (agent) {
        this.add.text(desk.x + desk.deskW / 2, desk.y + desk.deskH + 18, `${agent.emoji} ${agent.name}`, {
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontStyle: 'bold',
          color: agent.color,
          backgroundColor: '#11131f',
          padding: { x: 6, y: 3 }
        }).setOrigin(0.5);
      }
    });

    // Create Agent Game Objects (Phaser Containers)
    AGENTS.forEach(agent => {
      const home = CHARACTER_HOMES[agent.id];
      const container = this.add.container(home.x, home.y);

      // Shadow
      const shadow = this.add.ellipse(0, 12, 18, 6, 0x000000, 0.4);

      // Character GIF image sprite
      const gifImg = this.add.image(0, -10, 'char_gif').setDisplaySize(36, 36);

      // Color ring highlight under character
      const ring = this.add.circle(0, 10, 10);
      ring.setStrokeStyle(2, parseInt(agent.color.replace('#', '0x')));

      // Emoji Badge / Hair
      const badge = this.add.text(0, -28, agent.emoji, { fontSize: '14px' }).setOrigin(0.5);

      container.add([shadow, ring, gifImg, badge]);
      this.agentSprites[agent.id] = container;

      // Gentle floating animation
      this.tweens.add({
        targets: container,
        y: home.y - 2,
        duration: 1200 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  moveAgent(agentId, targetX, targetY, duration = 1500, onComplete = null) {
    const sprite = this.agentSprites[agentId];
    if (!sprite) return;

    this.tweens.add({
      targets: sprite,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }

  showBubble(agentId, text) {
    const sprite = this.agentSprites[agentId];
    if (!sprite) return;

    if (this.bubbles[agentId]) {
      this.bubbles[agentId].destroy();
    }

    const bubbleContainer = this.add.container(sprite.x, sprite.y - 45);
    const bubbleText = this.add.text(0, 0, text, {
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      color: '#ffffff',
      backgroundColor: '#2563eb',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    bubbleContainer.add(bubbleText);
    this.bubbles[agentId] = bubbleContainer;

    this.time.delayedCall(3000, () => {
      if (this.bubbles[agentId]) {
        this.bubbles[agentId].destroy();
        delete this.bubbles[agentId];
      }
    });
  }
}

export function initPhaserEngine(containerId) {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
  }

  const wrapper = document.getElementById(containerId);

  const config = {
    type: Phaser.AUTO,
    parent: containerId,
    width: 800,
    height: 500,
    backgroundColor: '#1a1d2e',
    scene: OfficeScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  phaserGame = new Phaser.Game(config);
  return phaserGame;
}

export function destroyPhaserEngine() {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
    phaserScene = null;
  }
}

export { phaserScene };
