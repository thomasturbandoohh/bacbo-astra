-- Correção crítica dos Administradores (adminbacboastra@gmail.com e thomasturbandoohh@gmail.com)
-- 1. Auto-aprovação imediata e concessão de role admin no trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _is_admin boolean;
BEGIN
  _is_admin := lower(COALESCE(NEW.email, '')) IN ('adminbacboastra@gmail.com', 'thomasturbandoohh@gmail.com');

  INSERT INTO public.profiles (id, full_name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    CASE WHEN _is_admin THEN 'aprovado'::public.user_status ELSE 'pendente'::public.user_status END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    status = CASE WHEN _is_admin THEN 'aprovado'::public.user_status ELSE profiles.status END,
    email = COALESCE(NEW.email, profiles.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_admin THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END $$;

-- 2. Multi-dispositivo sem encerramento de sessão para administradores
CREATE OR REPLACE FUNCTION public.claim_session(_sid text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _email text;
BEGIN
  SELECT lower(email) INTO _email FROM public.profiles WHERE id = auth.uid();
  IF _email IN ('adminbacboastra@gmail.com', 'thomasturbandoohh@gmail.com') THEN
    RETURN;
  END IF;
  UPDATE public.profiles SET session_id = _sid WHERE id = auth.uid();
END;
$$;

-- 3. Atualizar usuários admin existentes, caso já cadastrados
DO $$
BEGIN
  UPDATE public.profiles 
  SET status = 'aprovado' 
  WHERE lower(email) IN ('adminbacboastra@gmail.com', 'thomasturbandoohh@gmail.com');

  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin'::public.app_role 
  FROM auth.users 
  WHERE lower(email) IN ('adminbacboastra@gmail.com', 'thomasturbandoohh@gmail.com')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
