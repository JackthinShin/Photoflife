#!/usr/bin/env node
/**
 * 生成 src/data/photos.generated.js
 * 扫描 public/photos 目录，自动提取图片，基于文件名/子目录生成基础元数据。
 */
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import exifr from 'exifr'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')
const photosDir = path.join(publicDir, 'photos')
const outFile = path.join(projectRoot, 'src', 'data', 'photos.generated.js')

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const exifExts = new Set(['.jpg', '.jpeg', '.webp']) // 这些更常见地携带 EXIF

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s./-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function prettifyName(name) {
  const base = name.replace(/[-_]+/g, ' ').trim()
  // 首字母大写
  return base.replace(/\b(\w)/g, (m) => m.toUpperCase())
}

async function walk(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...await walk(full))
    } else if (ent.isFile()) {
      if (exts.has(path.extname(ent.name).toLowerCase())) {
        out.push(full)
      }
    }
  }
  return out
}

function formatDateYYYYMM(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatShutter(exposureTime) {
  if (!exposureTime) return undefined
  // exposureTime 可能是小数，如 0.0025，格式化为 1/400s
  if (exposureTime >= 1) return `${Math.round(exposureTime)}s`
  const denom = Math.round(1 / exposureTime)
  return `1/${denom}s`
}

async function main() {
  try {
    await fs.mkdir(path.dirname(outFile), { recursive: true })
    // 若 photos 目录不存在，则生成空数组文件
    const exists = await fs
      .stat(photosDir)
      .then(() => true)
      .catch(() => false)

    let files = []
    if (exists) {
      files = await walk(photosDir)
    }

    const items = []
    for (const abs of files) {
  const relFromPublic = path.relative(publicDir, abs) // e.g. 'photos/album/img.jpg'
  const relPosix = toPosix(relFromPublic)

      const stat = await fs.stat(abs)
      let date = formatDateYYYYMM(stat.mtime)
      let takenAtISO
      let exif = {}

      const fromPhotos = relPosix.replace(/^photos\//, '')
      const parts = fromPhotos.split('/')
      const file = parts.pop()
      const album = parts.length ? parts[0] : ''
      const nameNoExt = file.replace(/\.[^.]+$/, '')

      const idBase = slugify((album ? album + '-' : '') + nameNoExt)
      const hashId = crypto.createHash('sha1').update(relPosix).digest('hex').slice(0, 10)
      const title = prettifyName(nameNoExt)

      const item = {
        id: idBase || `photo-${hashId}`,
        srcPath: relPosix,
        title,
      }
      if (album) item.album = prettifyName(album)
      // 解析 EXIF
      try {
        const ext = path.extname(abs).toLowerCase()
        if (exifExts.has(ext)) {
          const buf = await fs.readFile(abs)
          exif = await exifr.parse(buf, {
            pick: [
              'Make', 'Model', 'LensModel',
              'FocalLength', 'FocalLengthIn35mmFilm',
              'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'
            ]
          }) || {}
          if (exif.DateTimeOriginal instanceof Date) {
            takenAtISO = exif.DateTimeOriginal.toISOString()
            date = formatDateYYYYMM(exif.DateTimeOriginal)
          }
        }
      } catch (e) {
        // 忽略单张解析错误，输出到控制台便于排查
        console.warn('EXIF 解析失败:', relPosix, e?.message)
      }

      if (date) item.date = date
      if (takenAtISO) item.takenAt = takenAtISO
      const camera = [exif.Make, exif.Model].filter(Boolean).join(' ').trim()
      if (camera) item.camera = camera
      if (exif.LensModel) item.lens = exif.LensModel
      if (typeof exif.FocalLength === 'number') item.focalLength = exif.FocalLength
      if (typeof exif.FocalLengthIn35mmFilm === 'number') item.focalLength35mm = exif.FocalLengthIn35mmFilm
      if (typeof exif.FNumber === 'number') item.aperture = exif.FNumber
      if (typeof exif.ISO === 'number') item.iso = exif.ISO
      const shutter = formatShutter(exif.ExposureTime)
      if (shutter) item.shutter = shutter
      items.push(item)
    }

    // 时间降序（最近修改在前）
    // items 已有 date 字段字符串 YYYY-MM，不能精确到日；如果需要更精确排序可改为 mtimeMs 排序并额外存储。

  const banner = `// 本文件由 scripts/generate-photos.mjs 自动生成，请勿手改\n// 规则：扫描 public/photos 下的图片；子目录名作为相册 (album)；文件名转为标题\n`

  const code = `${banner}const rawBase = import.meta.env.BASE_URL || '/';\nconst base = rawBase.endsWith('/') ? rawBase : rawBase + '/';\nconst photos = [\n${items.map(formatItem).join(',\n')}\n]\n\nexport default photos\n`
    await fs.writeFile(outFile, code, 'utf8')

    // 同时生成一个轻量的占位导出（保证空目录时也不报错）
    console.log(`✅ 已生成 ${toPosix(path.relative(projectRoot, outFile))}，共 ${items.length} 张照片`)
  } catch (err) {
    console.error('❌ 生成照片数据失败:', err)
    process.exitCode = 1
  }
}

main()

function escapeString(input) {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/'/g, "\\'")
}

function formatItem(item) {
  const lines = ['  {']
  const writeProp = (key, value) => {
    lines.push(`    ${key}: ${value},`)
  }

  writeProp('id', `'${escapeString(item.id)}'`)
  writeProp('src', `base + '${escapeString(item.srcPath)}'`)
  writeProp('title', `'${escapeString(item.title)}'`)
  if (item.album) writeProp('album', `'${escapeString(item.album)}'`)
  if (item.date) writeProp('date', `'${escapeString(item.date)}'`)
  if (item.takenAt) writeProp('takenAt', `'${escapeString(item.takenAt)}'`)
  if (item.camera) writeProp('camera', `'${escapeString(item.camera)}'`)
  if (item.lens) writeProp('lens', `'${escapeString(item.lens)}'`)
  if (typeof item.focalLength === 'number') writeProp('focalLength', item.focalLength)
  if (typeof item.focalLength35mm === 'number') writeProp('focalLength35mm', item.focalLength35mm)
  if (typeof item.aperture === 'number') writeProp('aperture', item.aperture)
  if (typeof item.iso === 'number') writeProp('iso', item.iso)
  if (item.shutter) writeProp('shutter', `'${escapeString(item.shutter)}'`)
  lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '')
  lines.push('  }')
  return lines.join('\n')
}
