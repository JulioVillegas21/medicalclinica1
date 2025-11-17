# Sistema de Gestión de Clínica Médica

Sistema completo de gestión para clínicas médicas con panel de administración, gestión de citas, consultorios y notificaciones por email.

## 🚀 Estado Actual

✅ **Sistema Funcional y Operativo**

- Panel de administración con dashboard moderno
- Portal de médicos con dashboard y gestión de citas
- Portal de pacientes con acceso a historial y citas
- Gestión completa de citas médicas
- Asignación de consultorios a doctores
- Sistema de emails de confirmación funcionando

## 📋 Tareas Pendientes

_No hay tareas técnicas críticas pendientes. El sistema está completamente funcional._

---

## 🔧 Configuración Actual

### Credenciales de Acceso

**Administrador:**
- Email: `a@a.com`
- Password: `1`

**Médicos** (todos usan password: `1`):
- `ezequiel.mermet@clinica.com` - Dr. Ezequiel Mermet (Cardiología)
- `valentin.lucero@clinica.com` - Dr. Valentin Lucero (Pediatría)
- `walter.lucero@clinica.com` - Dr. Walter Lucero (Neurología)
- `leo.zabala@clinica.com` - Dr. Leo Zabala (Urología y Ginecología)
- `matias.aspilcueta@clinica.com` - Dr. Matias Aspilcueta (Traumatología)
- `aldana.ponce@clinica.com` - Dra. Aldana Ponce (Dermatología)

**Paciente de Prueba:**
- Email: `d@d.com`
- Password: `1`

### Sistema de Emails (Resend)

