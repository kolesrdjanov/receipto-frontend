import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const iconsDir = join(publicDir, 'icons')

// Ensure icons directory exists
mkdirSync(iconsDir, { recursive: true })

const svgBuffer = readFileSync(join(iconsDir, 'icon.svg'))

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function generateIcons() {
  console.log('Generating PWA icons...')

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`))

    console.log(`  Created icon-${size}x${size}.png`)
  }

  // Generate favicon.ico (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'))

  console.log('  Created favicon.png')
  console.log('Done!')
}

generateIcons().catch(console.error)
