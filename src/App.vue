<template>
  <div class="app">

    <header class="header">
      <h1>AWAS KESASAR</h1>
    </header>

    <div class="search-row"> 
      <div class="search-box has-options">
        <i class="bi bi-geo-alt search-icon"></i>
        <input
          type="search"
          v-model="fromText"
          @input="onFromInput"
          @focus="showFromSuggestions = true"
          @blur="hideFromSuggestionsDelayed"
          placeholder="Pilih lokasi awal"
        />

        <button class="options-btn" @click="toggleRouteMode">⋮</button>

        <ul v-if="showRouteMode" class="route-mode-dropdown">
          <li @mousedown.prevent="setRouteMode('cepat')">Rute Tercepat</li>
          <li @mousedown.prevent="setRouteMode('biasa')">Rute Biasa</li>
        </ul>

        <ul v-if="showFromSuggestions && filteredFrom.length" class="suggestions">
          <li v-for="a in filteredFrom" :key="a.id" @mousedown.prevent="chooseFrom(a)">
            {{ a.name }}
          </li>
        </ul>
      </div>

      <transition name="slideDown">
        <div class="search-box has-swap" v-if="startId">
          <i class="bi bi-geo-alt-fill search-icon search-icon-to"></i>
          <input
            type="search"
            v-model="toText"
            ref="toInputRef"
            @input="onToInput"
            @focus="showToSuggestions = true"
            @blur="hideToSuggestionsDelayed"
            placeholder="Pilih lokasi tujuan"
          />

          <button
            v-if="startId && endId"
            class="swap-inside"
            @click="swapRoute"
          >
            ⇅
          </button>

          <ul v-if="showToSuggestions && filteredTo.length" class="suggestions">
            <li v-for="a in filteredTo" :key="a.id" @mousedown.prevent="chooseTo(a)">
              {{ a.name }}
            </li>
          </ul>
        </div>
      </transition>
    </div>

    <main class="main">
      <div class="floor-container">
        <FloorPlan
          ref="floorPlanRef"
          :start-id="startId"
          :end-id="endId"
        />
      </div>
    </main>

    <footer class="footer">
      <button class="start-btn" :disabled="!startId || !endId" @click="onStartNavigation">
        Mulai Navigasi
      </button>

      <h2 class="nav-title">MODE NAVIGASI</h2>

      <div class="route-modes">
        <button
          class="route-mode-btn"
          :class="{ active: selectedRouteMode === 'avoidStairs' }"
          @click="setNavMode('avoidStairs')"
        >
          Hindari Tangga
        </button>

        <button
          class="route-mode-btn"
          :class="{ active: selectedRouteMode === 'avoidElevator' }"
          @click="setNavMode('avoidElevator')"
        >
          Hindari Lift
        </button>
      </div>
    </footer>

    <div v-if="showPopup" class="popup-overlay" @click.self="closePopup">
      <div class="popup-box">
        <p class="popup-title">🚶 Navigasi Dimulai</p>
        <p>{{ popupMessage }}</p>
        <p class="note">Silahkan menekan tombol checkpoint setiap melewati belokan.</p>
        <button @click="closePopup" class="popup-btn">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import FloorPlan from './components/FloorPlan.vue'
import 'bootstrap-icons/font/bootstrap-icons.css'


const floorPlanRef = ref<InstanceType<typeof FloorPlan> | null>(null)

const startId = ref<string | null>(null)
const endId = ref<string | null>(null)

const fromText = ref('')
const toText = ref('')
const toInputRef = ref<HTMLInputElement | null>(null)

const showFromSuggestions = ref(false)
const showToSuggestions = ref(false)
let hideFromTimeout: number | undefined
let hideToTimeout: number | undefined

const showPopup = ref(false)
const popupMessage = ref("")

const showRouteMode = ref(false)
const routeMode = ref<'biasa' | 'cepat'>('biasa')
const selectedRouteMode = ref<'normal' | 'avoidStairs' | 'avoidElevator'>('normal')

const allLocations = ref<{ id: string, name: string }[]>([])
nextTick(() => {
  if (floorPlanRef.value) {
    allLocations.value = floorPlanRef.value.locations
  }
})

const filteredFrom = computed(() =>
  allLocations.value.filter(a => a.name.toLowerCase().includes(fromText.value.toLowerCase()))
)

const filteredTo = computed(() =>
  allLocations.value.filter(a => a.name.toLowerCase().includes(toText.value.toLowerCase()))
)

function onFromInput() {
  showFromSuggestions.value = true
  startId.value = null
  endId.value = null
  toText.value = ''
}

function onToInput() {
  showToSuggestions.value = true
  endId.value = null
}

function hideFromSuggestionsDelayed() {
  hideFromTimeout = window.setTimeout(() => (showFromSuggestions.value = false), 150)
}

function hideToSuggestionsDelayed() {
  hideToTimeout = window.setTimeout(() => (showToSuggestions.value = false), 150)
}

function chooseFrom(a: { id: string, name: string }) {
  fromText.value = a.name
  startId.value = a.id
  toText.value = ''
  endId.value = null
  nextTick(() => toInputRef.value?.focus())
  showFromSuggestions.value = false
  if (hideFromTimeout) clearTimeout(hideFromTimeout)
}

function chooseTo(a: { id: string, name: string }) {
  toText.value = a.name
  endId.value = a.id
  showToSuggestions.value = false
  if (hideToTimeout) clearTimeout(hideToTimeout)
}

function swapRoute() {
  const id = startId.value
  const txt = fromText.value
  startId.value = endId.value
  endId.value = id
  fromText.value = toText.value
  toText.value = txt
}

function toggleRouteMode() {
  showRouteMode.value = !showRouteMode.value
}

