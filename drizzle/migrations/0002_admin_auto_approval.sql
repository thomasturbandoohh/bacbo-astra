-- Correção crítica do Administrador (adminbacboastra@gmail.com)
-- 1. Auto-aprovação imediata e concessão de role admin no trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _is_admin boolean;
BEGIN
  _is_admin := lower(COALESCE(NEW.email, '')) = 'adminbacboastra@gmail.com';

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

-- 2. Multi-dispositivo sem encerramento de sessão para o administrador
CREATE OR REPLACE FUNCTION public.claim_session(_sid text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _email text;
BEGIN
  SELECT lower(email) INTO _email FROM public.profiles WHERE id = auth.uid();
  IF _email = 'adminbacboastra@gmail.com' THEN
    RETURN;
  END IF;
  UPDATE public.profiles SET session_id = _sid WHERE id = auth.uid();
END;
$$;

-- 3. Atualizar usuário admin existente, caso já cadastrado
DO $$
DECLARE
  _admin_id uuid;
BEGIN
  SELECT id INTO _admin_id FROM auth.users WHERE lower(email) = 'adminbacboastra@gmail.com' LIMIT 1;
  IF _admin_id IS NOT NULL THEN
    UPDATE public.profiles SET status = 'aprovado' WHERE id = _admin_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (_admin_id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;
