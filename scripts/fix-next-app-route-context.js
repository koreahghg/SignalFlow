// Next.js 16에서 app-route/vendored/contexts/ 디렉토리가 없어서
// Turbopack이 API 라우트 빌드 시 컨텍스트 파일을 찾지 못하는 문제를 수정.
// app-route/module.compiled.js는 vendored 프로퍼티가 없으므로
// 각 파일을 shared-runtime으로 직접 연결하는 스텁으로 생성.
const fs = require('fs')
const path = require('path')

const dest = path.join(__dirname, '..', 'node_modules/next/dist/server/route-modules/app-route/vendored/contexts')
fs.mkdirSync(dest, { recursive: true })

// path: contexts/ → ../../.. → server/ → ../../../../ → dist/ 기준 상대경로
const SHARED = '../../../../../shared/lib'

const stubs = {
  'app-router-context.js': `"use strict";\nmodule.exports = require('${SHARED}/app-router-context.shared-runtime');\n`,
  'head-manager-context.js': `"use strict";\nmodule.exports = require('${SHARED}/head-manager-context.shared-runtime');\n`,
  'hooks-client-context.js': `"use strict";\nmodule.exports = require('${SHARED}/hooks-client-context.shared-runtime');\n`,
  'image-config-context.js': `"use strict";\nmodule.exports = require('${SHARED}/image-config-context.shared-runtime');\n`,
  'router-context.js': `"use strict";\nmodule.exports = require('${SHARED}/router-context.shared-runtime');\n`,
  'server-inserted-html.js': `"use strict";\nmodule.exports = require('${SHARED}/server-inserted-html.shared-runtime');\n`,
}

// entrypoints.js는 app-page에서 복사 (이미 shared-runtime을 직접 참조함)
const appPageCtx = path.join(__dirname, '..', 'node_modules/next/dist/server/route-modules/app-page/vendored/contexts')
fs.copyFileSync(path.join(appPageCtx, 'entrypoints.js'), path.join(dest, 'entrypoints.js'))

for (const [file, content] of Object.entries(stubs)) {
  fs.writeFileSync(path.join(dest, file), content)
}

console.log(`✔ Created app-route/vendored/contexts/ stubs (${Object.keys(stubs).length + 1} files)`)
