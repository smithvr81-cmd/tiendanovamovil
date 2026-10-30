# Publicación social - Tienda Nova Móvil

Estado: preparación y lectura de Google Drive. **No publica automáticamente todavía**.

Origen: carpeta Videos Tienda Nova Móvil (ID 1djo0rGuSElpX6ntvFWd3Y4LMuylBbKgx).
Horario del workflow: 14:00 UTC (09:00 Perú).
WhatsApp de captación: https://wa.me/51935748390

## Única autorización necesaria para la fase de lectura
1. En Google Cloud, habilitar Drive API y crear una cuenta de servicio con clave JSON.
2. Compartir la carpeta de origen con el correo de esa cuenta de servicio como Lector.
3. En GitHub > Settings > Secrets and variables > Actions, crear un Repository secret llamado DRIVE_SERVICE_ACCOUNT_JSON con el contenido íntegro del JSON. No enviar el JSON por chat ni guardarlo en archivos del repositorio.
4. Ejecutar Actions > Nova Movil - Preparar publicaciones sociales > Run workflow.
5. Confirmar que el log muestra videos encontrados. Si la carpeta no tiene videos directamente, colocar un MP4 allí para la prueba.

## Pendiente para publicar
La lectura de Drive no autoriza publicar. Para cada red hay que configurar permisos OAuth y verificar el destino. Se debe probar primero con un video de prueba y evitar duplicados antes de activar publicaciones programadas. TikTok puede requerir revisión/aprobación de API. No compartir contraseñas ni tokens en el repositorio.
