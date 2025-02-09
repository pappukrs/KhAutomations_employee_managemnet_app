import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, Upload, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '@googlemaps/js-api-loader';
import toast from 'react-hot-toast';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  task_date: z.string().min(1, 'Task date is required'),
  status: z.enum(['pending', 'completed']),
  comments: z.string().optional(),
  amount_received: z.number().min(0, 'Amount must be positive'),
  remaining_amount: z.number().min(0, 'Amount must be positive'),
  total_amount: z.number().min(0, 'Amount must be positive'),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function CreateTask() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'pending',
      amount_received: 0,
      remaining_amount: 0,
      total_amount: 0,
    },
  });

  // Watch amount fields to calculate total
  const amountReceived = watch('amount_received');
  const remainingAmount = watch('remaining_amount');

  // Update total amount when received or remaining changes
  const totalAmount = (amountReceived || 0) + (remainingAmount || 0);

  async function detectLocation() {
    setLoadingLocation(true);
    try {
      const googleMapsLoader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
      });

      await googleMapsLoader.load();
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            toast.success('Location detected successfully');
          },
          (error) => {
            console.error('Error getting location:', error);
            toast.error('Failed to detect location');
          }
        );
      } else {
        toast.error('Geolocation is not supported by your browser');
      }
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      toast.error('Failed to initialize location services');
    } finally {
      setLoadingLocation(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImages(files);
  }

  async function onSubmit(data: TaskFormData) {
    if (!user) {
      toast.error('You must be logged in to create a task');
      return;
    }

    setLoading(true);
    try {
      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert([
          {
            ...data,
            total_amount: totalAmount,
            location: location,
            created_by: user.id,
            submission_status: 'in_process',
          },
        ])
        .select()
        .single();

      if (taskError) throw taskError;

      // Upload images if any
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${task.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('task-images')
            .upload(filePath, image);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: publicUrl } = supabase.storage
            .from('task-images')
            .getPublicUrl(filePath);

          // Save image reference
          const { error: imageError } = await supabase
            .from('task_images')
            .insert([
              {
                task_id: task.id,
                image_url: publicUrl.publicUrl,
              },
            ]);

          if (imageError) throw imageError;
        }
      }

      toast.success('Task created successfully');
      navigate('/employee');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/employee')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Task Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="owner_name" className="block text-sm font-medium text-gray-700">
                  Owner Name
                </label>
                <input
                  type="text"
                  id="owner_name"
                  {...register('owner_name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.owner_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.owner_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="task_date" className="block text-sm font-medium text-gray-700">
                  Task Date
                </label>
                <input
                  type="date"
                  id="task_date"
                  {...register('task_date')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.task_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.task_date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                  Comments
                </label>
                <textarea
                  id="comments"
                  rows={3}
                  {...register('comments')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="amount_received" className="block text-sm font-medium text-gray-700">
                  Amount Received ($)
                </label>
                <input
                  type="number"
                  id="amount_received"
                  {...register('amount_received', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.amount_received && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount_received.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="remaining_amount" className="block text-sm font-medium text-gray-700">
                  Remaining Amount ($)
                </label>
                <input
                  type="number"
                  id="remaining_amount"
                  {...register('remaining_amount', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.remaining_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.remaining_amount.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-700">Total Amount: ${totalAmount}</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <div className="mt-1 flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={loadingLocation}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loadingLocation ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="h-5 w-5 mr-2" />
                    )}
                    Detect Location
                  </button>
                  {location && (
                    <span className="text-sm text-gray-500">
                      Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Images</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="images"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload files</span>
                        <input
                          id="images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
                {images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{images.length} files selected</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/employee')}
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Task
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}