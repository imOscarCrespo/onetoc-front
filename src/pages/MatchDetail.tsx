import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import toast from 'react-hot-toast';
import { useMatchVideo } from '../hooks/useMatchVideo';
import { useMatchActions } from '../hooks/useMatchActions';
import VideoPlayer from '../components/VideoPlayer';
import { ChevronDown, ChevronUp, Save, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTimer } from '../hooks/useTimer';

interface Match {
  id: number;
  name: string;
  timeline: any;
  team: number;
  media: string | null;
  status: string;
  tab: number;
  created_at: string;
  started_at: string;
  finished_at: string;
  mode: string;
  second_media: string | null;
}

export default function MatchDetail() {
  const { matchId } = useParams();
  const { videoUrl, handleFileUpload, removeVideo } = useMatchVideo(matchId || '');
  const { actions, events, isLoading: isLoadingActions, createEvent } = useMatchActions(matchId || '');
  const [showEvents, setShowEvents] = useState(true);
  const [delayAdjustment, setDelayAdjustment] = useState('');
  const [individualDelays, setIndividualDelays] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const [activeHalf, setActiveHalf] = useState<'first' | 'second'>('first');

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  const { formatTime } = useTimer(matchId || '');

  const adjustEventDelays = useMutation({
    mutationFn: async (adjustment: number) => {
      if (!events?.length) return;
      const eventIds = events.map(event => event.id);
      
      await api.patch('/event', {
        ids: eventIds,
        update: {
          delay_start: adjustment
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      toast.success('Event times adjusted successfully');
      setDelayAdjustment('');
    },
    onError: () => {
      toast.error('Failed to adjust event times');
    }
  });

  const adjustIndividualDelay = useMutation({
    mutationFn: async ({ eventId, adjustment }: { eventId: number; adjustment: number }) => {
      const event = events?.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');
      await api.patch(`/event/${eventId}/`, {
        delay_start: event.delay_start + adjustment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      toast.success('Event time updated');
      setIndividualDelays({});
    },
    onError: () => {
      toast.error('Failed to update event time');
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: number) => {
      await api.patch(`/event/${eventId}/`, {
        status: 'DELETED'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      toast.success('Event hidden successfully');
    },
    onError: () => {
      toast.error('Failed to hide event');
    }
  });

  const handleDelayAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const adjustment = parseInt(delayAdjustment);
    if (isNaN(adjustment)) {
      toast.error('Please enter a valid number');
      return;
    }

    // Para el ajuste múltiple, calculamos el nuevo delay para cada evento
    const baseEvent = events?.[0];
    if (!baseEvent) return;

    const newDelay = Math.max(0, baseEvent.delay_start + adjustment);
    adjustEventDelays.mutate(newDelay);
  };

  const handleIndividualDelay = (eventId: number) => {
    const adjustment = individualDelays[eventId];
    if (!adjustment) return;

    const parsedAdjustment = parseInt(adjustment);
    if (isNaN(parsedAdjustment)) {
      toast.error('Please enter a valid number');
      return;
    }

    adjustIndividualDelay.mutate({ eventId, adjustment: parsedAdjustment });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
      toast.success('Match footage loaded successfully');
    }
  };

  const firstHalfEvent = events?.find(event => {
    const action = actions?.find(a => a.id === event.action);
    return action?.key === 'first_half';
  });

  const filteredEvents = events?.filter(event => {
    if (!firstHalfEvent) return true;
    
    if (activeHalf === 'first') {
      return new Date(event.created_at) < new Date(firstHalfEvent.created_at);
    } else {
      return new Date(event.created_at) >= new Date(firstHalfEvent.created_at);
    }
  });

  if (isLoading || isLoadingActions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black" />
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveHalf('first')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeHalf === 'first'
              ? 'bg-black text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          First Half
        </button>
        <button
          onClick={() => setActiveHalf('second')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeHalf === 'second'
              ? 'bg-black text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Second Half
        </button>
      </div>

      {!match?.media && !videoUrl && (
        <div className="border border-gray-200 rounded p-8 text-center mb-8">
          <h3 className="text-lg font-medium">Upload Match Footage</h3>
          <p className="text-sm text-gray-500 mt-2">Add video footage for detailed analysis</p>
          <div className="mt-6">
            <label htmlFor="file-upload" className="btn cursor-pointer">
              Select Video
              <input
                id="file-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>
      )}

      {(match?.media || videoUrl || match?.second_media) && (
        <div className="mb-8">
          <VideoPlayer 
            videoUrl={activeHalf === 'first' ? (match?.media || videoUrl || '') : (match?.second_media || '')}
            onFileChange={(file) => {
              handleFileUpload(file);
              toast.success('Match footage updated successfully');
            }}
            onRemove={() => {
              removeVideo();
              toast.success('Video removed successfully');
            }}
            showRemoveButton={!match?.media}
            onAddAction={async (timestamp) => {
              const result = await createEvent.mutateAsync(timestamp.toString());
              return result;
            }}
            initialMarkers={filteredEvents?.map(event => ({
              timestamp: event.start-event.delay_start,
              date: event.created_at
            })).sort((a, b) => 
              a.timestamp - b.timestamp
            ) || []}
          />
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleDelayAdjustment} className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjust All Event Times (seconds)
              </label>
              <input
                type="number"
                value={delayAdjustment}
                onChange={(e) => setDelayAdjustment(e.target.value)}
                className="input"
                placeholder="Enter adjustment (e.g., +20 or -10)"
              />
            </div>
            <button
              type="submit"
              disabled={!delayAdjustment || adjustEventDelays.isPending}
              className="btn"
            >
              {adjustEventDelays.isPending ? 'Adjusting...' : 'Apply to All'}
            </button>
          </form>
        </div>

        <button
          onClick={() => setShowEvents(!showEvents)}
          className="flex items-center gap-2 text-lg font-medium p-4 w-full hover:bg-gray-50 transition-colors"
        >
          {showEvents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          Events ({filteredEvents?.length || 0})
        </button>

        {showEvents && (
          <div className="border-t border-gray-200">
            {filteredEvents && filteredEvents.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-4 text-sm font-medium">Time</th>
                    <th className="text-left p-4 text-sm font-medium">Action</th>
                    <th className="text-left p-4 text-sm font-medium">Adjust Time</th>
                    <th className="text-left p-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => {
                    const action = actions?.find(a => a.id === event.action);
                    return (
                      <tr key={event.id} className="border-b border-gray-200 last:border-0">
                        <td className="p-4">
                        {formatTime(event.start - event.delay_start)}
                        </td>
                        <td className="p-4">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${action?.color}20`, 
                              color: action?.color 
                            }}
                          >
                            {action?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={individualDelays[event.id] || ''}
                              onChange={(e) => setIndividualDelays(prev => ({
                                ...prev,
                                [event.id]: e.target.value
                              }))}
                              placeholder="Enter adjustment (e.g., +20 or -10)"
                              className="input text-sm"
                            />
                            <button
                              onClick={() => handleIndividualDelay(event.id)}
                              disabled={!individualDelays[event.id]}
                              className="btn p-2"
                              title="Save time adjustment"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEvent.mutate(event.id)}
                              disabled={deleteEvent.isPending}
                              className="btn p-2 bg-red-50 hover:bg-red-100 text-red-600"
                              title="Hide event"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No events recorded yet
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}