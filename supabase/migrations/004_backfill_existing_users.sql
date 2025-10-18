-- 기존 auth.users에 있는 사용자들을 public.users로 백필하는 함수
CREATE OR REPLACE FUNCTION public.backfill_existing_users()
RETURNS TABLE(processed_count INTEGER, skipped_count INTEGER) AS $$
DECLARE
    processed INTEGER := 0;
    skipped INTEGER := 0;
    user_record RECORD;
BEGIN
    -- auth.users에 있지만 public.users에 없는 사용자들을 찾아서 추가
    FOR user_record IN 
        SELECT 
            au.id,
            au.email,
            COALESCE(
                au.raw_user_meta_data->>'name',
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'display_name',
                au.raw_user_meta_data->>'username',
                split_part(au.email, '@', 1)
            ) as name,
            COALESCE(
                au.raw_user_meta_data->>'role',
                'user'
            ) as role,
            au.created_at
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        BEGIN
            INSERT INTO public.users (
                id,
                email,
                name,
                role,
                created_at
            ) VALUES (
                user_record.id,
                user_record.email,
                user_record.name,
                user_record.role,
                user_record.created_at
            );
            processed := processed + 1;
        EXCEPTION
            WHEN OTHERS THEN
                skipped := skipped + 1;
                RAISE LOG 'Failed to backfill user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT processed, skipped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 백필 함수 실행 (주석 해제하여 실행)
-- SELECT * FROM public.backfill_existing_users();

-- 사용자 정보 동기화를 위한 유틸리티 함수
CREATE OR REPLACE FUNCTION public.sync_user_profile(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    auth_user RECORD;
BEGIN
    -- auth.users에서 사용자 정보 가져오기
    SELECT 
        id,
        email,
        COALESCE(
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'display_name',
            raw_user_meta_data->>'username',
            split_part(email, '@', 1)
        ) as name,
        COALESCE(
            raw_user_meta_data->>'role',
            'user'
        ) as role
    INTO auth_user
    FROM auth.users 
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- public.users 테이블 업데이트 또는 삽입
    INSERT INTO public.users (
        id,
        email,
        name,
        role,
        updated_at
    ) VALUES (
        auth_user.id,
        auth_user.email,
        auth_user.name,
        auth_user.role,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
