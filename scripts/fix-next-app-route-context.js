// Next.js 16에서 app-route/vendored/contexts/ 디렉토리가 없어서
// Turbopack이 API 라우트 빌드 시 app-router-context.js를 찾지 못하는 문제를 수정.
// app-page의 동일 파일로 re-export.
const fs = require('fs')
const path = require('path')

const dir = path.join(
  __dirname,
  '..',
  'node_modules/next/dist/server/route-modules/app-route/vendored/contexts'
)
const file = path.join(dir, 'app-router-context.js')

if (!fs.existsSync(file)) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    file,
    `"use strict";\nmodule.exports = require("../../app-page/vendored/contexts/app-router-context");\n`
  )
  console.log('✔ Created missing app-route/vendored/contexts/app-router-context.js')
}
