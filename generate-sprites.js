// generate-sprites.js
const fs = require('fs');

// We generate SVG sprite sheets for 4-directional walk cycles (Down, Left, Right, Up)
// Each sheet is 64x64 (4 frames of 16x16: Idle, Walk 1, Walk 2, Walk 3) x 4 rows
// Then we draw them directly onto canvas with crisp pixel scaling

const AGENT_COLORS = {
  manager:    { shirt: '#4F6EF7', hair: '#1e1b4b', skin: '#fddcb5' },
  researcher: { shirt: '#7C5CFC', hair: '#4c1d95', skin: '#fddcb5' },
  coder:      { shirt: '#22C55E', hair: '#064e3b', skin: '#fddcb5' },
  writer:     { shirt: '#F59E0B', hair: '#78350f', skin: '#fddcb5' },
  analyst:    { shirt: '#EF4444', hair: '#881337', skin: '#fddcb5' },
  designer:   { shirt: '#EC4899', hair: '#831843', skin: '#fddcb5' },
};

console.log('Generating 4-directional walk cycle configurations...');
fs.writeFileSync('public/assets/agent-configs.json', JSON.stringify(AGENT_COLORS, null, 2));
