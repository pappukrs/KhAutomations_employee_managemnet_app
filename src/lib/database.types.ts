export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          role: 'employee' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          role: 'employee' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: 'employee' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          name: string
          owner_name: string
          task_date: string
          status: 'pending' | 'completed'
          comments: string | null
          location: Json | null
          amount_received: number
          remaining_amount: number
          total_amount: number
          created_by: string
          created_at: string
          updated_at: string
          submission_status: 'in_process' | 'submitted'
        }
        Insert: {
          id?: string
          name: string
          owner_name: string
          task_date: string
          status: 'pending' | 'completed'
          comments?: string | null
          location?: Json | null
          amount_received?: number
          remaining_amount?: number
          total_amount?: number
          created_by: string
          created_at?: string
          updated_at?: string
          submission_status?: 'in_process' | 'submitted'
        }
        Update: {
          id?: string
          name?: string
          owner_name?: string
          task_date?: string
          status?: 'pending' | 'completed'
          comments?: string | null
          location?: Json | null
          amount_received?: number
          remaining_amount?: number
          total_amount?: number
          created_by?: string
          created_at?: string
          updated_at?: string
          submission_status?: 'in_process' | 'submitted'
        }
      }
      task_images: {
        Row: {
          id: string
          task_id: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          image_url?: string
          created_at?: string
        }
      }
      task_history: {
        Row: {
          id: string
          task_id: string
          field_name: string
          old_value: string | null
          new_value: string | null
          changed_by: string
          change_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          field_name: string
          old_value?: string | null
          new_value?: string | null
          changed_by: string
          change_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          field_name?: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string
          change_reason?: string | null
          created_at?: string
        }
      }
    }
  }
}