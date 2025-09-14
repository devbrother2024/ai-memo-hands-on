# AI 메모장 - Hands-on 강의 프로젝트

Next.js, Supabase, Drizzle ORM을 활용한 AI 메모 관리 애플리케이션입니다.

## 🚀 프로젝트 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd ai-memo-hands-on
pnpm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 다음 정보 확인:
    - Project URL
    - API Keys (anon, service_role)
    - Database Password

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 Supabase 정보를 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### 4. 데이터베이스 스키마 적용

⚠️ **중요**: 기존 Supabase 프로젝트에 테이블이 이미 생성되어 있다면 아래 사전 확인을 먼저 해주세요.

#### 사전 확인 (기존 프로젝트 사용자)

Supabase 대시보드 → Table Editor에서 기존 테이블 확인:

-   `notes` 테이블이 없다면 → 바로 다음 단계 진행
-   `notes` 테이블이 있다면 → 아래 옵션 중 선택

**옵션 1: 기존 테이블 삭제 (데이터 손실)**

```sql
-- Supabase SQL Editor에서 실행
DROP TABLE IF EXISTS public.notes CASCADE;
```

**옵션 2: 새로운 Supabase 프로젝트 생성 (권장)**

-   강의용으로 새 프로젝트 생성
-   기존 프로젝트는 그대로 유지

#### 스키마 적용

```bash
# 1. 스키마에서 마이그레이션 파일 생성
pnpm run db:generate

# 2. 마이그레이션을 데이터베이스에 적용
pnpm run db:migrate
```

성공하면 다음과 같은 메시지가 출력됩니다:

```bash
# db:generate 후
✓ Generated 1 migration

# db:migrate 후
✓ No schema changes, nothing to migrate
# 또는
✓ Applied 1 migration
```

### 5. RLS 정책 적용

Supabase 대시보드의 SQL Editor에서 다음 파일의 내용을 실행하세요:
`supabase/migrations/0001_enable_rls_and_policies.sql`

또는 아래 SQL을 직접 실행:

```sql
-- Enable RLS on notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes (updated_at DESC);
```

### 6. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인하세요.

## 🛠 주요 기술 스택

-   **Framework**: Next.js 15 (App Router)
-   **Database**: Supabase (PostgreSQL)
-   **ORM**: Drizzle ORM
-   **Authentication**: Supabase Auth
-   **UI**: shadcn/ui + Tailwind CSS
-   **Language**: TypeScript

## 📁 프로젝트 구조

```
├── app/                    # Next.js App Router
├── components/             # React 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── db/               # Drizzle 설정 및 스키마
│   ├── supabase/         # Supabase 클라이언트
│   └── notes/            # 노트 관련 로직
├── drizzle/              # 마이그레이션 파일
└── supabase/             # RLS 정책 등
```

## 🔧 Drizzle 명령어

```bash
# 스키마 변경 후 마이그레이션 생성
pnpm run db:generate

# 현재 스키마를 DB에 직접 적용 (개발용)
pnpm run db:push

# Drizzle Studio 실행
pnpm run db:studio
```

## 📚 강의 진행 중 문제 해결

### 데이터베이스 연결 오류

-   `.env.local` 파일의 `DATABASE_URL`이 올바른지 확인
-   Supabase 프로젝트가 활성 상태인지 확인

### 스키마 적용 오류

**"Table already exists" 오류**

```bash
Error: relation "notes" already exists
```

→ 기존 테이블 삭제 또는 새 프로젝트 사용 (위의 사전 확인 참조)

**"Column conflicts" 오류**

```bash
Error: Cannot alter table - column conflicts detected
```

→ 기존 테이블의 스키마가 다름. 테이블 삭제 후 재생성 필요

**스키마 재적용**

```bash
# 현재 스키마 상태 확인
pnpm run db:studio

# 스키마 재적용
pnpm run db:push
```

### 인증 오류

-   Supabase 키가 정확한지 확인
-   RLS 정책이 제대로 적용되었는지 확인

### 노트 생성/조회 오류

-   RLS 정책이 활성화되어 있는지 확인
-   사용자가 로그인되어 있는지 확인
-   브라우저 개발자 도구에서 네트워크/콘솔 오류 확인

## 📖 더 알아보기

### Next.js 리소스

-   [Next.js Documentation](https://nextjs.org/docs) - Next.js 기능 및 API
-   [Learn Next.js](https://nextjs.org/learn) - 인터랙티브 Next.js 튜토리얼

### 프로젝트 관련 기술

-   [Supabase Docs](https://supabase.com/docs) - Supabase 공식 문서
-   [Drizzle ORM](https://orm.drizzle.team/) - Drizzle ORM 문서
-   [shadcn/ui](https://ui.shadcn.com/) - UI 컴포넌트 라이브러리

## 🚀 배포

Vercel을 사용한 배포는 [Vercel Platform](https://vercel.com/new)에서 간편하게 할 수 있습니다.

배포 시 환경 변수 설정을 잊지 마세요!
