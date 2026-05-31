import Link from 'next/link'

const EFFECTIVE_DATE = '2026년 5월 31일'

const sections = [
  {
    title: '제1조 (목적)',
    content: `본 약관은 SignalFlow(이하 "서비스")가 제공하는 주식 단타 매매 보조 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무를 규정함을 목적으로 합니다.`,
  },
  {
    title: '제2조 (정의)',
    items: [
      '"서비스"란 SignalFlow가 운영하는 웹 플랫폼 및 관련 제반 서비스를 의미합니다.',
      '"이용자"란 본 약관에 동의하고 서비스를 이용하는 모든 회원을 의미합니다.',
      '"추천 정보"란 서비스가 AI 분석 및 데이터를 기반으로 제공하는 종목, 가격, 전략 등의 참고 정보를 의미합니다.',
    ],
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    items: [
      '본 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다.',
      '서비스는 필요 시 약관을 변경할 수 있으며, 변경 시 적용 일자와 변경 사유를 7일 전 공지합니다.',
      '이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.',
    ],
  },
  {
    title: '제4조 (서비스 이용 조건)',
    items: [
      '서비스는 Google OAuth를 통한 로그인 후 이용 가능합니다.',
      '이용자는 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.',
      '서비스는 만 19세 이상 성인을 대상으로 합니다.',
      '이용자는 관련 법령 및 본 약관의 규정을 준수해야 합니다.',
    ],
  },
  {
    title: '제5조 (투자 정보 면책 고지)',
    highlight: true,
    items: [
      'SignalFlow가 제공하는 모든 추천 종목, 진입가, 손절가, 목표가 등의 정보는 투자 참고용 정보일 뿐이며, 투자 권유 또는 투자 자문에 해당하지 않습니다.',
      '서비스는 「자본시장과 금융투자업에 관한 법률」상 투자자문업자 또는 투자일임업자가 아닙니다.',
      '주식 투자에는 원금 손실 위험이 있으며, 투자로 인한 모든 손익의 책임은 전적으로 이용자 본인에게 있습니다.',
      '과거의 추천 성과가 미래의 수익을 보장하지 않습니다.',
      '서비스는 제공 정보의 정확성·완전성을 보증하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.',
    ],
  },
  {
    title: '제6조 (서비스의 제공 및 변경)',
    items: [
      '서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검·장애·천재지변 등의 사유로 일시 중단될 수 있습니다.',
      '서비스는 운영상 또는 기술적 필요에 따라 서비스 내용을 변경할 수 있습니다.',
      '서비스 변경 또는 중단 시 사전에 공지하며, 불가피한 경우 사후 통보할 수 있습니다.',
    ],
  },
  {
    title: '제7조 (개인정보 보호)',
    items: [
      '서비스는 이용자의 개인정보를 「개인정보 보호법」 등 관련 법령에 따라 보호합니다.',
      '수집하는 개인정보: 이름, 이메일 주소, 프로필 사진 (Google 로그인 제공 정보)',
      '수집 목적: 회원 식별, 서비스 제공, 보안 관리',
      '보유 기간: 회원 탈퇴 시까지 (관련 법령에 따른 보존 기간은 별도 적용)',
      '이용자는 언제든지 개인정보 열람·수정·삭제를 요청할 수 있습니다.',
    ],
  },
  {
    title: '제8조 (이용자의 의무)',
    items: [
      '이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다.',
      '서비스의 정보를 무단으로 수집·복제·배포하는 행위',
      '서비스 시스템에 부하를 주거나 정상적 운영을 방해하는 행위',
      '타인의 명예를 훼손하거나 불이익을 주는 행위',
      '기타 관련 법령에 위배되는 행위',
    ],
  },
  {
    title: '제9조 (서비스 이용 제한)',
    content: `이용자가 본 약관을 위반하거나 서비스의 정상적 운영을 방해한 경우, 서비스는 사전 통보 없이 해당 이용자의 접근을 제한하거나 이용 계약을 해지할 수 있습니다.`,
  },
  {
    title: '제10조 (책임의 한계)',
    items: [
      '서비스는 이용자 간 또는 이용자와 제3자 간의 분쟁에 개입하지 않으며, 이에 따른 손해를 배상할 책임이 없습니다.',
      '서비스는 무료로 제공되는 정보에 대해 특별한 사정이 없는 한 손해를 배상하지 않습니다.',
      '서비스는 이용자의 귀책 사유로 인한 이용 장애에 대해 책임을 지지 않습니다.',
    ],
  },
  {
    title: '제11조 (준거법 및 관할)',
    content: `본 약관의 해석 및 분쟁 해결은 대한민국 법률에 따르며, 분쟁 발생 시 서울중앙지방법원을 전속 관할 법원으로 합니다.`,
  },
]

export default function TermsPage() {
  return (
    <div className="space-y-8 pb-16">
      {/* 헤더 */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Legal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">서비스 이용약관</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">시행일: {EFFECTIVE_DATE}</p>
      </div>

      {/* 투자 면책 배너 */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4">
        <p className="text-xs font-semibold tracking-widest text-red-400 uppercase">투자 위험 고지</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          본 서비스는 <strong className="text-foreground">투자 참고용 정보</strong>만을 제공합니다.
          주식 투자에는 원금 손실 위험이 있으며,{' '}
          <strong className="text-foreground">모든 투자 결정과 손익에 대한 책임은 이용자 본인</strong>에게 있습니다.
        </p>
      </div>

      {/* 약관 본문 */}
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2
              className={`mb-3 text-sm font-bold ${
                section.highlight ? 'text-red-400' : 'text-foreground'
              }`}
            >
              {section.title}
            </h2>
            <div
              className={`rounded-xl border px-5 py-4 ${
                section.highlight
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-border bg-card'
              }`}
            >
              {section.content && (
                <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
              )}
              {section.items && (
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50">
                        {i + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* 문의 */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">문의</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          약관에 관한 문의사항은 서비스 내 문의 채널을 통해 연락해 주세요.
        </p>
      </div>

      {/* 뒤로가기 */}
      <div className="flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          개인정보 처리방침
        </Link>
        <span className="text-border">|</span>
        <Link href="/login" className="transition-colors hover:text-foreground">
          ← 로그인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
