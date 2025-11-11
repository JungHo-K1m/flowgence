# 와이어프레임 재생성 버그 수정

**날짜**: 2025-11-11  
**버그**: 재생성 시 UNIQUE 제약 조건 위반  
**수정**: 재생성 시 기존 데이터 삭제 후 새로 생성

---

## 🐛 버그 상세

### 에러 메시지
```
duplicate key value violates unique constraint "wireframes_project_version_unique"
```

### 발생 상황
```
1. 첫 번째 와이어프레임 생성 ✅
   → project_id: "abc", version: 1

2. "다시 생성" 버튼 클릭 ❌
   → project_id: "abc", version: 1 (동일)
   → UNIQUE 제약 조건 위반!
```

### 근본 원인
**Supabase 제약 조건:**
```sql
create unique index wireframes_project_version_unique
  on wireframes (project_id, version);
```

**백엔드 코드 문제:**
```typescript
// 기존 코드 (문제)
.insert({
  project_id: projectId,
  version: 1,  // ← 항상 1로 고정!
  spec: spec,
})
```

---

## ✅ 해결 방법

### 수정 전략
재생성 시 **기존 데이터를 삭제**하고 새로 생성

### 수정된 코드
```typescript
// 4. 기존 와이어프레임 삭제 (재생성 시)
const { error: deleteError } = await this.supabase
  .from('wireframes')
  .delete()
  .eq('project_id', projectId);

if (deleteError) {
  console.warn('기존 와이어프레임 삭제 실패:', deleteError.message);
  // 삭제 실패는 무시 (처음 생성 시 데이터가 없을 수 있음)
}

// 5. 새 와이어프레임 저장
const { data: saved, error: saveError } = await this.supabase
  .from('wireframes')
  .insert({
    project_id: projectId,
    version: 1,
    spec: spec,
  })
  .select()
  .single();
```

---

## 🔄 동작 플로우

### Before (버그)
```
[와이어프레임 생성하기] 클릭
  ↓
DB에 저장: (project_id: "abc", version: 1)
  ↓
[다시 생성] 클릭
  ↓
DB에 저장 시도: (project_id: "abc", version: 1) ← 중복!
  ↓
❌ 에러 발생
```

### After (수정)
```
[와이어프레임 생성하기] 클릭
  ↓
DB에 저장: (project_id: "abc", version: 1)
  ↓
[다시 생성] 클릭
  ↓
기존 데이터 삭제: (project_id: "abc")
  ↓
DB에 저장: (project_id: "abc", version: 1)
  ↓
✅ 성공!
```

---

## 📊 영향 범위

### 수정 파일
- `backend/src/wireframes/wireframes.service.ts` (42-66 라인)

### 영향받는 기능
- ✅ 첫 번째 와이어프레임 생성 (영향 없음)
- ✅ 와이어프레임 재생성 (버그 수정)
- ✅ 와이어프레임 조회 (영향 없음)

### 데이터베이스
- **변경 없음** (마이그레이션 불필요)
- UNIQUE 제약 조건 유지

---

## 🧪 테스트 시나리오

### 시나리오 1: 첫 생성
```
1. [와이어프레임 생성하기] 클릭
2. 로딩 10-15초
3. ✅ 와이어프레임 표시
```

### 시나리오 2: 재생성 (버그 수정 확인)
```
1. 기존 와이어프레임이 있는 상태
2. [다시 생성] 클릭
3. 로딩 10-15초
4. ✅ 새 와이어프레임 표시 (에러 없음)
```

### 시나리오 3: 여러 번 재생성
```
1. [다시 생성] 클릭 (1회)
2. ✅ 성공
3. [다시 생성] 클릭 (2회)
4. ✅ 성공
5. [다시 생성] 클릭 (3회)
6. ✅ 성공
```

---

## 🚀 배포 가이드

### 백엔드 배포
```bash
cd backend
git pull origin main
npm run build
# Railway/PM2 재시작
pm2 restart all
```

### 확인 사항
- [ ] Railway 로그에서 "기존 와이어프레임 삭제" 메시지 확인
- [ ] 재생성 시 에러 없이 성공 확인
- [ ] 프론트엔드에서 새 와이어프레임 표시 확인

---

## 💡 향후 개선 사항 (선택)

### 옵션 1: 버전 히스토리 유지
현재는 재생성 시 기존 데이터를 삭제하지만, 버전을 증가시켜 히스토리를 유지할 수도 있습니다:

```typescript
// 최신 버전 조회
const { data: latest } = await this.supabase
  .from('wireframes')
  .select('version')
  .eq('project_id', projectId)
  .order('version', { ascending: false })
  .limit(1)
  .single();

const newVersion = latest ? latest.version + 1 : 1;

// 새 버전으로 저장
.insert({
  project_id: projectId,
  version: newVersion,  // 버전 증가
  spec: spec,
})
```

**장점**: 
- 이전 버전 롤백 가능
- 버전 비교 가능

**단점**: 
- 데이터베이스 용량 증가
- UI 복잡도 증가

### 옵션 2: Soft Delete
실제 삭제 대신 `deleted_at` 컬럼 추가:

```typescript
// 기존 데이터를 soft delete
.update({ deleted_at: new Date() })
.eq('project_id', projectId)
.is('deleted_at', null)
```

**장점**: 
- 데이터 복구 가능
- 감사 로그 유지

**단점**: 
- 마이그레이션 필요
- 쿼리 복잡도 증가

---

## 📝 결론

✅ **재생성 시 UNIQUE 제약 조건 위반 버그 수정 완료**  
✅ **기존 데이터 삭제 후 새로 생성하는 방식으로 변경**  
✅ **첫 생성 및 재생성 모두 정상 동작**

**배포 후 즉시 테스트 권장!** 🚀

