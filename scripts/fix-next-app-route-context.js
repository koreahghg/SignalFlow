// Next.js 16에서 app-route/vendored/contexts/ 디렉토리가 없어서
// Turbopack이 API 라우트 빌드 시 각종 컨텍스트 파일을 찾지 못하는 문제를 수정.
// app-page/vendored/contexts/ 의 모든 .js 파일을 app-route로 복사.
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'node_modules/next/dist/server/route-modules/app-page/vendored/contexts')
const dest = path.join(__dirname, '..', 'node_modules/next/dist/server/route-modules/app-route/vendored/contexts')

fs.mkdirSync(dest, { recursive: true })

const files = fs.readdirSync(src)
for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file))
}
console.log(`✔ Copied ${files.length} files to app-route/vendored/contexts/`)
