CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'club_president',
    'user',
    'faculty'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: is_club_president(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_club_president(_user_id uuid, _club_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'club_president' AND club_id = _club_id
  )
$$;


--
-- Name: is_faculty_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_faculty_email(email text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT email LIKE '%@mitsgwalior.in'
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: campus_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campus_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    floor_info text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT campus_locations_category_check CHECK ((category = ANY (ARRAY['academic'::text, 'administrative'::text, 'library'::text, 'canteen'::text, 'sports'::text, 'hostel'::text, 'parking'::text, 'other'::text])))
);


--
-- Name: club_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    club_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    event_date timestamp with time zone,
    location text,
    image_url text,
    is_past boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: club_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    club_id uuid NOT NULL,
    user_id uuid,
    name text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "position" text,
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clubs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    faculty_coordinator text NOT NULL,
    faculty_email text,
    recruitment_open boolean DEFAULT false,
    recruitment_info text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_by uuid,
    approval_token text
);


--
-- Name: lost_found_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lost_found_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    image_url text,
    location text,
    contact_info text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lost_found_items_status_check CHECK ((status = ANY (ARRAY['active'::text, 'resolved'::text]))),
    CONSTRAINT lost_found_items_type_check CHECK ((type = ANY (ARRAY['lost'::text, 'found'::text])))
);


--
-- Name: pending_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_type text NOT NULL,
    item_id uuid NOT NULL,
    submitted_by uuid NOT NULL,
    faculty_email text NOT NULL,
    approval_token text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pending_approvals_item_type_check CHECK ((item_type = ANY (ARRAY['shop'::text, 'club'::text]))),
    CONSTRAINT pending_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: shop_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category text,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: shops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    location text,
    image_url text,
    opening_time text,
    closing_time text,
    contact text,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_by uuid,
    approval_token text,
    CONSTRAINT shops_category_check CHECK ((category = ANY (ARRAY['canteen'::text, 'stationery'::text, 'general'::text, 'other'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    club_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: campus_locations campus_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campus_locations
    ADD CONSTRAINT campus_locations_pkey PRIMARY KEY (id);


--
-- Name: club_events club_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_events
    ADD CONSTRAINT club_events_pkey PRIMARY KEY (id);


--
-- Name: club_members club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: lost_found_items lost_found_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_found_items
    ADD CONSTRAINT lost_found_items_pkey PRIMARY KEY (id);


--
-- Name: pending_approvals pending_approvals_approval_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_approvals
    ADD CONSTRAINT pending_approvals_approval_token_key UNIQUE (approval_token);


--
-- Name: pending_approvals pending_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_approvals
    ADD CONSTRAINT pending_approvals_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: shop_items shop_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_items
    ADD CONSTRAINT shop_items_pkey PRIMARY KEY (id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_club_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_club_id_key UNIQUE (user_id, role, club_id);


--
-- Name: clubs update_clubs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lost_found_items update_lost_found_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lost_found_updated_at BEFORE UPDATE ON public.lost_found_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pending_approvals update_pending_approvals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pending_approvals_updated_at BEFORE UPDATE ON public.pending_approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: club_events club_events_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_events
    ADD CONSTRAINT club_events_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: club_members club_members_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: club_members club_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clubs clubs_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);


--
-- Name: lost_found_items lost_found_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_found_items
    ADD CONSTRAINT lost_found_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pending_approvals pending_approvals_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_approvals
    ADD CONSTRAINT pending_approvals_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: shop_items shop_items_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_items
    ADD CONSTRAINT shop_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: shops shops_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: campus_locations Admins can manage campus locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage campus locations" ON public.campus_locations TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: clubs Admins can manage clubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage clubs" ON public.clubs TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: shop_items Admins can manage shop items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage shop items" ON public.shop_items TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: shops Admins can manage shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage shops" ON public.shops TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lost_found_items Anyone authenticated can view lost_found; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone authenticated can view lost_found" ON public.lost_found_items FOR SELECT TO authenticated USING (true);


--
-- Name: clubs Anyone can view approved clubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved clubs" ON public.clubs FOR SELECT USING (((status = 'approved'::text) OR (auth.uid() = submitted_by)));


--
-- Name: shops Anyone can view approved shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved shops" ON public.shops FOR SELECT USING (((status = 'approved'::text) OR (auth.uid() = submitted_by)));


--
-- Name: campus_locations Anyone can view campus locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view campus locations" ON public.campus_locations FOR SELECT USING (true);


--
-- Name: club_events Anyone can view club events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view club events" ON public.club_events FOR SELECT USING (true);


--
-- Name: club_members Anyone can view club members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view club members" ON public.club_members FOR SELECT USING (true);


--
-- Name: shop_items Anyone can view shop items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shop items" ON public.shop_items FOR SELECT USING (true);


--
-- Name: clubs Authenticated users can submit clubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can submit clubs" ON public.clubs FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (status = 'pending'::text)));


--
-- Name: shops Authenticated users can submit shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can submit shops" ON public.shops FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (status = 'pending'::text)));


--
-- Name: club_events Club presidents can manage events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club presidents can manage events" ON public.club_events TO authenticated USING (public.is_club_president(auth.uid(), club_id));


--
-- Name: club_members Club presidents can manage members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club presidents can manage members" ON public.club_members TO authenticated USING (public.is_club_president(auth.uid(), club_id));


--
-- Name: clubs Club presidents can update their club; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club presidents can update their club" ON public.clubs FOR UPDATE TO authenticated USING (public.is_club_president(auth.uid(), id));


--
-- Name: lost_found_items Users can create lost_found; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create lost_found" ON public.lost_found_items FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: pending_approvals Users can create submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create submissions" ON public.pending_approvals FOR INSERT WITH CHECK ((auth.uid() = submitted_by));


--
-- Name: lost_found_items Users can delete own lost_found; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own lost_found" ON public.lost_found_items FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: lost_found_items Users can update own lost_found; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own lost_found" ON public.lost_found_items FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: pending_approvals Users can view own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own submissions" ON public.pending_approvals FOR SELECT USING ((auth.uid() = submitted_by));


--
-- Name: campus_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campus_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: club_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

--
-- Name: club_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

--
-- Name: clubs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

--
-- Name: lost_found_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_approvals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: shop_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

--
-- Name: shops; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


