# Reclamaciones: actualización técnica del 3 de noviembre de 2026

## Alcance

El sitio sigue siendo un canal de atención. La identidad legal del proveedor no está confirmada; el sitio y las copias lo indican. Esta publicación no afirma habilitación ni cumplimiento integral del Libro de Reclamaciones formal.

- Registro separado en la pestaña `RegistroReclamaciones` del mismo archivo existente, sin migrar ni borrar registros anteriores.
- Número de atención AT-000001 y código UUID estable. La secuencia se reserva bajo bloqueo; un fallo antes de guardar puede dejar un salto, pero nunca reutiliza un número reservado. No se presenta como numeración formal de hojas.
- La confirmación exige `ok:true`, `saved:true`, el mismo ID y el registro almacenado, con fecha original del servidor.
- La repetición manual del mismo envío usa el mismo ID y datos. El almacén devuelve el registro original sin insertar otra fila; datos distintos con el mismo ID se rechazan.
- La copia descargable distingue registro confirmado de intento pendiente. Incluye recepción en hora de Perú y sección de atención del proveedor pendiente.
- El navegador guarda únicamente código, hora y estado en la sesión, nunca identidad ni contenido del reclamo. Tras recargar no se reenvía automáticamente.
- No se configura correo automático ni se solicita un permiso nuevo de Google. La interfaz lo informa. La respuesta de fondo del proveedor sigue pendiente del seguimiento operativo.

## Apps Script

Proyecto existente: `1wLf2nhxFL4WhcvVviSuOMop60qXI_DkcF0O1VYtHj4vDsoDo18pYDrAk`.
Se conserva la URL de implementación existente. El código de producción anterior (versión 3, 16 de octubre) fue respaldado y comparado antes de cambiarlo.

El código de leads del repositorio contiene mejoras anteriores de deduplicación que NO estaban desplegadas en producción. Para no cambiar el flujo comercial, en producción solo se añadió la rama `if (data.source === 'reclamaciones') return saveComplaint(data);`, el resultado de salud en `doGet` y el contenido de `Complaints.gs`. El resto del manejador comercial activo se conservó idéntico. El archivo `Code.gs` del repositorio conserva sus mejoras pendientes y recibe la misma rama exclusiva.

Desplegar primero Apps Script e inicializar `prepareComplaintStore()` sin crear reclamos. Comprobar `doGet().complaints` con versión 1 y `ready:true`; después publicar Next.js. No activar el reintento web contra la versión antigua.

## Validación

`node --test tests/*.test.mjs` y `npm run build`.
Todas las pruebas de guardado usan datos sintéticos y almacenamiento en memoria. No se envían reclamos a producción para probar. La visita pública solo verifica carga y validación de campos vacíos.

El proyecto no tiene un lint utilizable: su comando heredado `next lint` no está soportado por Next 16. No se declara un pase de lint.

## Pendiente para Libro formal

Confirmar razón social o nombres legales, RUC y domicilio; adaptar los datos del proveedor y hojas definitivas, habilitar y comprobar envío automático de copia con permisos aprobados, revisar numeración formal y proceso de respuestas/conservación. No sustituir estas comprobaciones por cambiar el título de la página.

## Resultado de publicación del backend

La implementación existente quedó en versión 5 el 3 de noviembre de 2026. El endpoint de salud confirmó `{version:1,ready:true}`. La pestaña anterior `Reclamaciones` era una vista de Leads y se conservó íntegra; se usó `RegistroReclamaciones` para no sobrescribirla. Se verificaron los siete encabezados y ausencia de datos de prueba. El archivo conserva permisos solo de su propietario.
