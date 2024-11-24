import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import Modal from '../components/Modal';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  club: number;
}

export default function Teams() {
  const navigate = useNavigate();
  const { data: teams, isLoading, refetch } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get('/team');
      return response.data;
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const { data: clubs } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['clubs'],
    queryFn: async () => {
      const response = await api.get('/club');
      return response.data;
    },
  });
  const createTeam = useMutation({
    mutationFn: async ({ name, clubId }: { name: string; clubId: number }) => {
      return api.post('/team', { name, club: clubId });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setNewTeamName('');
      toast.success('Team created successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to create team');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim() && selectedClubId) {
      createTeam.mutate({ name: newTeamName, clubId: selectedClubId });
    }
  };

  const handleTeamSelect = (team: Team) => {
    localStorage.setItem('selectedTeamName', team.name);
    navigate(`/team/${team.id}/matches`);
  };

  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black" />
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium">Teams</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Team
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams?.map((team) => (
          <button
            key={team.id}
            onClick={() => handleTeamSelect(team)}
            className="text-left p-6 border border-gray-200 rounded hover:border-black transition-colors"
          >
            <h2 className="text-lg font-medium">{team.name}</h2>
          </button>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Team"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="input"
                placeholder="Enter team name"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="clubSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Club
              </label>
              <select
                id="clubSelect"
                value={selectedClubId || ''}
                onChange={(e) => setSelectedClubId(Number(e.target.value))}
                className="input"
                required
              >
                <option value="" disabled>Select a club</option>
                {clubs?.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewTeamName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={createTeam.isPending}
              >
                {createTeam.isPending ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}