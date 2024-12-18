<template>
  <div class="card overflow-hidden">
    <div 
      ref="containerRef"
      :class="[
        'relative group bg-black',
        isFullscreen ? 'h-screen flex flex-col' : ''
      ]"
    >
      <video
        ref="videoRef"
        :src="props.videoUrl"
        controls
        controlsList="nodownload nofullscreen"
        :class="[
          isFullscreen ? 'flex-1 h-[calc(100%-24px)]' : 'aspect-video',
          'w-full',
          isDrawMode ? 'pointer-events-none' : ''
        ]"
      />

      

      <canvas
        v-if="isDrawMode"
        ref="canvasRef"
        class="absolute inset-0 cursor-crosshair"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      />

      <div class="marker-overlay">
        <div 
          v-for="(marker, index) in markers"
          :key="index"
          class="marker"
          :style="{ left: `${(marker.timestamp / duration) * 100}%` }"
          @click="seekToTime(marker.timestamp)"
          :title="marker.name"
        >
          <div />
        </div>
      </div>

      <div v-if="isFullscreen" class="absolute top-4 right-4 flex gap-2">
        <button
          @click="toggleDrawMode"
          class="p-2 bg-blue-500 text-white rounded-lg"
          :title="isDrawMode ? 'Stop drawing' : 'Start drawing'"
        >
          <component :is="isDrawMode ? EraserIcon : PencilIcon" class="w-5 h-5" />
        </button>
        <button
          @click="handleFullscreen"
          class="p-2 bg-blue-500 text-white rounded-lg"
          title="Exit fullscreen"
        >
          <Minimize2Icon class="w-5 h-5" />
        </button>
      </div>

      <button
        v-else
        @click="handleFullscreen"
        class="absolute bottom-20 right-4 p-2 bg-blue-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title="Enter fullscreen"
      >
        <Maximize2Icon class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { PencilIcon, EraserIcon, Maximize2Icon, Minimize2Icon } from 'lucide-vue-next';

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isDrawMode = ref(false);
const isDrawing = ref(false);
const lastPoint = ref<{ x: number; y: number } | null>(null);
const isFullscreen = ref(false);
const props = defineProps<{
  videoUrl: string;
  initialMarkers?: { timestamp: number; date: string; name: string }[];
}>();

const duration = ref(0);
const markers = ref(props.initialMarkers || []);

// Ajustar el tamaño del canvas cuando cambia el modo de dibujo
watch(isDrawMode, (newValue) => {
  if (newValue && containerRef.value && canvasRef.value) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
});

const startDrawing = (e: MouseEvent) => {
  if (!isDrawMode.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  isDrawing.value = true;
  lastPoint.value = { x, y };
};

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !isDrawMode.value || !lastPoint.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.beginPath();
  ctx.strokeStyle = '#00ff00'; // Color verde como en React
  ctx.lineWidth = 3; // Mismo grosor que en React
  ctx.lineCap = 'round';
  ctx.moveTo(lastPoint.value.x, lastPoint.value.y);
  ctx.lineTo(x, y);
  ctx.stroke();

  lastPoint.value = { x, y };
};

const stopDrawing = () => {
  isDrawing.value = false;
  lastPoint.value = null;
};

const toggleDrawMode = () => {
  isDrawMode.value = !isDrawMode.value;
  if (!isDrawMode.value) {
    clearCanvas();
  }
};

const clearCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// Ajustar el tamaño del canvas cuando cambia el tamaño de la ventana
onMounted(() => {
  window.addEventListener('resize', () => {
    if (isDrawMode.value && containerRef.value && canvasRef.value) {
      const container = containerRef.value;
      const canvas = canvasRef.value;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  });

  if (videoRef.value) {
    videoRef.value.addEventListener('loadedmetadata', () => {
      duration.value = videoRef.value?.duration || 0;
    });
  }
});

const handleFullscreen = async () => {
  if (!containerRef.value) return;
  
  try {
    if (!document.fullscreenElement) {
      await containerRef.value.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
    }
  } catch (error) {
    console.error('Error toggling fullscreen:', error);
  }
};

const seekToTime = (timestamp: number) => {
  if (videoRef.value) {
    videoRef.value.currentTime = timestamp;
  }
};
</script>

<style scoped>
canvas {
  pointer-events: all;
}

.marker-overlay {
  position: absolute;
  bottom: 68px;
  left: 12px;
  right: 12px;
  height: 0;
  pointer-events: none;
}

.marker {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
  cursor: pointer;
  pointer-events: auto;
}

.marker div {
  width: 10px;
  height: 10px;
  border: 1.5px solid #ef4444;
  border-radius: 50%;
  background: transparent;
}

.marker:hover div {
  background: #ef4444;
  transition: background-color 0.2s;
}

/* Opcional: Si prefieres un tooltip personalizado en lugar del título nativo del navegador */
.marker:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}
</style>

<script lang="ts">
export default {
  name: 'VideoPlayer'
}
</script>