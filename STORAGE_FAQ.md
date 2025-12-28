# 📝 Gestión de Almacenamiento - Preguntas Frecuentes

## ¿Qué son los archivos `player-script.js`?

Son archivos temporales que crea `yt-dlp` para desencriptar videos de YouTube. **No son videos descargados**, son solo scripts de JavaScript pequeños (~5-50 KB cada uno).

## ¿Se descargan los videos completos?

**No.** El bot usa **streaming directo**:
- `yt-dlp` descarga solo el audio en tiempo real mientras se reproduce
- El audio fluye directamente a Discord sin guardarse en disco
- Se libera memoria conforme se consume

## ¿Por qué se acumulaban archivos?

En versiones anteriores, `yt-dlp` creaba estos archivos player-script en el directorio del proyecto. Ahora están configurados para:
1. **Guardarse en la carpeta temporal del sistema** (`%TEMP%\tuberqlobot-cache`)
2. **No crear `*.part` files** para descargas incompletas
3. **Ignorarse en git** (agregados a `.gitignore`)

## Comandos de Mantenimiento

### Limpiar archivos temporales
```bash
npm run cleanup
```

Esto elimina:
- Cualquier `*player-script.js` en el directorio actual
- La carpeta de caché en temp
- Archivos `.tmp`

### Limpiar manualmente
```powershell
# PowerShell
Remove-Item -Path "*player-script.js" -Force
Remove-Item -Path "$env:TEMP\tuberqlobot-cache" -Recurse -Force
```

## Consumo de Disco

- **Por canción**: 0-5 KB (solo metadatos temporales)
- **Total esperado**: < 100 MB con años de uso
- **Limpieza automática**: Disponible con `npm run cleanup`

## Banderas de yt-dlp Utilizadas

```
-f ba                    # Best audio format available
-o -                     # Stream to stdout (sin guardar archivo)
--cache-dir TMPDIR       # Use system temp for temporary files
--no-part                # No incomplete file markers
--progress-template noop # No progress output to reduce overhead
```

## ¿Qué hacer si la carpeta de caché crece?

Ejecuta periódicamente:
```bash
npm run cleanup
```

O configura una tarea automática del sistema operativo para ejecutarlo diariamente.
