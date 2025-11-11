-- 와이어프레임 테이블 생성
create table if not exists wireframes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  version int not null default 1,
  spec jsonb not null,
  created_at timestamptz not null default now(),
  
  -- 인덱스
  constraint wireframes_project_version_unique unique (project_id, version)
);

-- 인덱스 추가
create index if not exists wireframes_project_id_idx on wireframes(project_id);
create index if not exists wireframes_version_idx on wireframes(version desc);
create index if not exists wireframes_created_at_idx on wireframes(created_at desc);

-- RLS 활성화
alter table wireframes enable row level security;

-- RLS 정책: 자신의 프로젝트 와이어프레임만 조회/수정 가능
create policy "Users can view own project wireframes"
  on wireframes for select
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can insert own project wireframes"
  on wireframes for insert
  with check (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can update own project wireframes"
  on wireframes for update
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can delete own project wireframes"
  on wireframes for delete
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

-- 코멘트 추가
comment on table wireframes is '프로젝트 와이어프레임 (로파이)';
comment on column wireframes.project_id is '프로젝트 ID';
comment on column wireframes.version is '와이어프레임 버전 (1부터 시작)';
comment on column wireframes.spec is '와이어프레임 JSON 스펙 (WireframeSpec)';
comment on column wireframes.created_at is '생성 일시';

