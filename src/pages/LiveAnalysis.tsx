import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Plus, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useTimer } from '../hooks/useTimer';
import { actionTranslations } from '../translations/actions';
import { useMatchStats } from '../hooks/useMatchStats';
import toast from 'react-hot-toast';
import { useState } from 'react';
import Modal from '../components/Modal';

interface Match {
  id: number;
  name: string;
  team: number;
}

interface MatchInfo {
  id: number;
  match: number;
  yellow_card: number;
  yellow_card_opponent: number;
  red_card: number;
  red_card_opponent: number;
  goal: number;
  goal_opponent: number;
  substitution: number;
  substitution_opponent: number;
  corner: number;
  corner_opponent: number;
}

type Tab = 'analysis' | 'events';

export default function LiveAnalysis() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { time, isRunning, toggleTimer, resetTimer, formatTime } = useTimer(matchId || '');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [score, setScore] = useState({ home: '', away: '' });
  const selectedTeamName = localStorage.getItem('selectedTeamName') || 'Home Team';
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const { actions, events } = useMatchStats(matchId || '');

  const { data: match } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  const { data: matchInfo } = useQuery<MatchInfo>({
    queryKey: ['match-info', matchId],
    queryFn: async () => {
      const response = await api.get(`/matchInfo?match=${matchId}`);
      return response.data;
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login', { replace: true });
  };

  const updateMatchInfo = useMutation({
    mutationFn: async (key: string) => {
      if (!matchInfo) return;
      
      const propertyName = key as keyof MatchInfo;
      const currentValue = matchInfo[propertyName] as number;
      const newValue = currentValue + 1;
      
      return api.patch(`/matchInfo/${matchInfo.id}`, {
        [propertyName]: newValue
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-info', matchId] });
    }
  });

  const updateScore = useMutation({
    mutationFn: async ({ home, away }: { home: string; away: string }) => {
      if (!matchInfo) return;
      
      return api.patch(`/matchInfo/${matchInfo.id}`, {
        goal: parseInt(home) || 0,
        goal_opponent: parseInt(away) || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-info', matchId] });
      setIsScoreModalOpen(false);
      toast.success('Score updated successfully');
    },
    onError: () => {
      toast.error('Failed to update score');
    }
  });

  const createEvent = useMutation({
    mutationFn: async (actionKey: string) => {
      const selectedAction = actions?.find(action => action.key === actionKey);
      if (!selectedAction) {
        console.error('Action not found:', actionKey);
        throw new Error(`Action not found: ${actionKey}`);
      }
      const eventResponse = await api.post('/event', {
        match: Number(matchId),
        action: selectedAction.id,
        start: time,
        delay_start: 7,
        type: actionKey
      });

      if (actionKey !== 'automatic') {
        await updateMatchInfo.mutateAsync(actionKey);
      }

      return eventResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      toast.success('Event recorded');
    },
    onError: (error) => {
      console.error('Event creation error:', error);
      toast.error('Failed to record event');
    }
  });

  const sortedEvents = events?.slice().sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) || [];

  const renderTeamStats = (isHome: boolean) => (
    <div className="flex items-center justify-center gap-1 xs:gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
      <div className="flex items-center gap-0.5 xs:gap-1">
        <span className="text-sm sm:text-base lg:text-lg">🟨</span>
        <span className="font-medium">
          {isHome ? matchInfo?.yellow_card : matchInfo?.yellow_card_opponent}
        </span>
      </div>
      <div className="flex items-center gap-0.5 xs:gap-1">
        <span className="text-sm sm:text-base lg:text-lg">🟥</span>
        <span className="font-medium">
          {isHome ? matchInfo?.red_card : matchInfo?.red_card_opponent}
        </span>
      </div>
      <div className="flex items-center gap-0.5 xs:gap-1">
        <span className="text-sm sm:text-base lg:text-lg">⛳</span>
        <span className="font-medium">
          {isHome ? matchInfo?.corner : matchInfo?.corner_opponent}
        </span>
      </div>
      <div className="flex items-center gap-0.5 xs:gap-1">
        <span className="text-sm sm:text-base lg:text-lg">🔄</span>
        <span className="font-medium">
          {isHome ? matchInfo?.substitution : matchInfo?.substitution_opponent}
        </span>
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
      {/* Score Display */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="text-center flex-1">
          <p className="text-xs sm:text-sm font-medium mb-1 truncate px-2">{selectedTeamName}</p>
          <p className="text-3xl sm:text-4xl font-bold mb-2">{matchInfo?.goal || 0}</p>
          {renderTeamStats(true)}
        </div>
        <div className="px-2 sm:px-4">
          <button
            onClick={() => {
              setScore({
                home: String(matchInfo?.goal || ''),
                away: String(matchInfo?.goal_opponent || '')
              });
              setIsScoreModalOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Edit score"
          >
            <Edit2 className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs sm:text-sm font-medium mb-1 truncate px-2">{match?.name}</p>
          <p className="text-3xl sm:text-4xl font-bold mb-2">{matchInfo?.goal_opponent || 0}</p>
          {renderTeamStats(false)}
        </div>
      </div>

      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-6xl font-mono font-bold mb-4 sm:mb-6">
          {formatTime(time)}
        </div>
        <div className="flex justify-center gap-3 sm:gap-4">
          <button
            onClick={toggleTimer}
            className="btn flex items-center gap-2 px-4 sm:px-6 py-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="sm:inline">Start</span>
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="btn bg-gray-500 hover:bg-gray-600 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sm:inline">Reset</span>
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Generic Event Button */}
        <button
          onClick={() => createEvent.mutate('automatic')}
          disabled={createEvent.isPending}
          className="w-full btn bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="flex items-center gap-2">
            Record Event {actionTranslations['automatic'].emoji}
          </span>
        </button>

        {/* Events Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-center mb-2">{selectedTeamName} 🏠</p>
            {['substitution', 'yellow_card', 'red_card', 'goal', 'corner'].map(key => (
              <button
                key={key}
                onClick={() => createEvent.mutate(key)}
                disabled={createEvent.isPending}
                className={`w-full btn text-sm sm:text-base py-2 sm:py-3 ${
                  key === 'substitution' ? 'bg-purple-500 hover:bg-purple-600' :
                  key === 'yellow_card' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  key === 'red_card' ? 'bg-red-500 hover:bg-red-600' :
                  key === 'goal' ? 'bg-green-500 hover:bg-green-600' :
                  'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {actionTranslations[key]?.name} {actionTranslations[key]?.emoji}
              </button>
            ))}
          </div>
          
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-center mb-2">{match?.name} 🚌</p>
            {['substitution_opponent', 'yellow_card_opponent', 'red_card_opponent', 'goal_opponent', 'corner_opponent'].map(key => (
              <button
                key={key}
                onClick={() => createEvent.mutate(key)}
                disabled={createEvent.isPending}
                className={`w-full btn text-sm sm:text-base py-2 sm:py-3 ${
                  key === 'substitution_opponent' ? 'bg-purple-500 hover:bg-purple-600' :
                  key === 'yellow_card_opponent' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  key === 'red_card_opponent' ? 'bg-red-500 hover:bg-red-600' :
                  key === 'goal_opponent' ? 'bg-green-500 hover:bg-green-600' :
                  'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {actionTranslations[key]?.shortName || actionTranslations[key]?.name} {actionTranslations[key]?.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
      <div className="space-y-3">
        {sortedEvents.map((event) => {
          const action = actions?.find(a => a.id === event.action);
          const translation = action ? actionTranslations[action.key] : null;
          
          return (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono">{formatTime(event.start-event.delay_start)}</span>
                {translation && (
                  <span>{translation.name}</span>
                )}
              </div>
              <span className="text-xs sm:text-sm text-gray-500">
                {new Date(event.created_at).toLocaleTimeString()}
              </span>
            </div>
          );
        })}

        {!events?.length && (
          <p className="text-center text-gray-500 py-4">
            No events recorded yet
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="max-w-lg mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Events ({sortedEvents.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'analysis' ? renderAnalysisTab() : renderEventsTab()}
        </div>
      </div>

      <Modal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title="Edit Score"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          updateScore.mutate(score);
        }}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedTeamName}
              </label>
              <input
                type="number"
                min="0"
                value={score.home}
                onChange={(e) => setScore(prev => ({ ...prev, home: e.target.value }))}
                className="input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {match?.name}
              </label>
              <input
                type="number"
                min="0"
                value={score.away}
                onChange={(e) => setScore(prev => ({ ...prev, away: e.target.value }))}
                className="input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsScoreModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={updateScore.isPending}
            >
              {updateScore.isPending ? 'Updating...' : 'Update Score'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}