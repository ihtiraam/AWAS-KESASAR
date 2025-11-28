<template>
  <div class="floorplan" ref="root">
    <div class="floor-info">Lantai 1</div>
    <div class="building-info">Gedung A</div>

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
      <image
        :href="mapImage"
        :width="baseWidth"
        :height="baseHeight"
        preserveAspectRatio="none"
      />

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
          stroke-width="1.4"
          rx="4"
          ry="4"
          style="cursor:pointer"
        />
      </g>

      <polyline
        v-if="routePoints.length"
        :points="routePointsString"
        fill="none"
        stroke="#1976d2"
        stroke-width="15"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import mapImage from "../assets/sujak_lantai1.png"
import { checkpoints_floor1 } from "../components/maps/sujak_lantai1"

const baseWidth = 3000
const baseHeight = 1200
const MIN_ZOOM = 1.0
const MAX_ZOOM = 5.0

const initialScale = 3
const view = reactive({
  scale: initialScale,
  x: (baseWidth - baseWidth / initialScale) / 2,
  y: (baseHeight - baseHeight / initialScale) / 2
})

const svgRoot = ref<SVGSVGElement | null>(null)
const sliderValue = ref(view.scale)
watch(() => view.scale, (n) => (sliderValue.value = n))

const checkpoints = reactive(checkpoints_floor1)

const viewBoxString = computed(
  () => `${view.x} ${view.y} ${baseWidth / view.scale} ${baseHeight / view.scale}`
)

let isPanning = false
let panStart = { x: 0, y: 0 }

function startPan(e: PointerEvent) {
  isPanning = true
  panStart = { x: e.clientX, y: e.clientY }
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
  view.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, f))
}

function onSliderZoom() {
  zoomTo(sliderValue.value)
}

function onWheel(e: WheelEvent) {
  zoomTo(view.scale * (1 - e.deltaY * 0.001))
}

interface Props {
  startId: string | null
  endId: string | null
}
const props = defineProps<Props>()

const locations = reactive([
  { id: "lobby", name: "Lobby" },
  { id: "poliklinik", name: "Poli Klinik" },
  { id: "depoFarmasi", name: "Depo Farmasi" },
  { id: "klinikanak", name: "Klinik Anak" },
])

const routePoints = computed(() => {
  const start = props.startId
  const end = props.endId
  if (!start || !end) return []

  if (start === "lobby" && end === "poliklinik") {
    return ["cp1","cp2","cp3","cp4"].map(id => checkpoints.find(c => c.id===id)!)
  }
  if (start === "lobby" && end === "depoFarmasi") {
    return ["cp1","cp2","cp5","cp6"].map(id => checkpoints.find(c => c.id===id)!)
  }
  if (start === "lobby" && end === "klinikanak") {
    return ["cp1","cp2","cp5","cp7"].map(id => checkpoints.find(c => c.id===id)!)
  }

  return []
})

const routePointsString = computed(() =>
  routePoints.value.map(p => `${p.x},${p.y}`).join(" ")
)

defineExpose({ locations })
</script>

<style scoped>
.floorplan {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  touch-action: none;
}

.svg-root {
  width: 100%;
  height: 100%;
  user-select: none;
}

.floor-info,
.building-info {
  position: absolute;
  top: 1px;
  padding: 9px 12px;
  background: #0bded7;
  color: white;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  z-index: 20;
  pointer-events: none;
  letter-spacing: 1px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.floor-info {
  left: 16px;
}

.building-info {
  right: 16px;
}

.zoom-slider {
  position: absolute;
  bottom: 18px;
  right: 16px;
  width: 150px;
  z-index: 25;
}

.zoom-slider input[type='range'] {
  width: 100%;
  cursor: pointer;
}
</style>