function setRouteMode(mode: 'biasa' | 'cepat') {
  routeMode.value = mode
  showRouteMode.value = false
  console.log("Mode rute:", mode)
}

function setNavMode(mode: 'normal' | 'avoidStairs' | 'avoidElevator') {
  if (selectedRouteMode.value === mode) selectedRouteMode.value = 'normal'
  else selectedRouteMode.value = mode
  console.log("Mode navigasi:", selectedRouteMode.value)
}

function onStartNavigation() {
  if (!startId.value || !endId.value) return
  popupMessage.value = `Menavigasi ${fromText.value} ke ${toText.value} (${routeMode.value})`
  showPopup.value = true
}

function closePopup() {
  showPopup.value = false
}
</script>

<style scoped>
:global(body, html) {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  background: #f5f7f9;
  overflow: hidden;
}
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}
.header {
  background: linear-gradient(135deg, #19c0d2, #0fa7bd);
  color: white;
  text-align: center;
  padding: 14px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}
.header h1 {
  margin: 0;
  font-size: 18px;
}
.search-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px;
  background: #aff7da;
}
.search-box {
  position: relative;
  width: 100%;
}
.search-box input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border-radius: 14px;
  border: 2px solid transparent;
  background: #ffffff;
  transition: 0.25s;
  font-weight: 500;
}
.search-box input::placeholder {
  color: #9aa7b3;
}
.search-box input:focus {
  outline: none;
  border-color: #19c0d2;
}
.search-box .search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  color: #19c0d2;
  pointer-events: none;
}
.search-box.has-swap .search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  color: #0fa7bd;
  pointer-events: none;
}
.has-options input {
  padding-left: 40px !important; 
  padding-right: 40px !important; 
}
.has-swap input {
  padding-left: 40px !important; 
  padding-right: 40px !important; 
}
.suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 14px;
  z-index: 150;
  max-height: 230px;
  overflow-y: auto;
  box-shadow: 0 12px 28px rgba(0,0,0,0.15);
  animation: smoothDrop 0.2s ease;
}
@keyframes smoothDrop {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
.suggestions li {
  padding: 15px 20px;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}
.suggestions li:hover {
  background: #e8fbff;
  transform: translateX(4px);
}
.options-btn,
.swap-inside {
  -webkit-tap-highlight-color: transparent;
  outline: none;
}
.options-btn:focus,
.swap-inside:focus {
  outline: none;
  box-shadow: none;
}
.options-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 35px;
  height: 35px;
  border: none;
  background: transparent;
  color: #19c0d2;
  font-size: 27px;
  cursor: pointer;
  transition: 0.2s;
}
.options-btn:active {
  transform: translateY(-50%) scale(0.92);
}
.route-mode-dropdown {
  list-style: none;
  padding: 0;
  margin: 0;
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: #fff;
  border-radius: 12px;
  min-width: 150px;
  z-index: 200;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
.route-mode-dropdown li {
  padding: 12px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}
.route-mode-dropdown li:hover {
  background: #f0f8ff;
}
.route-mode-dropdown li:first-child {
  border-bottom: 1px solid #e0e0e0;
}
.has-swap { position: relative; }
.has-swap input { padding-right: 40px !important; }
.swap-inside {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 35px;
  height: 35px;
  border: none;
  background: transparent;
  color: #19c0d2;
  font-size: 27px;
  cursor: pointer;
  transition: 0.2s;
}
.swap-inside:active {
  transform: translateY(-50%) scale(0.92);
}
.main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #aff7da;
}
.floor-container {
  width: 100%;
  height: 60vh;
  border-radius: 14px;
  overflow: hidden;
}
.footer {
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 15vh;
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -3px 10px rgba(0,0,0,0.1);
}
.start-btn {
  width: 95%;
  padding: 13px;
  border-radius: 14px;
  font-size: 15px;
  background: linear-gradient(135deg,#19c0d2,#0fa7bd);
  border: none;
  font-weight: 600;
  color: white;
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
}
.start-btn:disabled {
  background: #cbeff4;
  color: #777;
  box-shadow: none;
}
.nav-title {
  margin: 10px 0 6px;
  font-size: 16.2px;
  font-weight: 700;
  color: #073f47;
  width: 100%;
  text-align: left;
  padding-left: 4px;
  letter-spacing: 0.3px;
}
.route-modes {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 4px 4px;
}
.route-mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  border-radius: 18px;
  border: 2px solid transparent;
  background: #cbeff4;
  cursor: pointer;
  transition: 0.25s;
  box-shadow: 0 4px 18px rgba(0,0,0,0.10);
  font-size: 13px;
  font-weight: 700;
  color: #255d66;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
.route-mode-btn .icon {
  font-size: 24px;
  transition: 0.25s;
  transform: translateY(-2px);
}
.route-mode-btn:focus,
.route-mode-btn:active {
  outline: none;
}
.route-mode-btn.active {
  border-color: #19c0d2;
  background: linear-gradient(135deg, #19c0d2, #0fa7bd);
  color: white;
}
.route-mode-btn.active .icon {
  transform: translateY(-3px) scale(1.15);
}
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(2px);
  z-index: 200;
}
.popup-box {
  width: 270px;
  padding: 18px;
  background: white;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  animation: popupAnim 0.25s ease-out;
}
@keyframes popupAnim {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
.popup-btn {
  width: 100%;
  padding: 11px;
  margin-top: 10px;
  border-radius: 14px;
  border: none;
  background: #19c0d2;
  font-weight: 600;
  color: white;
  transition: 0.25s;
}
.popup-btn:active {
  background: #0fa7bd;
  transform: scale(0.95);
}
</style>