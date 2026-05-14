/**
 * After `next build` with `output: 'standalone'`, copy assets Next omits from
 * `.next/standalone` so `pnpm start:standalone` matches the Docker image layout.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const standalone = path.join(root, '.next', 'standalone')

if (!fs.existsSync(standalone)) {
	console.warn('[prepare-standalone] Skip: .next/standalone not found (build not run?).')
	process.exit(0)
}

function copyDir(src, dest) {
	if (!fs.existsSync(src)) return
	fs.mkdirSync(path.dirname(dest), { recursive: true })
	fs.cpSync(src, dest, { recursive: true })
}

const publicSrc = path.join(root, 'public')
if (fs.existsSync(publicSrc)) {
	copyDir(publicSrc, path.join(standalone, 'public'))
}

const staticSrc = path.join(root, '.next', 'static')
if (fs.existsSync(staticSrc)) {
	fs.mkdirSync(path.join(standalone, '.next'), { recursive: true })
	fs.cpSync(staticSrc, path.join(standalone, '.next', 'static'), { recursive: true })
}
