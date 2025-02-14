-- Enable Row Level Security (RLS) on storage.objects
alter table storage.objects enable row level security;

-- Allow all authenticated users to insert files
create policy "allow all authenticated insert"
on storage.objects
for insert
with check (auth.role() = 'authenticated');

-- Allow all authenticated users to read all files
create policy "allow all authenticated read"
on storage.objects
for select
using (auth.role() = 'authenticated');

-- Allow all authenticated users to update any file
create policy "allow all authenticated update"
on storage.objects
for update
using (auth.role() = 'authenticated');

-- Allow all authenticated users to delete any file
create policy "allow all authenticated delete"
on storage.objects
for delete
using (auth.role() = 'authenticated');
