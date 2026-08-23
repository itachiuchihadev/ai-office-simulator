// js/office/rooms.js — Office locations, character homes, break areas, file storage & navigation waypoints

import { state } from '../config.js';

export function getOfficeLocations() {
  const W = state.canvasW || 256;
  const midX = Math.round(W / 2);
  const leftX = Math.max(88, midX - 95);
  const rightX = midX + 17;

  // Manager Private Office located in bottom-left corner
  const managerOffice = {
    x: 40,
    y: 186,
    doorX: 82,
    doorY: 180,
    label: "Manager's Private Suite"
  };

  return {
    CHARACTER_HOMES: {
      'manager':    { x: managerOffice.x, y: managerOffice.y, label: managerOffice.label },
      'researcher': { x: leftX + 15, y: 148, label: 'Research Desk' },
      'coder':      { x: leftX + 15, y: 178, label: 'Code Desk' },
      'writer':     { x: rightX + 50, y: 148, label: 'Docs Desk' },
      'analyst':    { x: rightX + 50, y: 178, label: 'Analytics Desk' },
      'designer':   { x: leftX + 15, y: 208, label: 'Design Desk' },
    },
    MANAGER_OFFICE: managerOffice,
    AISLE_X: midX,
    FILE_CABINET:    { x: W - 25, y: 114, label: 'File Archive' },
    PRINTER_STATION: { x: rightX + 60, y: 208, label: 'Printer & Scanner' },
    COFFEE_BAR:      { x: 44,  y: 114, label: 'Coffee & Drinks' },
    VENDING_MACHINE: { x: 18,  y: 114, label: 'Snack Vending' },
    LOUNGE_SOFA:     { x: Math.min(W - 70, midX + 60), y: 114, label: 'Lounge Sofa' },
    PET_AREA:        { x: midX - 16, y: 208, label: 'Office Pets' },
    MEETING_CENTER:  { x: midX, y: 165, label: 'Central Collaboration Area' },
    DOOR_ENTRANCE:   { x: midX, y: 114, label: 'Office Main Entrance' },
  };
}

// Backwards compatibility
export const CHARACTER_HOMES = {
  'manager':    { x: 40,  y: 186, label: "Manager's Suite" },
  'researcher': { x: 105, y: 148, label: 'Research Desk' },
  'coder':      { x: 105, y: 178, label: 'Code Desk' },
  'writer':     { x: 195, y: 148, label: 'Docs Desk' },
  'analyst':    { x: 195, y: 178, label: 'Analytics Desk' },
  'designer':   { x: 105, y: 208, label: 'Design Desk' },
};

export const DESK_POSITIONS = CHARACTER_HOMES;
export const ROOMS = [];
export const OFFICE_LOCATIONS = {
  FILE_CABINET:    { x: 232, y: 114, label: 'File Archive' },
  PRINTER_STATION: { x: 195, y: 208, label: 'Printer & Scanner' },
  COFFEE_BAR:      { x: 46,  y: 114, label: 'Coffee & Drinks' },
  VENDING_MACHINE: { x: 18,  y: 114, label: 'Snack Vending' },
  LOUNGE_SOFA:     { x: 195, y: 114, label: 'Lounge Sofa' },
  PET_AREA:        { x: 112, y: 208, label: 'Office Pets' },
  MEETING_CENTER:  { x: 128, y: 165, label: 'Central Collaboration Area' },
  DOOR_ENTRANCE:   { x: 128, y: 114, label: 'Office Main Entrance' },
};
export const STORAGE_ENTRANCE = OFFICE_LOCATIONS.FILE_CABINET;
export const CORRIDOR_Y = 114;
export const AISLE_X = 128;
