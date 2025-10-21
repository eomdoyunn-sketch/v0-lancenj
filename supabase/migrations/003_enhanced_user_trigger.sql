-- 기존 트리거와 함수 삭제 (업그레이드를 위해)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 향상된 사용자 생성 처리 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- 이메일 추출
    user_email := COALESCE(NEW.email, '');
    
    -- 이름 추출 (여러 메타데이터 필드에서 시도)
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'username',
        split_part(user_email, '@', 1) -- 이메일에서 이름 부분 추출
    );
    
    -- 역할 추출 (기본값: 'user')
    user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'user'
    );
    
    -- public.users 테이블에 사용자 삽입
    INSERT INTO public.users (
        id,
        email,
        name,
        role,
        created_at
    ) VALUES (
        NEW.id,
        user_email,
        user_name,
        user_role,
        NOW()
    );
    
    -- 로그 기록 (선택사항)
    INSERT INTO public.audit_logs (
        user_id,
        user_name,
        action,
        entity_type,
        entity_name,
        details,
        timestamp
    ) VALUES (
        NEW.id,
        user_name,
        'CREATE',
        'user',
        user_name,
        'New user created via signup',
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러 발생 시 로그 기록
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 사용자 정보 업데이트를 위한 함수 (선택사항)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- auth.users 테이블이 업데이트될 때 public.users도 업데이트
    UPDATE public.users SET
        email = COALESCE(NEW.email, OLD.email),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 업데이트 트리거
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();


