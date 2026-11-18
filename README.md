# 우리의 기록

만날 때마다 날짜·사진·그날의 마음(편지)을 남기는 개인 기록 공간. Next.js 16 + Supabase, Vercel 배포, 모바일 PWA.

## 화면
- **기록** `/` — 함께한 날(D+), 기록 수, 다음 약속 D-day, 월별 타임라인
- **캘린더** `/calendar` — 만난 날 ♥, 약속 표시 (보기 전용)
- **사진** `/photos` — 모든 사진 최신순, 탭하면 전체화면 + 해당 기록으로 이동
- **상세** `/m/[id]` — 사진 넘겨보기, 편지 전문
- **관리** `/admin` — 새 기록 쓰기, 기록 수정/삭제, 약속 관리, 설정(애칭·사귄 날), 로그아웃
  - `/admin/write`, `/admin/m/[id]/edit`

## 처음 설정

### 1. Supabase
1. 새 프로젝트 생성 (리전: Seoul 권장)
2. **SQL Editor**에 `supabase/schema.sql` 전체를 붙여넣고 실행 → 테이블·RLS·비공개 `twoh-photos` 버킷 생성 (모든 테이블·정책은 `twoh_` 접두사)
3. **Authentication → Users → Add user**로 계정 생성: 이메일 칸에 `아이디@twoh.example.com` (Auto Confirm 체크) → 로그인 화면에서는 아이디만 입력
4. **Authentication → Sign In / Providers**에서 **Allow new users to sign up 끄기** ← 나 말고는 가입 불가
5. **Project Settings → API Keys**에서 URL과 Publishable key 복사

### 2. 로컬 실행
```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```

### 3. Vercel 배포
1. GitHub에 push → Vercel에서 Import
2. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 추가
3. 배포 후 휴대폰에서 접속 → 홈 화면에 추가

## 메모
- 사진은 업로드 시 브라우저에서 가운데 기준 정사각형 1000×1000 JPEG(+400×400 썸네일)로 잘라 저장됩니다. 원본은 폰/클라우드에 보관하세요.
- 사진은 비공개 버킷에 저장되고, 서버에서 6시간짜리 서명 URL로만 보여줍니다.
- 아이콘 다시 만들기: `node scripts/make-icons.mjs`
- 앱 이름 변경: `src/lib/config.ts`
