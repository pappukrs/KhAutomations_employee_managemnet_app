import { supabase } from './supabase.js';

async function createInitialUser() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@gmail.com',
      password: 'test@password',
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }

    console.log('User creation response:', data); // Debug log

    // Assuming the user is created, insert into the profiles table
    const { user } = data;
    
    if (!user || !user.id) {
      console.error('No user ID available');
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: 'test_user',
          role: 'employee',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select(); // Add this to get the response data

    if (profileError) {
      console.error('Error inserting profile:', profileError.message);
      console.error('Full error:', profileError); // Debug log
    } else {
      console.log('Profile created successfully:', profileData);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createInitialUser();