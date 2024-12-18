import { ref, onMounted, onUnmounted, watch } from 'vue';

const TIMER_CHECK_INTERVAL = 100; // Check every 100ms for better accuracy

export function useTimer(matchId: string) {
  const getStoredState = () => {
    const stored = localStorage.getItem(`match-${matchId}-timer`);
    if (!stored) return null;
    return JSON.parse(stored);
  };

  const calculateCurrentTime = () => {
    const stored = getStoredState();
    if (!stored) return 0;

    const { time, lastUpdate, isRunning } = stored;
    if (!isRunning) return time;

    const elapsed = Math.floor((Date.now() - lastUpdate) / 1000);
    return time + elapsed;
  };

  const time = ref(calculateCurrentTime());
  const isRunning = ref(getStoredState()?.isRunning || false);

  const saveState = (newTime: number, running: boolean) => {
    localStorage.setItem(`match-${matchId}-timer`, JSON.stringify({
      time: newTime,
      isRunning: running,
      lastUpdate: Date.now()
    }));
  };

  let intervalId: ReturnType<typeof setInterval> | null = null;

  const syncTimer = () => {
    if (isRunning.value) {
      const currentTime = calculateCurrentTime();
      time.value = currentTime;
    }
  };

  onMounted(() => {
    syncTimer();
    intervalId = setInterval(syncTimer, TIMER_CHECK_INTERVAL);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  watch(isRunning, () => {
    syncTimer();
  });

  const toggleTimer = () => {
    const newIsRunning = !isRunning.value;
    const currentTime = calculateCurrentTime();
    
    isRunning.value = newIsRunning;
    time.value = currentTime;
    saveState(currentTime, newIsRunning);
  };

  const resetTimer = () => {
    isRunning.value = false;
    time.value = 0;
    saveState(0, false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    time,
    isRunning,
    toggleTimer,
    resetTimer,
    formatTime
  };
}