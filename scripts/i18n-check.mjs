// Compare les clés des fichiers de traduction fr/en et signale les manques.
// Usage : node scripts/i18n-check.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = join(__dirname, '..', 'src', 'i18n', 'locales')

function flattenKeys(obj, prefix = '') {
  let keys = []
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

const languages = readdirSync(LOCALES_DIR).filter(f => !f.startsWith('.'))
if (languages.length < 2) {
  console.log('Une seule langue trouvée, rien à comparer.')
  process.exit(0)
}

const [base, ...others] = languages
const baseFiles = readdirSync(join(LOCALES_DIR, base)).filter(f => f.endsWith('.json'))

let hasIssues = false

for (const file of baseFiles) {
  const baseKeys = new Set(flattenKeys(JSON.parse(readFileSync(join(LOCALES_DIR, base, file), 'utf8'))))
  for (const lang of others) {
    const path = join(LOCALES_DIR, lang, file)
    let langKeys
    try {
      langKeys = new Set(flattenKeys(JSON.parse(readFileSync(path, 'utf8'))))
    } catch {
      console.log(`✕ [${lang}/${file}] fichier manquant`)
      hasIssues = true
      continue
    }
    const missingInLang = [...baseKeys].filter(k => !langKeys.has(k))
    const missingInBase = [...langKeys].filter(k => !baseKeys.has(k))
    if (missingInLang.length > 0) {
      hasIssues = true
      console.log(`✕ [${lang}/${file}] clés manquantes (présentes en ${base}) :`)
      for (const k of missingInLang) console.log(`    - ${k}`)
    }
    if (missingInBase.length > 0) {
      hasIssues = true
      console.log(`✕ [${base}/${file}] clés manquantes (présentes en ${lang}) :`)
      for (const k of missingInBase) console.log(`    - ${k}`)
    }
  }
}

if (!hasIssues) {
  console.log(`✓ Toutes les traductions (${languages.join(', ')}) sont synchronisées.`)
} else {
  process.exit(1)
}
