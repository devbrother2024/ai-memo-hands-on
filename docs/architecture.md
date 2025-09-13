# 🏗️ 아키텍처 문서 – AI 메모장

## 1. 기술 스택

-   **프레임워크:** Next.js (App Router, Server Actions)
-   **UI:** shadcn/ui + Tailwind + Radix UI
-   **DB/인증:** Supabase (Postgres, Auth, Storage)
-   **ORM:** Drizzle ORM (마이그레이션/쿼리)
-   **AI 모델:** Google Gemini API (요약/태깅)
-   **호스팅:** Vercel (Preview/Prod)

---

## 2. 데이터 모델

-   **notes**
    -   id, user_id, title, content, created_at, updated_at
-   **note_tags**
    -   note_id, tag
-   **summaries**
    -   note_id, model, content, created_at

---

## 3. 보안

-   **권한 스코프**
    -   Notes/Tags: 사용자 ID 스코프로 소유자만 CRUD 가능
    -   Summaries: 사용자 스코프 읽기, 삽입/갱신은 서버에서 처리
-   **키 관리:** Supabase 서비스 롤 키는 서버 전용

---

## 4. 서버 액션

-   `saveNote` – 노트 작성/수정
-   `deleteNote` – 노트 삭제
-   `regenerateAI` – Gemini 호출 후 요약/태그 저장

---

## 5. 검색 전략

-   Postgres Full Text Search (태그 > 제목 > 본문)
-   GIN 인덱스 기반 최적화

---

## 6. 배포/운영

-   **Vercel Preview** 브랜치 기반
-   **Drizzle Kit**으로 마이그레이션 관리
-   **Supabase 모니터링** + 선택적 Sentry 에러 트래킹
-   **성능 가드레일:** 요약 길이 제한(8k 토큰), Gemini 무료 할당 활용

---
