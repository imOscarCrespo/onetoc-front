import { ref, onUnmounted } from 'vue';

export function useMatchVideo(matchId: string) {
  const videoUrl = ref<string | null>(null);

  // Get stored video URL for this match
  const storedUrl = localStorage.getItem(`match-video-${matchId}`);
  if (storedUrl) {
    videoUrl.value = storedUrl;
  }

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    // Store the URL with the match ID
    localStorage.setItem(`match-video-${matchId}`, url);
    videoUrl.value = url;
  };

  const removeVideo = () => {
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value);
      localStorage.removeItem(`match-video-${matchId}`);
      videoUrl.value = null;
    }
  };

  // Cleanup URLs when component unmounts
  onUnmounted(() => {
    if (videoUrl.value && !localStorage.getItem(`match-video-${matchId}`)) {
      URL.revokeObjectURL(videoUrl.value);
    }
  });

  return {
    videoUrl,
    handleFileUpload,
    removeVideo
  };
}