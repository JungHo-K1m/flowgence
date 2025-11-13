## Changelog - 문의하기 이메일 전송 기능

### 날짜
2025-11-13

### 배경
- 기존 문의하기 페이지는 UI만 존재했고 실제 이메일 전송이나 검증 로직이 없어 테스트 불가
- 테스트용 메일(`qopqop55@naver.com`)로 문의가 수신되도록 기능 구현 필요

### 변경 사항
1. `route.ts`( `frontend/src/app/api/contact/route.ts` )
   - `POST /api/contact` API 추가
   - `zod`로 입력값 검증 및 Nodemailer 기반 SMTP 메일 발송 구현
   - 환경 변수(`CONTACT_TARGET_EMAIL`, `CONTACT_SMTP_HOST`, `CONTACT_SMTP_PORT`, `CONTACT_SMTP_USER`, `CONTACT_SMTP_PASS`, `CONTACT_SMTP_SECURE`, `CONTACT_FROM_EMAIL`)로 수신자/SMTP 설정 관리

2. `page.tsx`( `frontend/src/app/contact/page.tsx` )
   - 클라이언트 컴포넌트로 전환 및 `react-hook-form` + `zod` 적용
   - 제출 시 `/api/contact` 호출, 성공/실패 메시지 및 로딩 상태 표시
   - 필드별 검증 메시지 및 접근성 개선

3. `package.json`
   - Nodemailer 의존성 추가

### 환경 변수
```
CONTACT_TARGET_EMAIL=qopqop55@naver.com
CONTACT_FROM_EMAIL=Flowgence <no-reply@flowgence.ai>
CONTACT_SMTP_HOST=smtp.example.com
CONTACT_SMTP_PORT=587
CONTACT_SMTP_SECURE=false
CONTACT_SMTP_USER=your-smtp-user
CONTACT_SMTP_PASS=your-smtp-password
```

> 운영 전환 시 `CONTACT_TARGET_EMAIL`과 SMTP 자격 증명만 교체하면 됩니다.

### 테스트 시나리오
1. 정상 입력 후 제출 → 200 응답, 성공 메시지 노출 & 메일 수신 확인
2. 이메일 형식 오류/짧은 메시지 등 → 프론트 검증 에러 표시
3. SMTP 자격 증명 미설정 시 → 500 응답과 에러 메시지 확인
4. 네트워크/서버 오류 시 → 프론트에 재시도 안내표시


