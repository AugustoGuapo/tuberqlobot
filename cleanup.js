#!/usr/bin/env node
/**
 * Cleanup script for temporary yt-dlp files
 * Run with: npm run cleanup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧹 Limpiando archivos temporales...\n');

// 1. Limpiar player-script files en el directorio actual
const currentDir = process.cwd();
const playerScripts = fs.readdirSync(currentDir).filter(f => f.includes('player-script'));

playerScripts.forEach(file => {
  try {
    fs.unlinkSync(path.join(currentDir, file));
    console.log(`✓ Eliminado: ${file}`);
  } catch (err) {
    console.log(`✗ Error al eliminar ${file}: ${err.message}`);
  }
});

// 2. Limpiar cache de tuberqlobot en temp
const tempCacheDir = path.join(os.tmpdir(), 'tuberqlobot-cache');
if (fs.existsSync(tempCacheDir)) {
  try {
    fs.rmSync(tempCacheDir, { recursive: true, force: true });
    console.log(`✓ Directorio de caché limpiado: ${tempCacheDir}`);
  } catch (err) {
    console.log(`✗ Error al limpiar caché: ${err.message}`);
  }
}

// 3. Limpiar archivos .tmp
const tmpFiles = fs.readdirSync(currentDir).filter(f => f.endsWith('.tmp'));
tmpFiles.forEach(file => {
  try {
    fs.unlinkSync(path.join(currentDir, file));
    console.log(`✓ Eliminado: ${file}`);
  } catch (err) {
    console.log(`✗ Error al eliminar ${file}: ${err.message}`);
  }
});

console.log('\n✅ Limpieza completada');
