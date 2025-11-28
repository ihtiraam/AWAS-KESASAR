<template>
  <div class="floorplan" ref="root">
    <!-- Info Lantai & Gedung -->
    <div class="floor-info">Lantai 1</div>
    <div class="building-info">Gedung A</div>

    <!-- Slider Zoom -->
    <div class="zoom-slider">
      <input
        type="range"
        :min="MIN_ZOOM"
        :max="MAX_ZOOM"
        :step="0.01"
        v-model.number="sliderValue"
        @input="onSliderZoom"
      />
    </div>

    <!-- SVG Floorplan -->
    <svg
      ref="svgRoot"
      preserveAspectRatio="xMidYMid meet"
      :viewBox="viewBoxString"
      xmlns="http://www.w3.org/2000/svg"
      @pointerdown="startPan"
      @pointermove="onPan"
      @pointerup="endPan"
      @pointerleave="endPan"
      @wheel.prevent="onWheel"
      class="svg-root"
    >
      <!-- Definisi Pattern & Shadow -->
      <defs>
        <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L0 0 0 20" fill="none" stroke="#eee" stroke-width="0.5"/>
        </pattern>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Latar Grid -->
      <rect :width="baseWidth" :height="baseHeight" fill="url(#smallGrid)" />

      <!-- Area -->
      <g id="areas">
        <g v-for="area in areas" :key="area.id">
          <rect
            :x="area.x"
            :y="area.y"
            :width="area.w"
            :height="area.h"
            :rx="4"
            :ry="4"
            :fill="area.fill"
            :stroke="selectedId === area.id ? '#0b74de' : '#bdbdbd'"
            :stroke-width="selectedId === area.id ? 2.4 : 1"
            style="cursor:pointer"
            @pointerdown.stop="showInfo(area)"
            @pointerup.stop="hideInfo"
            @pointerleave.stop="hideInfo"
          />
          <!-- Label Tengah Kotak -->
          <text
            v-if="area.showLabel"
            :x="area.x + area.w / 2"
            :y="area.y + area.h / 2"
            font-size="12"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ area.label }}
          </text>
        </g>
      </g>

      <!-- Koridor -->
      <g id="corridors">
        <rect
          v-for="c in corridors"
          :key="c.id"
          :x="c.x"
          :y="c.y"
          :width="c.w"
          :height="c.h"
          :fill="c.fill"
          stroke="#ddd"
        />
      </g>

      <!-- Checkpoints -->
      <g id="checkpoints">
        <rect
          v-for="cp in checkpoints"
          :key="cp.id"
          :x="cp.x"
          :y="cp.y"
          :width="cp.w"
          :height="cp.h"
          :fill="cp.fill"
          stroke="#1976d2"
          stroke-width="1.5"
          rx="3"
          ry="3"
        />
      </g>

      <!-- Route dan Panah -->
      <g v-if="routePath" id="route-layer">
        <path
          :d="routePath"
          stroke="#1976d2"
          stroke-width="6"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.95"
        />
        <path v-if="arrowPath" :d="arrowPath" fill="#1976d2" />
      </g>

      <!-- Tooltip -->
      <g v-if="tooltip.visible" class="tooltip-group">
        <rect
          :x="tooltip.x"
          :y="tooltip.y - 70"
          width="160"
          height="50"
          rx="8"
          ry="8"
          fill="white"
          stroke="#1976d2"
          stroke-width="1.5"
          filter="url(#shadow)"
        />
        <polygon
          :points="`${tooltip.x + 75},${tooltip.y - 20} ${tooltip.x + 85},${tooltip.y - 20} ${tooltip.x + 80},${tooltip.y}`"
          fill="white"
          stroke="#1976d2"
          stroke-width="1"
        />
        <text :x="tooltip.x + 8" :y="tooltip.y - 50" font-size="13" fill="#000" font-weight="600">
          {{ tooltip.name }}
        </text>
        <text :x="tooltip.x + 8" :y="tooltip.y - 34" font-size="12" fill="#555">
          {{ tooltip.type.toUpperCase() }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineProps, defineEmits } from 'vue'
import type { Area } from "../types/Area"
import { checkpoints_floor1 } from "../components/maps/sujak_lantai1"

