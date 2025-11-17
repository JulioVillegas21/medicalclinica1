# Configuración de Resend para Envío de Emails

## Resumen
Este documento describe cómo está configurado el envío de emails usando la integración de Resend en Replit.

## Integración Configurada
- **Servicio:** Resend (https://resend.com)
- **ID de Integración:** `connector:ccfg_resend_01K69QKYK789WN202XSE3QS17V`
- **ID de Conexión:** `connection:conn_resend_01KA2W5RD9DYQPJ59E7YW908H4`
- **Estado:** ✅ Conectado y funcionando

## Qué hace esta integración
- Gestiona automáticamente la API key de Resend
- Rota las credenciales de forma segura
- Proporciona el email de origen configurado (from email)
- No requiere variables de entorno manuales

## Código Implementado

### Archivo: `server/email.ts`

El archivo contiene dos funciones principales:

1. **`getCredentials()`** - Obtiene las credenciales de Resend desde la integración de Replit
2. **`getUncachableResendClient()`** - Crea un nuevo cliente de Resend (sin caché, importante para credenciales que rotan)
3. **`sendAppointmentConfirmation()`** - Envía el email de confirmación de cita

### Implementación clave:

```typescript
async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  // Intenta obtener desde Replit Connectors
  if (xReplitToken && hostname) {
    try {
      connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      if (connectionSettings && connectionSettings.settings.api_key) {
        return {
          apiKey: connectionSettings.settings.api_key,
          fromEmail: 'noreply@medicalclinica.online' // Dominio verificado
        };
      }
    } catch (error) {
      console.log('⚠️ No se pudo obtener desde Replit Connectors');
    }
  }
  
  // Fallback: usar la API key directa de los secretos
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: 'noreply@medicalclinica.online' // Dominio verificado
    };
  }

  throw new Error('No Resend credentials found');
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}
```

## Cómo usar

### En el código:
```typescript
// Obtener cliente y enviar email
const { client, fromEmail } = await getUncachableResendClient();

const { data, error } = await client.emails.send({
  from: fromEmail, // Siempre será 'noreply@medicalclinica.online'
  to: 'destinatario@ejemplo.com',
  subject: 'Asunto del email',
  html: '<h1>Contenido HTML</h1>',
});
```

## Cómo reconfigurar si es necesario

### Opción 1: Usar la integración existente
Si ya está configurada (como ahora), no necesitas hacer nada. El código automáticamente usará las credenciales.

### Opción 2: Reconfigurar desde cero
Si necesitas reconectar Resend:

1. **Buscar la integración:**
   - Usa el tool `search_integrations` con query "resend"
   
2. **Configurar la integración:**
   - Usa el tool `use_integration` con:
     - `integration_id`: "connector:ccfg_resend_01K69QKYK789WN202XSE3QS17V"
     - `operation`: "propose_setting_up"
   
3. **Seguir el prompt** que aparece para conectar tu cuenta de Resend

4. **Verificar la conexión:**
   - Crea una cita de prueba
   - Revisa los logs del servidor para ver el proceso de envío

## Verificar que funciona

### 1. Revisar los logs del servidor
Cuando se crea una cita, deberías ver logs como:

```
🔄 Iniciando envío de email a: paciente@ejemplo.com
✓ Cliente de Resend obtenido exitosamente
📧 Email de origen: noreply@medicalclinica.online
📤 Enviando email con los siguientes datos:
   De: noreply@medicalclinica.online
   Para: paciente@ejemplo.com
   Asunto: ✓ Confirmación de Cita - Dr. Juan Pérez
✅ Email enviado exitosamente!
   ID del email: abc123...
   Destinatario: paciente@ejemplo.com
```

### 2. Si hay errores
Los logs mostrarán el error específico:

```
❌ Error de Resend al enviar email: { ... }
   Detalles del error: ...
```

## Problemas comunes y soluciones

### Error: "Resend not connected"
- **Causa:** La integración no está configurada
- **Solución:** Seguir los pasos de "Opción 2: Reconfigurar desde cero"

### Error: "onboarding@resend.dev only works with certain emails"
- **Causa:** Usando el email de prueba de Resend
- **Solución:** ✅ Ya resuelto - El sistema usa `noreply@medicalclinica.online` (dominio verificado)

### Email no llega al destinatario
- **Verificar:** Los logs del servidor para ver si hay errores
- **Verificar:** La bandeja de spam del destinatario
- **Verificar:** Que el email de origen está verificado en Resend

## Configurar un dominio personalizado

✅ **Ya configurado:** `medicalclinica.online`

El dominio `medicalclinica.online` ya está verificado y configurado en el código.

Para usar un dominio diferente:

1. Ir a https://resend.com/domains
2. Agregar tu dominio
3. Configurar los registros DNS (SPF, DKIM, etc.)
4. Verificar el dominio
5. Actualizar el código en `server/email.ts` para usar tu dominio en lugar de `noreply@medicalclinica.online`

## Estructura del email enviado

El email de confirmación de cita incluye:

- **Header:** Con gradiente morado y título "Cita Confirmada"
- **Saludo personalizado:** Con el nombre del paciente
- **Detalles de la cita:**
  - Nombre del paciente
  - DNI
  - Doctor/a
  - Fecha (formato largo en español)
  - Hora
  - Motivo de consulta
  - Estado (Pendiente/Confirmada)
- **Código de confirmación:** Primeros 8 caracteres del ID en mayúsculas
- **Información importante:** Recordatorios para el paciente
- **Footer:** Datos de contacto de la clínica

## Dependencias necesarias

```json
{
  "resend": "^4.0.0"
}
```

Ya instalado en el proyecto.

## Notas importantes

⚠️ **NUNCA cachear el cliente de Resend** - Las credenciales pueden rotar, siempre usar `getUncachableResendClient()`

✅ **Logs detallados** - El código incluye logs extensivos para facilitar el debugging

🔒 **Seguridad** - Las API keys se gestionan automáticamente por Replit, nunca se hardcodean en el código

---

**Última actualización:** Noviembre 16, 2025
**Configurado por:** Replit Agent
**Estado:** ✅ Funcionando con dominio verificado `medicalclinica.online`
**Email de envío:** `noreply@medicalclinica.online`
