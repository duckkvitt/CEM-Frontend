import { promises as fs } from 'fs'
import path from 'path'

interface BuildContextOptions {
  origin?: string
}

export async function buildSiteContext(options: BuildContextOptions = {}): Promise<string> {
  const projectRoot = process.cwd()
  const appDir = path.join(projectRoot, 'Frontend', 'CEM-Frontend', 'app')
  const libDir = path.join(projectRoot, 'Frontend', 'CEM-Frontend', 'lib')

  // Resolve base URLs without hardcoding: use request origin and optional prod env
  const devBaseUrl = options.origin || ''
  const prodBaseEnv = process.env.NEXT_PUBLIC_PROD_BASE_URL || process.env.VERCEL_URL || ''
  const prodBaseUrl = prodBaseEnv ? (prodBaseEnv.startsWith('http') ? prodBaseEnv : `https://${prodBaseEnv}`) : ''

  const routes = await collectRoutes(appDir)
  const services = await summarizeServices(libDir)

  const lines: string[] = []
  lines.push('CEM Application Knowledge Base (auto-generated at runtime)')
  if (devBaseUrl || prodBaseUrl) {
    lines.push('Base URLs:')
    if (devBaseUrl) lines.push(`- Development: ${devBaseUrl}`)
    if (prodBaseUrl) lines.push(`- Production: ${prodBaseUrl}`)
  }
  lines.push('Sitemap:')
  for (const route of routes) {
    const devLink = devBaseUrl ? `${devBaseUrl}${route}` : route
    const prodLink = prodBaseUrl ? `${prodBaseUrl}${route}` : ''
    lines.push(`- ${route}${prodLink ? ` (dev: ${devLink} | prod: ${prodLink})` : ` (dev: ${devLink})`}`)
  }
  lines.push('Key Features and Services:')
  for (const s of services) {
    lines.push(`- ${s}`)
  }

  return lines.join('\n')
}

async function collectRoutes(appDir: string): Promise<string[]> {
  const routes: string[] = []
  try {
    const files = await walk(appDir)
    const pageFiles = files.filter(f => f.endsWith(`${path.sep}page.tsx`))
    for (const full of pageFiles) {
      const rel = full.substring(appDir.length).replace(/\\/g, '/') // normalize
      let route = rel.replace(/\/page\.tsx$/, '')
      route = route === '' ? '/' : route
      // Convert filesystem segments to URL segments
      route = route
        .replace(/\/(layout|components)(\/|$)/g, '/')
        .replace(/\/$/, '')
      if (!route.startsWith('/')) route = '/' + route
      routes.push(route)
    }
    // Deduplicate and sort by length then alpha for readability
    return Array.from(new Set(routes)).sort((a, b) => a.length - b.length || a.localeCompare(b))
  } catch {
    return []
  }
}

async function summarizeServices(libDir: string): Promise<string[]> {
  const summaries: string[] = []
  try {
    const files = await walk(libDir)
    const serviceFiles = files.filter(f => /service(?!-worker)\.ts$/.test(f) || /-service\.ts$/.test(f))
    for (const full of serviceFiles) {
      const rel = full.substring(libDir.length).replace(/\\/g, '/')
      const content = await safeRead(full)
      const exports = Array.from(content.matchAll(/export\s+(async\s+)?function\s+(\w+)/g)).map(m => m[2])
      const title = rel.replace(/^\//, '')
      if (exports.length > 0) summaries.push(`${title}: ${exports.join(', ')}`)
      else summaries.push(title)
    }
  } catch {}
  return summaries
}

async function walk(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(dirents.map(async (d) => {
    const res = path.resolve(dir, d.name)
    if (d.isDirectory()) return walk(res)
    return [res]
  }))
  return files.flat()
}

async function safeRead(file: string): Promise<string> {
  try { return await fs.readFile(file, 'utf8') } catch { return '' }
}