const props = defineProps<{
  areas: Area[]
  corridors: Array<{ id: string; x: number; y: number; w: number; h: number; fill: string }>
  startId?: string | null
  endId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select-area', area: { id: string; name: string; type: string }): void
}>()

const baseWidth = 2000
const baseHeight = 1200
const MIN_ZOOM = 1.0
const MAX_ZOOM = 5.0

const selectedId = ref<string | null>(null)
const view = reactive({ x: 0, y: 0, scale: 1.5 })
const svgRoot = ref<SVGSVGElement | null>(null)
const sliderValue = ref(view.scale)

watch(() => view.scale, (n) => (sliderValue.value = n))

const viewBoxString = computed(
  () => `${view.x} ${view.y} ${baseWidth / view.scale} ${baseHeight / view.scale}`
)

const tooltip = reactive({
  visible: false,
  name: '',
  type: '',
  x: 0,
  y: 0
})

function showInfo(area: Area) {
  selectedId.value = area.id
  tooltip.name = area.name
  tooltip.type = area.type
  tooltip.x = area.x + area.w / 2 - 80
  tooltip.y = area.y
  tooltip.visible = true
  emit('select-area', { id: area.id, name: area.name, type: area.type })
}

function hideInfo() {
  selectedId.value = null
  tooltip.visible = false
}

// Checkpoints
const checkpoints = reactive(checkpoints_floor1)

const routePath = ref<string | null>(null)
const arrowPath = ref<string | null>(null)

watch(() => [props.startId, props.endId], () => computeRoute())

function computeRoute() {
  routePath.value = null
  arrowPath.value = null
  if (!props.startId || !props.endId) return

  const start = props.areas.find((a) => a.id === props.startId)
  const end = props.areas.find((a) => a.id === props.endId)
  if (!start || !end) return

  const sx = start.x + start.w / 2
  const sy = start.y + start.h / 2
  const ex = end.x + end.w / 2
  const ey = end.y + end.h / 2

  const midX = ex
  const midY = sy

  routePath.value = `M ${sx} ${sy} L ${midX} ${midY} L ${ex} ${ey}`

  const dx = ex - midX
  const dy = ey - midY
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len
  const uy = dy / len
  const arrowSize = 10

  const bx = ex - ux * (arrowSize + 4)
  const by = ey - uy * (arrowSize + 4)
  const px = -uy
  const py = ux

  arrowPath.value = `M ${ex} ${ey} L ${bx + px * (arrowSize / 2)} ${
    by + py * (arrowSize / 2)
  } L ${bx - px * (arrowSize / 2)} ${by - py * (arrowSize / 2)} Z`
}

let isPanning = false
let panStart = { x: 0, y: 0 }

function startPan(e: PointerEvent) {
  isPanning = true
  panStart = { x: e.clientX, y: e.clientY }
  tooltip.visible = false
}

function onPan(e: PointerEvent) {
  if (!isPanning) return
  view.x -= (e.clientX - panStart.x) / view.scale
  view.y -= (e.clientY - panStart.y) / view.scale
  panStart = { x: e.clientX, y: e.clientY }
}

function endPan() {
  isPanning = false
}

function zoomTo(f: number) {
  if (!svgRoot.value) return
  view.scale = f
}

function onSliderZoom() {
  zoomTo(sliderValue.value)
}

function onWheel(e: WheelEvent) {
  const delta = -e.deltaY * 0.001
  view.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.scale * (1 + delta)))
}
</script>

<style scoped>
.floorplan {
  width: 100%;
  height: 100%;
  position: relative;
  touch-action: none;
}

.svg-root {
  width: 100%;
  height: 100%;
  user-select: none;
}

.floor-info {
  position: absolute;
  top: 1px;
  left: 16px;
  padding: 9px 12px;
  background: #0bded7;
  color: white;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 15;
  letter-spacing: 1px;
}

.building-info {
  position: absolute;
  top: 1px;
  right: 16px;
  padding: 9px 12px;
  background: #0bded7;
  color: white;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 15;
  letter-spacing: 1px;
}

.zoom-slider {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 150px;
  z-index: 15;
}

.zoom-slider input[type='range'] {
  width: 100%;
  cursor: pointer;
}

#route-layer {
  pointer-events: none;
}
</style>
