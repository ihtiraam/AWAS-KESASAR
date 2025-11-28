import type { Area } from "../../types/Area"

export const corridors_floor1 = [
  { id: 'c1', x: 50, y: 400, w: 950, h: 60, fill: '#eeeeee' },
]

export const areas_floor1: Area[] = [
  { id: 'lobby', name: 'Lobby', label: 'LOBBY', type: 'lobby', x: 50, y: 460, w: 700, h: 300, fill: '#cfd8dc', showLabel: true },
  { id: 'Kasir', name: 'Kasir', label: 'KASIR', type: 'Kasir', x: 750, y: 460, w: 120, h: 150, fill: '#f8bbd0', showLabel: true },
  { id: 'depo1', name: 'Depo Rawat Jalan/Inap & Farmasi ', label: 'Depo Farnmasi', type: 'Depo', x: 870, y: 460, w: 220, h: 300, fill: '#bbdefb', showLabel: true },
  { id: 'Poli Klinik1', name: 'Poli Klinik Umum', label: 'POLI KLINIK UMUM', type: 'Poli Klinik', x: 50, y: 100, w: 950, h: 300, fill: '#ffe0b2', showLabel: true },
  { id: 'Klinik1', name: 'Klinik 1', label: 'KLINIK 1', type: 'Klinik', x: 50, y: 100, w: 100, h: 100, fill: '#c8e6c9', showLabel: true },
  { id: 'Klinik2', name: 'Klinik 2', label: 'KLINIK 2', type: 'Klinik', x: 150, y: 100, w: 100, h: 100, fill: '#c8e6c9', showLabel: true },
  { id: 'Klinik', name: 'Klinik', label: 'KLINIK', type: 'Klinik', x: 50, y: 300, w: 200, h: 100, fill: '#c8e6c9', showLabel: true },
]

export const checkpoints_floor1 = [
  { id: 'cp1', x: 300, y: 500, w: 20, h: 20, fill: '#ff5722' },
  { id: 'cp2', x: 300, y: 420, w: 20, h: 20, fill: '#ff5722' },
  { id: 'cp3', x: 900, y: 500, w: 20, h: 20, fill: '#ff5722' },
]
