-- Add server-side validation constraints for all tables

-- Lost & Found items validation
ALTER TABLE lost_found_items 
ADD CONSTRAINT title_length CHECK (length(title) <= 200),
ADD CONSTRAINT description_length CHECK (length(description) <= 2000),
ADD CONSTRAINT contact_info_length CHECK (length(contact_info) <= 500),
ADD CONSTRAINT location_length CHECK (length(location) <= 200);

-- Clubs validation
ALTER TABLE clubs 
ADD CONSTRAINT club_name_length CHECK (length(name) <= 200),
ADD CONSTRAINT club_description_length CHECK (length(description) <= 2000),
ADD CONSTRAINT faculty_coordinator_length CHECK (length(faculty_coordinator) <= 200),
ADD CONSTRAINT faculty_email_format CHECK (faculty_email IS NULL OR faculty_email ~ '^[^@]+@[^@]+\.[^@]+$'),
ADD CONSTRAINT recruitment_info_length CHECK (length(recruitment_info) <= 2000);

-- Shops validation
ALTER TABLE shops 
ADD CONSTRAINT shop_name_length CHECK (length(name) <= 200),
ADD CONSTRAINT shop_description_length CHECK (length(description) <= 2000),
ADD CONSTRAINT shop_location_length CHECK (length(location) <= 200),
ADD CONSTRAINT shop_contact_length CHECK (length(contact) <= 200),
ADD CONSTRAINT category_length CHECK (length(category) <= 100);

-- Campus locations validation
ALTER TABLE campus_locations 
ADD CONSTRAINT location_name_length CHECK (length(name) <= 200),
ADD CONSTRAINT location_description_length CHECK (length(description) <= 2000),
ADD CONSTRAINT floor_info_length CHECK (length(floor_info) <= 100),
ADD CONSTRAINT latitude_range CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT longitude_range CHECK (longitude >= -180 AND longitude <= 180);

-- Profiles validation (email already has unique, add format check)
ALTER TABLE profiles
ADD CONSTRAINT full_name_length CHECK (length(full_name) <= 200),
ADD CONSTRAINT profile_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');

-- Pending approvals validation
ALTER TABLE pending_approvals
ADD CONSTRAINT approval_faculty_email_format CHECK (faculty_email = 'pending' OR faculty_email ~ '^[^@]+@[^@]+\.[^@]+$');