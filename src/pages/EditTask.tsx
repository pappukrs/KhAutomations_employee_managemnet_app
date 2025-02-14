import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, Upload, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '@googlemaps/js-api-loader';
import { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskImage = Database['public']['Tables']['task_images']['Row'];

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  task_date: z.string().min(1, 'Task date is required'),
  status: z.enum(['pending', 'completed']),
  comments: z.string().optional(),
  amount_received: z.number().min(0, 'Amount must be positive'),
  remaining_amount: z.number().min(0, 'Amount must be positive'),
  total_amount: z.number().min(0, 'Amount must be positive'),
  change_reason: z.string().min(1, 'Please provide a reason for the changes'),
  updator_name: z.string().min(1, 'Updator name is required'),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function EditTask() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [taskImages, setTaskImages] = useState<TaskImage[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  // Watch amount fields to calculate total
  const amountReceived = watch('amount_received');
  const remainingAmount = watch('remaining_amount');

  // Update total amount when received or remaining changes
  const totalAmount = (amountReceived || 0) + (remainingAmount || 0);

  const fetchTask = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      if (data) {
        setTask(data);
        // Update location from split coordinates
        if (data.latitude && data.longitude) {
          setLocation({
            lat: data.latitude,
            lng: data.longitude,
          });
        }
        reset({
          name: data.name,
          owner_name: data.owner_name,
          task_date: data.task_date,
          status: data.status,
          comments: data.comments || '',
          amount_received: data.amount_received,
          remaining_amount: data.remaining_amount,
          total_amount: data.total_amount,
          change_reason: '',
          updator_name: data.updator_name || '',
        });
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Failed to load task');
      navigate('/employee');
    } finally {
      setLoading(false);
    }
  }, [navigate, reset, taskId]);

  const fetchTaskImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('task_images')
        .select('*')
        .eq('task_id', taskId);

      if (error) throw error;
      setTaskImages(data || []);
    } catch (error) {
      console.error('Error fetching task images:', error);
      toast.error('Failed to load task images');
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchTaskImages();
    }
  }, [taskId, fetchTask, fetchTaskImages]);

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
    console.log('handleImageChange triggered');
    console.log('Event target:', e.target);
    
    const files = Array.from(e.target.files || []);
    console.log('Number of files selected:', files.length);
    
    if (files.length === 0) {
      console.warn('No files selected, returning early');
      return;
    }

    // Log detailed file information
    files.forEach((file, index) => {
      console.log(`File ${index + 1} details:`, {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
    });

    setNewImages(files);
    
    const previews = files.map(file => {
      const preview = URL.createObjectURL(file);
      console.log(`Created preview URL for ${file.name}:`, preview);
      return preview;
    });
    setImagePreviews(previews);

    try {
      console.log('Starting image upload process');
      setUploadingImages(true);
      
      for (const file of files) {
        console.log(`Beginning upload for file: ${file.name}`);
        
        const publicUrl = await uploadImage(file);
        console.log(`Upload successful for ${file.name}`);
        console.log('Received public URL:', publicUrl);
        
        setUploadedImageUrls(prev => {
          console.log('Updating uploadedImageUrls state', [...prev, publicUrl]);
          return [...prev, publicUrl];
        });
      }
      
      toast.success(`Successfully uploaded ${files.length} images`);
    } catch (error) {
      console.error('Error during upload process:', error);
      toast.error(`Failed to upload images: ${(error as Error).message}`);
    } finally {
      console.log('Upload process completed');
      setUploadingImages(false);
    }
  }

  // Add cleanup for previews when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup object URLs to avoid memory leaks
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  async function trackChanges(oldData: Task, newData: TaskFormData) {
    const fields = ['name', 'owner_name', 'task_date', 'status', 'comments', 'amount_received', 'remaining_amount'] as const;
    
    for (const field of fields) {
      if (oldData[field]?.toString() !== newData[field]?.toString()) {
        const { error } = await supabase
          .from('task_history')
          .insert([
            {
              task_id: taskId,
              field_name: field,
              old_value: oldData[field]?.toString(),
              new_value: newData[field]?.toString(),
              changed_by: user?.id,
              change_reason: newData.change_reason,
            },
          ]);

        if (error) throw error;
      }
    }
  }

  async function uploadImage(file: File): Promise<string> {
    console.log('uploadImage function called with file:', file.name);
    
    if (!user?.id || !taskId) {
      const error = new Error('User or task ID not found');
      console.error(error);
      throw error;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${taskId}/${fileName}`;
    
    console.log('Generated file path:', filePath);
    console.log('Starting Supabase upload...');

    try {
      const { data, error } = await supabase.storage
        .from('khautomations')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }
      
      console.log('Upload successful, storage data:', data);

      const { data: urlData } = supabase.storage
        .from('khautomations')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload failed with error:', error);
      throw error;
    }
  }

  async function onSubmit(data: TaskFormData) {
    if (!user || !task) {
      console.error('User or task is null');
      return;
    }

    setSaving(true);
    try {
      // Track changes before updating
      console.log('Tracking changes with data:', { oldTask: task, newData: data });
      await trackChanges(task, data);

      // Prepare update data
      const updateData = {
        ...data,
        total_amount: totalAmount,
        latitude: location?.lat,
        longitude: location?.lng,
        updated_at: new Date().toISOString(),
        submission_status: 'in_process',
      };
      console.log('Updating task with data:', updateData);

      // Update task with split location coordinates
      const { data: updatedTask, error: taskError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select();

      if (taskError) {
        console.error('Supabase update error:', taskError);
        throw taskError;
      }

      console.log('Task update response:', updatedTask);

      // Upload new images if any
      if (newImages.length > 0) {
        for (const image of newImages) {
          const publicUrl = await uploadImage(image);
          
          // Store the image reference in task_images table
          const { error: imageError } = await supabase
            .from('task_images')
            .insert([
              {
                task_id: taskId,
                image_url: publicUrl,
              },
            ]);

          if (imageError) throw imageError;
        }
      }

      toast.success('Task updated successfully');
      navigate('/employee');
    } catch (error) {
      console.error('Error updating task:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        const supabaseError = error as { details?: string; hint?: string };
        if ('details' in error) console.error('Error details:', supabaseError.details);
        if ('hint' in error) console.error('Error hint:', supabaseError.hint);
      }
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
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
                    Update Location
                  </button>
                  {location && (
                    <span className="text-sm text-gray-500">
                      Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>

              {taskImages.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Images
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {taskImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={image.image_url}
                            alt="Task"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Add New Images</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {uploadingImages ? (
                      <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
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
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingImages}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>

                {(imagePreviews.length > 0 || uploadedImageUrls.length > 0) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {uploadingImages ? 'Uploading Images...' : 'Uploaded Images'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={`preview-${index}`} className="relative aspect-w-1 aspect-h-1">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="object-cover rounded-lg"
                          />
                          {uploadingImages && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <div className="sm:col-span-2">
                <label htmlFor="change_reason" className="block text-sm font-medium text-gray-700">
                  Reason for Changes
                </label>
                <textarea
                  id="change_reason"
                  rows={2}
                  {...register('change_reason')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Please explain why you are making these changes"
                />
                {errors.change_reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.change_reason.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="updator_name" className="block text-sm font-medium text-gray-700">
                  Updator Name
                </label>
                <input
                  type="text"
                  id="updator_name"
                  {...register('updator_name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your name"
                />
                {errors.updator_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.updator_name.message}</p>
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
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}