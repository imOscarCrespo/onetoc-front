import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import TeamSidebar from '../components/TeamSidebar';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface Player {
  id: number;
  name: string;
  number: string;
  position: string;
  total_minutes: number;
}

type ModalType = 'create' | 'edit' | 'delete';

export default function Players() {
  const { teamId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('create');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerData, setPlayerData] = useState({
    name: '',
    number: '',
    position: '',
    total_minutes: 0,
  });

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const response = await api.get(`/player?team=${teamId}`);
      return response.data;
    },
  });

  const createPlayer = useMutation({
    mutationFn: async (data: typeof playerData) => {
      return api.post('/player', {
        name: data.name,
        team: Number(teamId),
        position: data.position,
        number: Number(data.number)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Player added successfully');
    },
    onError: () => {
      toast.error('Failed to add player');
    }
  });

  const updatePlayer = useMutation({
    mutationFn: async (data: typeof playerData & { id: number }) => {
      return api.patch(`/player/${data.id}`, {
        name: data.name,
        position: data.position,
        number: Number(data.number),
        total_minutes: data.total_minutes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Player updated successfully');
    },
    onError: () => {
      toast.error('Failed to update player');
    }
  });

  const deletePlayer = useMutation({
    mutationFn: async (playerId: number) => {
      return api.delete(`/player/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
      setIsModalOpen(false);
      setSelectedPlayer(null);
      toast.success('Player deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete player');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerData.name && playerData.number && playerData.position) {
      if (modalType === 'create') {
        createPlayer.mutate(playerData);
      } else if (modalType === 'edit' && selectedPlayer) {
        const updatedTotalMinutes = (selectedPlayer.total_minutes || 0) + playerData.total_minutes;
        updatePlayer.mutate({ ...playerData, id: selectedPlayer.id, total_minutes: updatedTotalMinutes });
      }
    }
  };

  const handleEdit = (player: Player) => {
    setModalType('edit');
    setSelectedPlayer(player);
    setPlayerData({
      name: player.name,
      number: player.number,
      position: player.position,
      total_minutes: player.total_minutes
    });
    setIsModalOpen(true);
  };

  const handleDelete = (player: Player) => {
    setModalType('delete');
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlayer) {
      deletePlayer.mutate(selectedPlayer.id);
    }
  };

  const resetForm = () => {
    setPlayerData({ name: '', number: '', position: '', total_minutes: 0 });
    setSelectedPlayer(null);
    setModalType('create');
  };

  const positions = [
    'GOALKEEPER',
    'DEFENDER',
    'MIDFIELDER',
    'FORWARD'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black" />
      </div>
    );
  }

  const renderModal = () => {
    if (modalType === 'delete') {
      return (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlayer(null);
          }}
          title="Delete Player"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <span className="font-medium">{selectedPlayer?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPlayer(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletePlayer.isPending}
                className="btn bg-red-500 hover:bg-red-600"
              >
                {deletePlayer.isPending ? 'Deleting...' : 'Delete Player'}
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    return (
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={modalType === 'create' ? 'Add New Player' : 'Edit Player'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player Name
              </label>
              <input
                type="text"
                value={playerData.name}
                onChange={(e) => setPlayerData(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="Enter player name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jersey Number
              </label>
              <input
                type="number"
                value={playerData.number}
                onChange={(e) => setPlayerData(prev => ({ ...prev, number: e.target.value }))}
                className="input"
                placeholder="Enter jersey number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={playerData.position}
                onChange={(e) => setPlayerData(prev => ({ ...prev, position: e.target.value }))}
                className="input"
                required
              >
                <option value="">Select position</option>
                {positions.map(position => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add minutes
              </label>
              <input
                type="text"
                value={playerData.total_minutes}
                onChange={(e) => setPlayerData(prev => ({ ...prev, total_minutes: parseInt(e.target.value, 10) || 0 }))}
                className="input"
                placeholder="Enter total minutes played"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={createPlayer.isPending || updatePlayer.isPending}
            >
              {modalType === 'create' 
                ? (createPlayer.isPending ? 'Adding...' : 'Add Player')
                : (updatePlayer.isPending ? 'Updating...' : 'Update Player')
              }
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeamSidebar teamId={teamId || ''} activeTab="players" />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-medium">Players</h1>
            <button
              onClick={() => {
                resetForm();
                setModalType('create');
                setIsModalOpen(true);
              }}
              className="btn flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players?.map((player) => (
              <div
                key={player.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-black transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-medium">
                    {player.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{player.name}</h3>
                    <p className="text-sm text-gray-500">{player.position}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{player.total_minutes} min played</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(player)}
                      className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                      title="Edit player"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete player"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!players?.length && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                No players found. Add your first player to get started!
              </div>
            )}
          </div>
        </div>

        {renderModal()}
      </main>
    </div>
  );
}