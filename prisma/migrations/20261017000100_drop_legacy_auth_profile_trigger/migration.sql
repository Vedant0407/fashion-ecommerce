-- Remove the obsolete auth trigger that inserts profiles without updated_at.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;