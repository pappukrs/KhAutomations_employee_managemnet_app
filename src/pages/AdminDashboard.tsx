import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { format } from 'date-fns';
import { ClipboardList, History, MapPin, Image } from 'lucide-react';
import toast from 'react-hot-toast';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskHistory = Database['public']['Tables']['task_history']['Row'];

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchTaskHistory(selectedTask.id);
    }
  }, [selectedTask]);

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTaskHistory(taskId: string) {
    try {
      const { data, error } = await supabase
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTaskHistory(data || []);
    } catch (error) {
      console.error('Error fetching task history:', error);
      toast.error('Failed to load task history');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">All Tasks</h2>
              {loading ? (
                <div className="text-center py-4">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-4 rounded-lg border ${
                        selectedTask?.id === task.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{task.name}</h3>
                          <p className="text-sm text-gray-600">Owner: {task.owner_name}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Task Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {selectedTask ? (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Task Details</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Task Name</p>
                          <p className="font-medium">{selectedTask.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Owner</p>
                          <p className="font-medium">{selectedTask.owner_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium">
                            {format(new Date(selectedTask.task_date), 'PPP')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="font-medium">{selectedTask.status}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Financial Details</h3>
                      <div className="mt-2 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Received</p>
                          <p className="font-medium">${selectedTask.amount_received}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Remaining</p>
                          <p className="font-medium">${selectedTask.remaining_amount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-medium">${selectedTask.total_amount}</p>
                        </div>
                      </div>
                    </div>

                    {selectedTask.location && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Location
                        </h3>
                        <p className="mt-1 text-sm">
                          Lat: {selectedTask.location.lat}, Lng: {selectedTask.location.lng}
                        </p>
                      </div>
                    )}

                    {selectedTask.comments && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Comments</h3>
                        <p className="mt-1 text-sm text-gray-600">{selectedTask.comments}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <History className="h-4 w-4 mr-1" />
                        Change History
                      </h3>
                      <div className="mt-2 space-y-3">
                        {taskHistory.map((history) => (
                          <div
                            key={history.id}
                            className="text-sm border-l-2 border-gray-200 pl-3"
                          >
                            <p className="text-gray-600">
                              <span className="font-medium">{history.field_name}</span> changed from{' '}
                              <span className="font-medium">{history.old_value || 'empty'}</span> to{' '}
                              <span className="font-medium">{history.new_value}</span>
                            </p>
                            {history.change_reason && (
                              <p className="text-gray-500 text-xs mt-1">
                                Reason: {history.change_reason}
                              </p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                              {format(new Date(history.created_at), 'PPP p')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Select a task to view details
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}