import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import TeamSidebar from '../components/TeamSidebar';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface Action {
  id: number;
  name: string;
  key: string;
  color: string;
  match: number | null;
  enabled: boolean;
  default: boolean;
  team: number;
  status: string;
}

type ModalType = 'create' | 'edit' | 'delete';

export default function Actions() {
  const { teamId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('create');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [actionName, setActionName] = useState('');
  const [isTemporal, setIsTemporal] = useState(false);

  const { data: actions } = useQuery<Action[]>({
    queryKey: ['actions', teamId],
    queryFn: async () => {
      const response = await api.get(`/action?team=${teamId}`);

      return response.data.filter((action: Action) => !action.default);
    },
  });

  const createAction = useMutation({
    mutationFn: async ({ name, isTemporal }: { name: string; isTemporal: boolean }) => {
      return api.post('/action', {
        name,
        color: '#000000',
        team: Number(teamId),
        enabled: true,
        default: false,
        temporal: isTemporal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', teamId] });
      setIsModalOpen(false);
      setActionName('');
      toast.success('Action created successfully');
    },
    onError: () => {
      toast.error('Failed to create action');
    }
  });

  const updateAction = useMutation({
    mutationFn: async ({ id, name, status }: { id: number; name: string; status: string }) => {
      return api.patch(`/action/${id}`, {
        name,
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', teamId] });
      setIsModalOpen(false);
      setActionName('');
      setSelectedAction(null);
      toast.success('Action updated successfully');
    },
    onError: () => {
      toast.error('Failed to update action');
    }
  });

  const deleteAction = useMutation({
    mutationFn: async (actionId: number) => {
      return api.delete(`/action/${actionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', teamId] });
      setIsModalOpen(false);
      setSelectedAction(null);
      toast.success('Action deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete action');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionName.trim()) {
      if (modalType === 'create') {
        createAction.mutate({ name: actionName, isTemporal });
      } else if (modalType === 'edit' && selectedAction) {
        updateAction.mutate({ id: selectedAction.id, name: actionName, status: selectedAction.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' });
      }
    }
  };

  const handleEdit = (action: Action) => {
    setModalType('edit');
    setSelectedAction(action);
    setActionName(action.name);
    setIsModalOpen(true);
  };

  const handleDelete = (action: Action) => {
    setModalType('delete');
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const renderModal = () => {
    if (modalType === 'delete') {
      return (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAction(null);
          }}
          title="Delete Action"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <span className="font-medium">{selectedAction?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedAction && deleteAction.mutate(selectedAction.id)}
                disabled={deleteAction.isPending}
                className="btn bg-red-500 hover:bg-red-600"
              >
                {deleteAction.isPending ? 'Deleting...' : 'Delete Action'}
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
          setActionName('');
          setSelectedAction(null);
          setIsTemporal(false);
        }}
        title={modalType === 'create' ? 'Create New Action' : 'Edit Action'}
      >
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Name
            </label>
            <input
              type="text"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="input"
              placeholder="Enter action name"
              required
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isTemporal}
                onChange={(e) => setIsTemporal(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Is this action temporal?</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setActionName('');
                setSelectedAction(null);
                setIsTemporal(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={createAction.isPending || updateAction.isPending}
            >
              {modalType === 'create' 
                ? (createAction.isPending ? 'Creating...' : 'Create Action')
                : (updateAction.isPending ? 'Updating...' : 'Update Action')
              }
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeamSidebar teamId={teamId || ''} activeTab="actions" />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-medium">Actions</h1>
            <button
              onClick={() => {
                setModalType('create');
                setIsModalOpen(true);
              }}
              className="btn flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Action
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions?.map((action) => (
              <div
                key={action.id} 
                className={`rounded-lg border p-4 transition-colors ${action.status === 'INACTIVE' ? 'bg-gray-300 border-gray-500 opacity-70' : 'bg-white border-gray-200 hover:border-black'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: action.color }}
                    />
                    <h3 className="font-medium">{action.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(action)}
                      className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                      title="Edit action"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const newStatus = action.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
                        updateAction.mutate({ id: action.id, name: action.name ,  status: newStatus });
                      }}
                      className={`p-2 rounded-full transition-colors ${action.status === 'INACTIVE'? 'text-500 hover:bg-50' : 'text-500 hover:bg-50'}`}
                      title={action.status === 'INACTIVE'? 'Enable action' : 'Disable action'}
                    >
                      {action.status === 'INACTIVE' ? 'Enable' : 'Disable'}
                    </button>
                    <button
                      onClick={() => handleDelete(action)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-50 transition-colors"
                      title="Delete action"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!actions?.filter(action => action.status === 'ACTIVE').length && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                No actions found. Create your first action to get started!
              </div>
            )}
          </div>
        </div>

        {renderModal()}
      </main>
    </div>
  );
}