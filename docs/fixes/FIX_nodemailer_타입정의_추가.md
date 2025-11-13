# Fix: nodemailer 타입 정의 추가

## 날짜
2025-01-13

## 문제
Vercel 빌드 시 `nodemailer` 모듈의 TypeScript 타입 정의가 없어 빌드 실패:
```
Type error: Could not find a declaration file for module 'nodemailer'.
Try `npm i --save-dev @types/nodemailer` if it exists
```

## 원인
- `nodemailer` 패키지를 `dependencies`에 추가했으나, TypeScript 타입 정의 패키지(`@types/nodemailer`)를 설치하지 않음
- 로컬 개발 환경에서는 경고만 발생했지만, Vercel 빌드 시 strict 모드로 인해 에러 발생

## 해결 방법
`frontend/package.json`의 `devDependencies`에 `@types/nodemailer` 추가:

```json
{
  "devDependencies": {
    "@types/nodemailer": "^6.4.17",
    ...
  }
}
```

## 영향 범위
- `frontend/src/app/api/contact/route.ts`: nodemailer import 시 타입 정의 제공
- Vercel 빌드: TypeScript 컴파일 성공

## 테스트
1. 로컬 빌드: `npm run build` 성공 확인
2. Vercel 배포: 빌드 성공 및 배포 완료 확인
3. 문의 폼 테스트: 메일 전송 정상 작동 확인

## 관련 파일
- `frontend/package.json`
- `frontend/src/app/api/contact/route.ts`

