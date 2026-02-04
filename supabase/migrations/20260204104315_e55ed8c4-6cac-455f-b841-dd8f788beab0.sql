-- Fix privilege escalation vulnerability in handle_new_user()
-- The function should NEVER trust client-supplied roles

-- ============================================
-- 1. FIX THE VULNERABLE TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- SECURITY FIX: ALWAYS assign 'doctor' role by default
  -- NEVER trust client-supplied role data
  -- Admins must be promoted manually by existing admins
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'doctor'::app_role);
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. CREATE SECURE ADMIN PROMOTION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.promote_to_admin(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only existing admins can promote users
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can promote users to admin role';
  END IF;
  
  -- Update the user's role to admin
  UPDATE public.user_roles
  SET role = 'admin'::app_role
  WHERE user_id = _user_id;
  
  -- If no row was updated (user doesn't have a role yet), insert one
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin'::app_role);
  END IF;
  
  -- Audit the promotion for security tracking
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 
    'PROMOTE_TO_ADMIN', 
    'user_roles', 
    _user_id, 
    jsonb_build_object(
      'promoted_user_id', _user_id,
      'promoted_by', auth.uid(),
      'promoted_at', now()
    )
  );
END;
$$;

-- ============================================
-- 3. CREATE DEMOTE FROM ADMIN FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.demote_from_admin(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only existing admins can demote users
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  -- Prevent self-demotion to avoid locking out all admins
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;
  
  -- Demote user back to doctor
  UPDATE public.user_roles
  SET role = 'doctor'::app_role
  WHERE user_id = _user_id AND role = 'admin'::app_role;
  
  -- Audit the demotion
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 
    'DEMOTE_FROM_ADMIN', 
    'user_roles', 
    _user_id, 
    jsonb_build_object(
      'demoted_user_id', _user_id,
      'demoted_by', auth.uid(),
      'demoted_at', now()
    )
  );
END;
$$;