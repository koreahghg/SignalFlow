import Link from 'next/link'

const EFFECTIVE_DATE = '2026년 5월 31일'

export default function PrivacyPage() {
  return (
    <div className="space-y-8 pb-16">
      {/* 헤더 */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Legal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">개인정보 처리방침</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">시행일: {EFFECTIVE_DATE}</p>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        SignalFlow(이하 "서비스")는 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고 이와 관련한
        고충을 신속하게 처리하기 위해 다음과 같이 개인정보 처리방침을 수립·공개합니다.
      </p>

      {/* 1. 수집 항목 및 방법 */}
      <Section title="제1조 (수집하는 개인정보 항목 및 수집 방법)">
        <Table
          headers={['구분', '수집 항목', '수집 방법']}
          rows={[
            ['회원 가입', '이름, 이메일 주소, 프로필 사진', 'Google OAuth 2.0 로그인'],
            ['서비스 이용', '접속 일시, 서비스 이용 기록', '자동 수집'],
          ]}
        />
        <Note>서비스는 별도의 민감정보(주민등록번호, 금융정보 등)를 수집하지 않습니다.</Note>
      </Section>

      {/* 2. 수집 목적 */}
      <Section title="제2조 (개인정보 수집 및 이용 목적)">
        <Table
          headers={['목적', '이용 항목']}
          rows={[
            ['회원 식별 및 서비스 제공', '이름, 이메일 주소'],
            ['프로필 표시', '이름, 프로필 사진'],
            ['서비스 개선 및 통계 분석', '서비스 이용 기록'],
            ['부정 이용 방지 및 보안', '접속 일시, 이메일 주소'],
          ]}
        />
      </Section>

      {/* 3. 보유 기간 */}
      <Section title="제3조 (개인정보 보유 및 이용 기간)">
        <ul className="space-y-2">
          {[
            '원칙: 서비스 탈퇴 시 즉시 파기',
            '예외: 관련 법령에 따라 아래 기간 동안 보존',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Table
          headers={['법령', '보존 항목', '보존 기간']}
          rows={[
            ['전자상거래법', '계약·청약철회 기록', '5년'],
            ['전자상거래법', '소비자 불만·분쟁 처리 기록', '3년'],
            ['통신비밀보호법', '로그인 기록', '3개월'],
          ]}
          className="mt-3"
        />
      </Section>

      {/* 4. 제3자 제공 */}
      <Section title="제4조 (개인정보의 제3자 제공)">
        <p className="text-sm leading-relaxed text-muted-foreground">
          서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
        </p>
        <ul className="mt-3 space-y-2">
          {[
            '이용자가 사전에 동의한 경우',
            '법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 5. 처리 위탁 */}
      <Section title="제5조 (개인정보 처리 위탁)">
        <Table
          headers={['수탁 업체', '위탁 업무', '보유 기간']}
          rows={[
            ['Google LLC', 'OAuth 인증 처리', '회원 탈퇴 시'],
            ['Vercel Inc.', '서비스 호스팅 (프론트엔드)', '계약 종료 시'],
            ['Railway Technologies Inc.', '서비스 호스팅 (백엔드 API)', '계약 종료 시'],
            ['Supabase Inc.', '데이터베이스 호스팅', '계약 종료 시'],
          ]}
        />
      </Section>

      {/* 6. 파기 절차 및 방법 */}
      <Section title="제6조 (개인정보 파기 절차 및 방법)">
        <ul className="space-y-2">
          {[
            '파기 절차: 보유 기간 만료 또는 이용 목적 달성 후 지체 없이 파기합니다.',
            '파기 방법: 전자적 파일 형태는 복구·재생 불가능한 방법으로 영구 삭제하며, 종이 문서는 분쇄 또는 소각합니다.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 7. 이용자 권리 */}
      <Section title="제7조 (이용자 및 법정대리인의 권리·의무 및 행사 방법)">
        <ul className="space-y-2">
          {[
            '이용자는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.',
            '권리 행사는 서비스 내 계정 탈퇴 기능 또는 문의 채널을 통해 할 수 있습니다.',
            '이용자가 개인정보의 오류에 대한 정정을 요청한 경우, 정정 완료 전까지 해당 정보를 이용하지 않습니다.',
            '만 14세 미만 아동의 개인정보는 수집하지 않습니다.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 8. 쿠키 */}
      <Section title="제8조 (쿠키 사용)">
        <ul className="space-y-2">
          {[
            '서비스는 세션 유지를 위해 쿠키를 사용합니다.',
            '이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 9. 안전성 확보 조치 */}
      <Section title="제9조 (개인정보 안전성 확보 조치)">
        <ul className="space-y-2">
          {[
            '접근 통제: 개인정보 취급 담당자를 최소한으로 제한하고 접근 권한을 관리합니다.',
            '암호화: 개인정보는 암호화된 통신(HTTPS)을 통해 전송됩니다.',
            '세션 관리: 인증 토큰은 안전하게 관리되며 만료 시 자동 파기됩니다.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 10. 책임자 */}
      <Section title="제10조 (개인정보 보호책임자)">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">서비스명</span>: SignalFlow
            </li>
            <li>
              <span className="font-medium text-foreground">문의</span>: 서비스 내 문의 채널을 통해 접수
            </li>
          </ul>
        </div>
        <Note>
          개인정보 침해 관련 신고·상담은 개인정보보호위원회(privacy.go.kr, 국번 없이 182),
          한국인터넷진흥원(118)에 문의하실 수 있습니다.
        </Note>
      </Section>

      {/* 11. 변경 고지 */}
      <Section title="제11조 (처리방침 변경)">
        <p className="text-sm leading-relaxed text-muted-foreground">
          본 처리방침은 시행일로부터 적용되며, 내용이 변경될 경우 최소 7일 전에 서비스 내 공지사항을 통해
          안내드립니다. 중요한 변경 사항은 30일 전에 공지합니다.
        </p>
      </Section>

      {/* 하단 링크 */}
      <div className="flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
        <Link href="/terms" className="transition-colors hover:text-foreground">
          서비스 이용약관
        </Link>
        <span className="text-border">|</span>
        <Link href="/login" className="transition-colors hover:text-foreground">
          ← 로그인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Table({
  headers,
  rows,
  className,
}: {
  headers: string[]
  rows: string[][]
  className?: string
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-border ${className ?? ''}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i < rows.length - 1 ? 'border-b border-border' : ''}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}