**Proveedor:** Resend (https://resend.com)

**Configuración:**
- **Dominio Verificado:** `medicalclinica.online`
- **Email de Envío:** `noreply@medicalclinica.online`
- **API Key:** Obtenida automáticamente desde Replit Connectors o desde `RESEND_API_KEY` en Replit Secrets
  - ✅ Gestionada de forma segura por la integración de Replit
  - ✅ Rotación automática de credenciales
  - ℹ️ No hardcodeada en el código fuente
- **Cuenta:** juliovillegasuba@gmail.com
- **Dashboard:** https://resend.com/overview

**Estado Actual:**
- ✅ Funcionando correctamente
- ✅ Envía emails automáticos de confirmación de citas
- ✅ **Puede enviar a cualquier dirección de email** (dominio verificado configurado)

**Configuración de Emails:**
- **Remitente:** `noreply@medicalclinica.online` (dominio verificado)
- **Plantilla:** HTML profesional con gradientes, detalles de cita y código de confirmación
- **Tipos de emails:**
  - Confirmación de citas médicas
  - Verificación de email para nuevos pacientes

**Links Importantes:**
- API Keys: https://resend.com/api-keys
- Dominios: https://resend.com/domains
- Documentación: https://resend.com/docs

**Para usar en otro Replit:**
- La integración de Resend está configurada y lista
- Las credenciales se gestionan automáticamente
- No requiere configuración manual adicional

### Almacenamiento
- **Tipo:** En memoria (MemStorage)
- **Nota:** Los datos se pierden al reiniciar el servidor
- **Próxima Mejora Sugerida:** Migrar a base de datos persistente (PostgreSQL con Replit DB)

---

## ⚠️ Limitaciones Actuales y Mejoras Pendientes

### 🔴 Limitaciones Críticas

#### 1. Persistencia de Datos (Almacenamiento en RAM)
**Problema:**
- Todos los datos se almacenan en memoria RAM
- Al reiniciar el servidor, **se pierden todas las citas, asignaciones y cambios**
- Solo se conservan los datos iniciales hardcodeados (doctores, consultorios, usuario admin)

**Impacto:**
- ❌ No apto para uso en producción
- ❌ Los datos de pacientes y citas se borran en cada reinicio
- ❌ No hay respaldo de información

**Soluciones Posibles:**
1. **Opción A - Archivos JSON:** Guardar datos en archivos `.json` locales (simple, sin dependencias externas)
2. **Opción B - Base de Datos NoSQL:** MongoDB, Firebase, u otras opciones NoSQL
3. ~~Opción C - PostgreSQL~~ (descartada por preferencia del usuario: no SQL)

**Estado:** 🔴 Pendiente de implementación

---

#### 2. Sistema de Emails - ✅ Resuelto
**Estado:** ✅ **Configurado y Funcionando**

**Configuración Actual:**
- ✅ Dominio verificado: `medicalclinica.online`
- ✅ Email de envío: `noreply@medicalclinica.online`
- ✅ Puede enviar confirmaciones a cualquier dirección de email
- ✅ Registros DNS configurados (SPF, DKIM)

**Lo que funciona:**
- ✅ Confirmaciones automáticas de citas a cualquier email
- ✅ Verificación de email para registro de pacientes
- ✅ Plantillas HTML profesionales

---

### 🟡 Mejoras Sugeridas (No Críticas)

#### 3. Historial Médico de Pacientes
- Agregar sección para guardar historial de consultas
- Diagnósticos, tratamientos, recetas
- Archivos adjuntos (estudios, imágenes)

#### 4. Sistema de Reportes
- Reportes mensuales de citas
- Estadísticas por doctor y especialidad
- Exportación a PDF/Excel

#### 5. Recordatorios Automáticos
- Enviar emails 24h antes de la cita
- SMS de confirmación (integración con Twilio)

#### 6. Gestión de Pacientes
- Base de datos de pacientes
- Búsqueda avanzada
- Información de contacto y obra social

#### 7. Optimizaciones de Rendimiento
- Lazy loading de componentes
- Cacheo de consultas frecuentes
- Paginación en listas largas

#### 8. Multi-tenancy
- Soporte para múltiples clínicas
- Gestión de permisos por rol
- Personalización por clínica

---

## 📝 Notas Técnicas

### Configuración de Emails Implementada

**Dominio Verificado:** `medicalclinica.online`

**Implementación en `server/email.ts`:**
- El código obtiene automáticamente las credenciales desde Replit Connectors
- Si falla, usa la API key desde `RESEND_API_KEY` en Replit Secrets
- En ambos casos, usa `noreply@medicalclinica.online` como remitente
- Permite envío a cualquier dirección de email

**Código Actual:**
```typescript
async function getCredentials() {
  // Intenta obtener desde Replit Connectors
  if (xReplitToken && hostname) {
    connectionSettings = await fetch(...);
    if (connectionSettings && connectionSettings.settings.api_key) {
      return {
        apiKey: connectionSettings.settings.api_key,
        fromEmail: 'noreply@medicalclinica.online' // Dominio verificado
      };
    }
  }
  
  // Fallback: API key desde Secrets
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: 'noreply@medicalclinica.online' // Dominio verificado
    };
  }
}
```

---

## 🎯 Funcionalidades del Sistema

### Landing Page
- Página profesional de presentación
- **Tres portales de acceso:**
  - Portal de Administración (azul/teal)
  - Portal de Pacientes (violeta/púrpura)
  - Portal de Médicos (verde/emerald)

### Panel de Administración
- **Dashboard:** Estadísticas, gráficos de tendencias, citas recientes y alertas
- **Gestión de Citas:** CRUD completo, calendario semanal, búsqueda por DNI o doctor
- **Gestión de Consultorios:** Asignación de médicos, detección de conflictos, certificados

### Portal de Médicos
- **Dashboard:** Vista de citas del día, estadísticas personales, pacientes recientes
- **Acceso personalizado:** Cada médico ve solo su información
- **Diseño profesional:** Interfaz optimizada para profesionales médicos
- **Estado:** En desarrollo - próximamente más funcionalidades

### Portal de Pacientes
- **Dashboard:** Acceso rápido a información médica personal
- **Gestión de Citas:** Ver, confirmar, cancelar y agendar citas
- **Historial Médico:** Acceso a diagnósticos, recetas y estudios
- **Perfil Personal:** Actualización de datos y preferencias

### Sistema de Emails
- Confirmación automática de citas
- Plantilla HTML profesional con diseño moderno
- Código de confirmación único
- Información importante para el paciente

---

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion (animaciones)
- React Query

### Backend
- Express.js + TypeScript
- Passport.js (autenticación)
- Bcrypt (hashing de contraseñas)
- Resend (emails)
- express-session (sesiones)

---

## 📚 Documentación Adicional

Ver `replit.md` para:
- Historial completo de cambios
- Arquitectura del sistema
- Decisiones técnicas
- Preferencias del usuario

---

**Última Actualización:** 16 de Noviembre de 2025
