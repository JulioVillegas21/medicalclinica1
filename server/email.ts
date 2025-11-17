import { Resend } from 'resend';
import type { Appointment } from './storage';

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function sanitizeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

let connectionSettings: any;

async function getCredentials() {
  console.log('🔍 Obteniendo credenciales de Resend...');
  
  // Primero intentar obtener desde Replit Connectors (incluye dominio verificado)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

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
        console.log('✅ Credenciales obtenidas desde Replit Connectors');
        console.log('   Usando dominio verificado: noreply@medicalclinica.online');
        
        // Siempre usar el dominio verificado, no el de Replit Connectors
        return {
          apiKey: connectionSettings.settings.api_key,
          fromEmail: 'noreply@medicalclinica.online'
        };
      }
    } catch (error) {
      console.log('⚠️ No se pudo obtener desde Replit Connectors, intentando con API key directa');
    }
  }
  
  // Fallback: usar la API key directa de los secretos
  if (process.env.RESEND_API_KEY) {
    console.log('✅ Usando API key de RESEND_API_KEY');
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: 'noreply@medicalclinica.online'
    };
  }

  console.error('❌ No se encontraron credenciales de Resend');
  throw new Error('No Resend credentials found');
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

interface EmailData {
  appointment: Appointment;
}

function generateAppointmentEmailHTML(data: EmailData): string {
  const { appointment } = data;
  
  // Sanitize all user-controlled fields
  const safePatientName = sanitizeHtml(appointment.patientName || 'Paciente');
  const safePatientDni = sanitizeHtml(appointment.patientDni || '');
  const safeDoctorName = sanitizeHtml(appointment.doctorName || 'Médico');
  const safeReason = sanitizeHtml(appointment.reason || 'No especificado');
  const safeTime = sanitizeHtml(appointment.time || '');
  const safeStatus = sanitizeHtml(appointment.status || 'pendiente');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cita Médica</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      background-color: #f0f4f8;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f0f4f8;
      padding: 40px 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0066CC 0%, #004080 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
    }
    .header::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.05)" d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,128C672,107,768,85,864,90.7C960,96,1056,128,1152,128C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
      background-size: cover;
      opacity: 0.1;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 15px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
    }
    .header p {
      font-size: 17px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
    }
    .content {
      padding: 45px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .appointment-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 35px;
      margin: 35px 0;
    }
    .appointment-card h2 {
      color: #0066CC;
      font-size: 22px;
      margin-bottom: 25px;
      text-align: center;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .detail-row {
      display: flex;
      padding: 15px 0;
      border-bottom: 1px solid #e2e8f0;
      align-items: center;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 700;
      color: #2d3748;
      min-width: 150px;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .detail-value {
      color: #1a202c;
      font-size: 16px;
      flex: 1;
      font-weight: 500;
    }
    .icon {
      font-size: 16px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .status-pending {
      background-color: #fff3cd;
      color: #856404;
      border: 2px solid #ffeaa7;
    }
    .status-confirmed {
      background-color: #d1ecf1;
      color: #0c5460;
      border: 2px solid #bee5eb;
    }
    .confirmation-code {
      text-align: center;
      margin: 35px 0;
      padding: 30px;
      background: linear-gradient(135deg, #0066CC 0%, #004080 100%);
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 102, 204, 0.3);
    }
    .confirmation-code p {
      font-size: 13px;
      margin-bottom: 10px;
      opacity: 0.9;
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .confirmation-code .code {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
      color: white;
      background: rgba(255, 255, 255, 0.15);
      padding: 15px 25px;
      border-radius: 8px;
      display: inline-block;
    }
    .important-info {
      background: #fff3cd;
      border-left: 5px solid #ffc107;
      padding: 25px;
      margin: 30px 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
    }
    .important-info h3 {
      color: #856404;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .important-info ul {
      list-style: none;
      padding-left: 0;
    }
    .important-info li {
      color: #856404;
      padding: 8px 0;
      font-size: 15px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .important-info li:before {
      content: "✓";
      color: #ffc107;
      font-weight: bold;
      font-size: 18px;
      flex-shrink: 0;
    }
    .clinic-info {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .clinic-info h3 {
      color: #0066CC;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 700;
    }
    .clinic-info p {
      color: #4a5568;
      font-size: 15px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .divider {
      height: 2px;
      background: linear-gradient(to right, transparent, #e2e8f0, transparent);
      margin: 30px 0;
    }
    .footer {
      background: #1a202c;
      padding: 40px;
      text-align: center;
      color: #a0aec0;
    }
    .footer-brand {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .footer-tagline {
      font-size: 14px;
      color: #718096;
      margin-bottom: 25px;
    }
    .footer-contact {
      margin: 20px 0;
      font-size: 14px;
    }
    .footer-contact p {
      margin: 8px 0;
      color: #cbd5e0;
    }
    .footer-social {
      margin: 25px 0;
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    .social-link {
      display: inline-block;
      width: 40px;
      height: 40px;
      background: #2d3748;
      border-radius: 50%;
      line-height: 40px;
      color: #cbd5e0;
      text-decoration: none;
      font-size: 18px;
      transition: all 0.3s;
    }
    .footer-legal {
      margin-top: 25px;
      padding-top: 25px;
      border-top: 1px solid #2d3748;
      font-size: 12px;
      color: #718096;
      line-height: 1.6;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .container {
        border-radius: 8px;
      }
      .header {
        padding: 35px 25px;
      }
      .header h1 {
        font-size: 26px;
      }
      .content {
        padding: 30px 25px;
      }
      .appointment-card {
        padding: 25px 20px;
      }
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px 0;
      }
      .detail-label {
        margin-bottom: 5px;
        min-width: auto;
      }
      .confirmation-code .code {
        font-size: 24px;
        letter-spacing: 2px;
      }
      .footer {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">🏥</div>
        <h1>Confirmación de Cita Médica</h1>
        <p>Tu cita ha sido agendada exitosamente</p>
      </div>
      
      <div class="content">
        <p class="greeting">Estimado/a ${safePatientName},</p>
        
        <p class="message">
          Nos complace confirmar que su cita médica ha sido registrada exitosamente en nuestro sistema. 
          Le agradecemos la confianza depositada en <strong>Clínica Médica</strong> y le esperamos en la fecha y hora indicadas. 
          Por favor, conserve este correo como comprobante de su reserva.
        </p>
        
        <div class="appointment-card">
          <h2><span>📋</span> Información de su Cita</h2>
          
          <div class="detail-row">
            <div class="detail-label"><span class="icon">👤</span> Paciente</div>
            <div class="detail-value">${safePatientName}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span class="icon">🆔</span> DNI</div>
            <div class="detail-value">${safePatientDni}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span class="icon">⚕️</span> Profesional</div>
            <div class="detail-value">${safeDoctorName}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span class="icon">📅</span> Fecha</div>
            <div class="detail-value">${parseLocalDate(appointment.date).toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span class="icon">🕐</span> Horario</div>
            <div class="detail-value">${safeTime} hs</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span class="icon">📝</span> Motivo</div>
            <div class="detail-value">${safeReason}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span class="icon">✅</span> Estado</div>
            <div class="detail-value">
              <span class="status-badge ${safeStatus === 'pendiente' ? 'status-pending' : 'status-confirmed'}">
                ${safeStatus === 'pendiente' ? 'Pendiente de Confirmación' : 'Confirmada'}
              </span>
            </div>
          </div>
        </div>
        
        <div class="confirmation-code">
          <p>Código de Confirmación</p>
          <div class="code">${appointment.id.substring(0, 8).toUpperCase()}</div>
        </div>
        
        <div class="important-info">
          <h3><span>⚠️</span> Indicaciones Importantes</h3>
          <ul>
            <li>Presentarse <strong>15 minutos antes</strong> de la hora agendada</li>
            <li>Traer documento de identidad (DNI) y credencial de obra social si corresponde</li>
            <li>Si posee estudios médicos previos relacionados, presentarlos en recepción</li>
            <li>En caso de necesitar cancelar o reprogramar, comunicarse con <strong>48 horas de anticipación</strong></li>
            <li>Conserve este email como comprobante de su turno</li>
          </ul>
        </div>

        <div class="divider"></div>
        
        <div class="clinic-info">
          <h3>📍 Información de la Clínica</h3>
          <p><strong>🏥 Dirección:</strong> Av. Principal 1234, Ciudad Autónoma de Buenos Aires</p>
          <p><strong>📞 Teléfono:</strong> (011) 4567-8900</p>
          <p><strong>📧 Email:</strong> info@clinica-medica.com</p>
          <p><strong>🕐 Horarios:</strong> Lunes a Viernes: 8:00 - 20:00 hs | Sábados: 9:00 - 13:00 hs</p>
        </div>
        
        <p class="message" style="margin-top: 35px; text-align: center; font-size: 15px;">
          Si tiene alguna consulta o necesita asistencia, nuestro equipo está disponible para ayudarle.
        </p>
      </div>
      
      <div class="footer">
        <div class="footer-brand">Clínica Médica</div>
        <div class="footer-tagline">Compromiso con su salud y bienestar</div>
        
        <div class="footer-contact">
          <p>📧 info@clinica-medica.com</p>
          <p>📞 (011) 4567-8900 | WhatsApp: +54 9 11 2345-6789</p>
          <p>📍 Av. Principal 1234, CABA, Argentina</p>
        </div>
        
        <div class="footer-social">
          <a href="#" class="social-link">f</a>
          <a href="#" class="social-link">in</a>
          <a href="#" class="social-link">📷</a>
        </div>
        
        <div class="footer-legal">
          <p>© ${new Date().getFullYear()} Clínica Médica. Todos los derechos reservados.</p>
          <p style="margin-top: 10px;">
            Este es un correo electrónico automático generado por nuestro sistema de gestión. 
            Por favor, no responda directamente a este mensaje. Para consultas, utilice nuestros canales oficiales de atención.
          </p>
          <p style="margin-top: 10px; font-size: 11px;">
            Av. Principal 1234, C1234ABC Ciudad Autónoma de Buenos Aires, Argentina
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateVerificationEmailHTML(firstName: string, verificationToken: string): string {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:5000';
  const verificationLink = `${baseUrl}/api/verify-email/${verificationToken}`;
  
  // Sanitize user input
  const safeFirstName = sanitizeHtml(firstName || 'Usuario');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu Email</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      background-color: #f0f4f8;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f0f4f8;
      padding: 40px 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 15px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 17px;
      opacity: 0.95;
      font-weight: 400;
    }
    .content {
      padding: 45px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .verification-button {
      text-align: center;
      margin: 35px 0;
    }
    .verify-btn {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      padding: 18px 48px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
      transition: all 0.3s ease;
    }
    .verify-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
    }
    .important-info {
      background: #fef3c7;
      border-left: 5px solid #f59e0b;
      padding: 25px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .important-info p {
      color: #92400e;
      font-size: 15px;
      margin: 5px 0;
    }
    .divider {
      height: 2px;
      background: linear-gradient(to right, transparent, #e2e8f0, transparent);
      margin: 30px 0;
    }
    .footer {
      background: #1a202c;
      padding: 40px;
      text-align: center;
      color: #a0aec0;
    }
    .footer-brand {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .footer-tagline {
      font-size: 14px;
      color: #718096;
      margin-bottom: 25px;
    }
    .footer-legal {
      margin-top: 25px;
      padding-top: 25px;
      border-top: 1px solid #2d3748;
      font-size: 12px;
      color: #718096;
      line-height: 1.6;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .header {
        padding: 35px 25px;
      }
      .header h1 {
        font-size: 26px;
      }
      .content {
        padding: 30px 25px;
      }
      .verify-btn {
        padding: 14px 32px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">✉️</div>
        <h1>Verifica tu Email</h1>
        <p>Bienvenido al Portal de Pacientes</p>
      </div>
      
      <div class="content">
        <p class="greeting">¡Hola ${safeFirstName}!</p>
        
        <p class="message">
          Gracias por registrarte en <strong>Clínica Médica</strong>. Para completar tu registro y acceder a todos los servicios de nuestro portal de pacientes, necesitamos verificar tu dirección de email.
        </p>
        
        <p class="message" style="text-align: center; font-weight: 600;">
          Haz click en el botón para verificar tu email:
        </p>
        
        <div class="verification-button">
          <a href="${verificationLink}" class="verify-btn">
            ✓ Verificar Email
          </a>
        </div>
        
        <div class="important-info">
          <p><strong>⚠️ Importante:</strong></p>
          <p>• El enlace es válido por 24 horas</p>
          <p>• No compartas este enlace con nadie</p>
          <p>• Si no solicitaste este registro, ignora este email</p>
        </div>

        <div class="divider"></div>
        
        <p class="message" style="text-align: center; font-size: 15px;">
          Una vez verificado tu email, podrás acceder a tu perfil médico, agendar citas y mucho más.
        </p>
      </div>
      
      <div class="footer">
        <div class="footer-brand">Clínica Médica</div>
        <div class="footer-tagline">Compromiso con su salud y bienestar</div>
        
        <div class="footer-legal">
          <p>© ${new Date().getFullYear()} Clínica Médica. Todos los derechos reservados.</p>
          <p style="margin-top: 10px;">
            Este es un correo electrónico automático. Por favor, no responda directamente a este mensaje.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<boolean> {
  try {
    console.log('🔄 Iniciando envío de email de verificación a:', email);
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    if (!client) {
      console.error('❌ No se pudo obtener el cliente de Resend');
      return false;
    }

    console.log('✓ Cliente de Resend obtenido exitosamente');

    const htmlContent = generateVerificationEmailHTML(firstName, verificationToken);

    const emailData = {
      from: `Clínica Médica <${fromEmail}>`,
      to: email,
      subject: '✓ Verifica tu Email - Clínica Médica',
      html: htmlContent,
    };

    console.log('📤 Enviando email de verificación:');
    console.log('   De:', emailData.from);
    console.log('   Para:', emailData.to);
    console.log('   Token:', verificationToken.substring(0, 10) + '...');

    const { data, error } = await client.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend al enviar email:', error);
      return false;
    }

    console.log('✅ Email de verificación enviado exitosamente!');
    console.log('   ID del email:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Excepción al enviar email de verificación:', error);
    return false;
  }
}

export async function sendAppointmentConfirmation(appointment: Appointment): Promise<boolean> {
  try {
    console.log('🔄 Iniciando envío de email a:', appointment.patientEmail);
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    if (!client) {
      console.error('❌ No se pudo obtener el cliente de Resend');
      return false;
    }

    console.log('✓ Cliente de Resend obtenido exitosamente');
    console.log('📧 Email de origen:', fromEmail || 'onboarding@resend.dev');

    const htmlContent = generateAppointmentEmailHTML({ appointment });

    // Usar el dominio verificado medicalclinica.online
    const emailData = {
      from: `Clínica Médica <${fromEmail}>`,
      to: appointment.patientEmail,
      subject: `✓ Confirmación de Cita - ${appointment.doctorName}`,
      html: htmlContent,
    };

    console.log('📤 Enviando email con los siguientes datos:');
    console.log('   De:', emailData.from);
    console.log('   Para:', emailData.to);
    console.log('   Asunto:', emailData.subject);

    const { data, error } = await client.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend al enviar email:', error);
      console.error('   Detalles del error:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Email enviado exitosamente!');
    console.log('   ID del email:', data?.id);
    console.log('   Destinatario:', appointment.patientEmail);
    return true;
  } catch (error) {
    console.error('❌ Excepción al enviar email de confirmación:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
    return false;
  }
}

function generateCancellationEmailHTML(appointment: Appointment, cancellationReason?: string): string {
  // Sanitize all user-controlled fields
  const safePatientName = sanitizeHtml(appointment.patientName || 'Paciente');
  const safeDoctorName = sanitizeHtml(appointment.doctorName || 'Médico');
  const safeReason = sanitizeHtml(appointment.reason || 'No especificado');
  const safeTime = sanitizeHtml(appointment.time || '');
  const safeCancellationReason = sanitizeHtml(cancellationReason || '');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Cancelada</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      background-color: #f0f4f8;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f0f4f8;
      padding: 40px 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 15px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
    }
    .header p {
      font-size: 17px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
    }
    .content {
      padding: 45px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .appointment-card {
      background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
      border: 2px solid #FECACA;
      border-radius: 12px;
      padding: 35px;
      margin: 35px 0;
    }
    .appointment-card h2 {
      color: #DC2626;
      font-size: 22px;
      margin-bottom: 25px;
      text-align: center;
      font-weight: 700;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 18px 0;
      border-bottom: 1px solid #FECACA;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #991B1B;
      font-size: 15px;
    }
    .detail-value {
      color: #1a202c;
      font-size: 15px;
      font-weight: 500;
    }
    .reason-box {
      background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
      border: 3px solid #DC2626;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .reason-box h3 {
      color: #DC2626;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .reason-box p {
      color: #1a202c;
      margin: 0;
      font-size: 16px;
      line-height: 1.7;
      font-weight: 500;
    }
    .alert-box {
      background: #FEF2F2;
      border-left: 4px solid #DC2626;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .alert-box p {
      color: #991B1B;
      margin: 0;
      font-size: 15px;
      line-height: 1.6;
    }
    .footer {
      background: #f7fafc;
      padding: 35px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #718096;
      font-size: 14px;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">❌</div>
        <h1>Cita Cancelada</h1>
        <p>Tu cita médica ha sido cancelada</p>
      </div>
      
      <div class="content">
        <p class="greeting">Estimado/a ${safePatientName},</p>
        
        <p class="message">
          Lamentamos informarte que tu cita médica ha sido <strong>cancelada</strong> por la clínica.
        </p>
        
        ${safeCancellationReason ? `
        <div class="reason-box">
          <h3>📢 Motivo de la cancelación</h3>
          <p>${safeCancellationReason}</p>
        </div>
        ` : ''}
        
        <div class="appointment-card">
          <h2>📋 Detalles de la Cita Cancelada</h2>
          
          <div class="detail-row">
            <span class="detail-label">👤 Paciente:</span>
            <span class="detail-value">${safePatientName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">🩺 Médico:</span>
            <span class="detail-value">${safeDoctorName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">📅 Fecha:</span>
            <span class="detail-value">${parseLocalDate(appointment.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">🕒 Hora:</span>
            <span class="detail-value">${safeTime} hs</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">📝 Motivo de consulta:</span>
            <span class="detail-value">${safeReason}</span>
          </div>
        </div>
        
        <div class="alert-box">
          <p><strong>⚠️ Importante:</strong> Si necesitas reagendar tu cita, por favor comunícate con nosotros o agenda una nueva cita a través de nuestro portal web.</p>
        </div>
        
        <p class="message">
          Para cualquier consulta o si deseas agendar una nueva cita, no dudes en contactarnos.
        </p>
      </div>
      
      <div class="footer">
        <p><strong>Clínica Médica</strong></p>
        <p>Este es un email automático, por favor no responder.</p>
        <p style="margin-top: 20px; color: #a0aec0; font-size: 13px;">
          © ${new Date().getFullYear()} Clínica Médica. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export async function sendCancellationEmail(appointment: Appointment, cancellationReason?: string): Promise<boolean> {
  try {
    console.log('🔄 Iniciando envío de email de cancelación a:', appointment.patientEmail);
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    if (!client) {
      console.error('❌ No se pudo obtener el cliente de Resend');
      return false;
    }

    console.log('✓ Cliente de Resend obtenido exitosamente');
    console.log('📧 Email de origen:', fromEmail || 'onboarding@resend.dev');

    const htmlContent = generateCancellationEmailHTML(appointment, cancellationReason);

    const emailData = {
      from: `Clínica Médica <${fromEmail}>`,
      to: appointment.patientEmail,
      subject: `❌ Cita Cancelada - ${appointment.doctorName}`,
      html: htmlContent,
    };

    console.log('📤 Enviando email de cancelación:');
    console.log('   De:', emailData.from);
    console.log('   Para:', emailData.to);
    console.log('   Asunto:', emailData.subject);

    const { data, error } = await client.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend al enviar email de cancelación:', error);
      console.error('   Detalles del error:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Email de cancelación enviado exitosamente!');
    console.log('   ID del email:', data?.id);
    console.log('   Destinatario:', appointment.patientEmail);
    return true;
  } catch (error) {
    console.error('❌ Excepción al enviar email de cancelación:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
    return false;
  }
}

function generatePasswordResetEmailHTML(firstName: string, resetCode: string): string {
  // Sanitize user input
  const safeFirstName = sanitizeHtml(firstName || 'Usuario');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      background-color: #f0f4f8;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f0f4f8;
      padding: 40px 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 15px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 17px;
      opacity: 0.95;
      font-weight: 400;
    }
    .content {
      padding: 45px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .code-container {
      text-align: center;
      margin: 35px 0;
      padding: 30px;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-radius: 12px;
      border: 2px dashed #cbd5e0;
    }
    .code-label {
      font-size: 14px;
      color: #718096;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .reset-code {
      font-size: 42px;
      font-weight: 700;
      color: #8b5cf6;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.05);
    }
    .warning-box {
      background-color: #fef5e7;
      border-left: 4px solid #f39c12;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .warning-box p {
      font-size: 15px;
      color: #856404;
      margin: 0;
    }
    .info-box {
      background-color: #e8f4fd;
      border-left: 4px solid #3498db;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .info-box p {
      font-size: 15px;
      color: #004085;
      margin: 8px 0;
    }
    .footer {
      background-color: #f7fafc;
      padding: 35px 40px;
      border-top: 1px solid #e2e8f0;
    }
    .footer-content {
      color: #718096;
      font-size: 14px;
      line-height: 1.7;
      text-align: center;
    }
    .footer-title {
      color: #1a202c;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .contact-info {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .contact-link {
      color: #8b5cf6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">🔐</div>
        <h1>Recuperación de Contraseña</h1>
        <p>Código de Seguridad</p>
      </div>
      
      <div class="content">
        <p class="greeting">Hola ${safeFirstName},</p>
        
        <p class="message">
          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. 
          Utiliza el siguiente código de seguridad para completar el proceso:
        </p>

        <div class="code-container">
          <div class="code-label">Tu Código de Recuperación</div>
          <div class="reset-code">${safeResetCode}</div>
        </div>

        <div class="info-box">
          <p><strong>⏱️ Tiempo de validez:</strong> Este código expirará en 15 minutos.</p>
          <p><strong>🔒 Seguridad:</strong> No compartas este código con nadie.</p>
        </div>

        <div class="warning-box">
          <p>
            <strong>⚠️ ¿No solicitaste este cambio?</strong><br>
            Si no solicitaste restablecer tu contraseña, ignora este correo. 
            Tu contraseña actual permanecerá sin cambios y tu cuenta estará segura.
          </p>
        </div>

        <p class="message">
          Para completar el restablecimiento, ingresa este código en la página de recuperación 
          de contraseña junto con tu nueva contraseña.
        </p>
      </div>

      <div class="footer">
        <div class="footer-content">
          <p class="footer-title">Clínica Médica</p>
          <p>
            Tu salud es nuestra prioridad.<br>
            Estamos aquí para servirte con profesionalismo y dedicación.
          </p>
          <div class="contact-info">
            <p>
              Este es un correo electrónico automático. Por favor, no responda directamente a este mensaje.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetCode: string): Promise<boolean> {
  try {
    console.log('🔄 Iniciando envío de email de recuperación de contraseña a:', email);
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    if (!client) {
      console.error('❌ No se pudo obtener el cliente de Resend');
      return false;
    }

    console.log('✓ Cliente de Resend obtenido exitosamente');

    const htmlContent = generatePasswordResetEmailHTML(firstName, resetCode);

    const emailData = {
      from: `Clínica Médica <${fromEmail}>`,
      to: email,
      subject: '🔐 Recuperación de Contraseña - Clínica Médica',
      html: htmlContent,
    };

    console.log('📤 Enviando email de recuperación:');
    console.log('   De:', emailData.from);
    console.log('   Para:', emailData.to);
    console.log('   Código:', resetCode);

    const { data, error } = await client.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend al enviar email:', error);
      return false;
    }

    console.log('✅ Email de recuperación enviado exitosamente!');
    console.log('   ID del email:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Excepción al enviar email de recuperación:', error);
    return false;
  }
}

function generateUsernameRecoveryEmailHTML(firstName: string, email: string): string {
  // Sanitize user input
  const safeFirstName = sanitizeHtml(firstName || 'Usuario');
  const safeEmail = sanitizeHtml(email || '');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Usuario</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      background-color: #f0f4f8;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f0f4f8;
      padding: 40px 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .header p {
      font-size: 17px;
      opacity: 0.95;
    }
    .content {
      padding: 45px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .email-box {
      text-align: center;
      margin: 35px 0;
      padding: 30px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 12px;
      border: 2px solid #3b82f6;
    }
    .email-label {
      font-size: 14px;
      color: #1e40af;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .user-email {
      font-size: 24px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 10px 0;
      word-break: break-all;
    }
    .info-box {
      background-color: #e8f4fd;
      border-left: 4px solid #3498db;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .info-box p {
      font-size: 15px;
      color: #004085;
      margin: 8px 0;
    }
    .footer {
      background-color: #f7fafc;
      padding: 35px 40px;
      border-top: 1px solid #e2e8f0;
    }
    .footer-content {
      color: #718096;
      font-size: 14px;
      line-height: 1.7;
      text-align: center;
    }
    .footer-title {
      color: #1a202c;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 15px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">📧</div>
        <h1>Recuperación de Usuario</h1>
        <p>Tu dirección de correo electrónico</p>
      </div>
      
      <div class="content">
        <p class="greeting">Hola ${safeFirstName},</p>
        
        <p class="message">
          Recibimos una solicitud para recuperar tu email asociado a tu DNI. 
          Esta es la dirección de correo electrónico registrada en tu cuenta:
        </p>

        <div class="email-box">
          <div class="email-label">Tu Email</div>
          <div class="user-email">${safeEmail}</div>
        </div>

        <div class="info-box">
          <p><strong>💡 ¿Qué hacer ahora?</strong></p>
          <p>Usa este email para iniciar sesión en el portal de pacientes.</p>
          <p>Si olvidaste tu contraseña, puedes restablecerla desde la página de login.</p>
        </div>

        <p class="message">
          Si no solicitaste esta información, ignora este correo. 
          Tu cuenta permanecerá segura.
        </p>
      </div>

      <div class="footer">
        <div class="footer-content">
          <p class="footer-title">Clínica Médica</p>
          <p>
            Tu salud es nuestra prioridad.<br>
            Estamos aquí para servirte con profesionalismo y dedicación.
          </p>
          <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            Este es un correo electrónico automático. Por favor, no responda directamente a este mensaje.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendUsernameRecoveryEmail(email: string, firstName: string): Promise<boolean> {
  try {
    console.log('🔄 Iniciando envío de email de recuperación de usuario a:', email);
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    if (!client) {
      console.error('❌ No se pudo obtener el cliente de Resend');
      return false;
    }

    console.log('✓ Cliente de Resend obtenido exitosamente');

    const htmlContent = generateUsernameRecoveryEmailHTML(firstName, email);

    const emailData = {
      from: `Clínica Médica <${fromEmail}>`,
      to: email,
      subject: '📧 Recuperación de Usuario - Clínica Médica',
      html: htmlContent,
    };

    console.log('📤 Enviando email de recuperación de usuario:');
    console.log('   De:', emailData.from);
    console.log('   Para:', emailData.to);

    const { data, error } = await client.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend al enviar email:', error);
      return false;
    }

    console.log('✅ Email de recuperación de usuario enviado exitosamente!');
    console.log('   ID del email:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Excepción al enviar email de recuperación de usuario:', error);
    return false;
  }
}

function generatePrescriptionEmailHTML(
  patientName: string,
  doctorName: string,
  medication: string,
  dosage: string,
  frequency: string,
  duration: string,
  instructions: string
): string {
  // Sanitize all input values and provide safe fallbacks for optional fields
  const safePatientName = sanitizeHtml(patientName || 'Paciente');
  const safeDoctorName = sanitizeHtml(doctorName || 'Médico');
  const safeMedication = sanitizeHtml(medication || 'No especificado');
  const safeDosage = sanitizeHtml(dosage || 'No especificada');
  const safeFrequency = sanitizeHtml(frequency || 'No especificada');
  const safeDuration = sanitizeHtml(duration || 'No especificada');
  const safeInstructions = sanitizeHtml(instructions || '');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Receta Médica</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      background-color: #f0f4f8;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f0f4f8;
      padding: 40px 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 15px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 17px;
      opacity: 0.95;
      font-weight: 400;
    }
    .content {
      padding: 45px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .prescription-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 35px;
      margin: 35px 0;
    }
    .prescription-card h2 {
      color: #10b981;
      font-size: 22px;
      margin-bottom: 25px;
      text-align: center;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .detail-row {
      display: flex;
      padding: 15px 0;
      border-bottom: 1px solid #e2e8f0;
      align-items: flex-start;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 700;
      color: #2d3748;
      min-width: 150px;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .detail-value {
      color: #1a202c;
      font-size: 16px;
      flex: 1;
      font-weight: 500;
    }
    .medication-highlight {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      text-align: center;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }
    .medication-highlight h3 {
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .medication-highlight p {
      font-size: 16px;
      opacity: 0.95;
    }
    .important-info {
      background: #fef3c7;
      border-left: 5px solid #f59e0b;
      padding: 25px;
      margin: 30px 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
    }
    .important-info h3 {
      color: #92400e;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .important-info ul {
      list-style: none;
      padding-left: 0;
    }
    .important-info li {
      color: #92400e;
      padding: 8px 0;
      font-size: 15px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .important-info li:before {
      content: "✓";
      color: #f59e0b;
      font-weight: bold;
      font-size: 18px;
      flex-shrink: 0;
    }
    .footer {
      background: #1a202c;
      padding: 40px;
      text-align: center;
      color: #a0aec0;
    }
    .footer-brand {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .footer-tagline {
      font-size: 14px;
      color: #718096;
      margin-bottom: 25px;
    }
    .footer-legal {
      margin-top: 25px;
      padding-top: 25px;
      border-top: 1px solid #2d3748;
      font-size: 12px;
      color: #718096;
      line-height: 1.6;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .header {
        padding: 35px 25px;
      }
      .header h1 {
        font-size: 26px;
      }
      .content {
        padding: 30px 25px;
      }
      .prescription-card {
        padding: 25px 20px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-label {
        margin-bottom: 5px;
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">💊</div>
        <h1>Nueva Receta Médica</h1>
        <p>Su médico le ha emitido una nueva receta</p>
      </div>
      
      <div class="content">
        <p class="greeting">Estimado/a ${safePatientName},</p>
        
        <p class="message">
          ${safeDoctorName} le ha emitido una nueva receta médica. A continuación encontrará los detalles de su prescripción. 
          Es importante que siga las indicaciones exactamente como se le han prescrito.
        </p>
        
        <div class="medication-highlight">
          <h3>💊 ${safeMedication}</h3>
          <p>${safeDosage}</p>
        </div>
        
        <div class="prescription-card">
          <h2><span>📋</span> Detalles de la Receta</h2>
          
          <div class="detail-row">
            <div class="detail-label"><span>⚕️</span> Médico</div>
            <div class="detail-value">${safeDoctorName}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span>💊</span> Medicamento</div>
            <div class="detail-value">${safeMedication}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span>📏</span> Dosis</div>
            <div class="detail-value">${safeDosage}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span>🕐</span> Frecuencia</div>
            <div class="detail-value">${safeFrequency}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label"><span>⏱️</span> Duración</div>
            <div class="detail-value">${safeDuration}</div>
          </div>
          
          ${safeInstructions ? `
          <div class="detail-row">
            <div class="detail-label"><span>📝</span> Indicaciones</div>
            <div class="detail-value">${safeInstructions}</div>
          </div>
          ` : ''}
        </div>
        
        <div class="important-info">
          <h3><span>⚠️</span> Indicaciones Importantes</h3>
          <ul>
            <li>Tome el medicamento exactamente como se indica</li>
            <li>No suspenda el tratamiento sin consultar con su médico</li>
            <li>Si experimenta efectos adversos, contacte a su médico inmediatamente</li>
            <li>Conserve este email como registro de su prescripción</li>
            <li>Puede acceder a su recetario completo desde el portal de pacientes</li>
          </ul>
        </div>
        
        <p class="message" style="text-align: center; font-size: 15px;">
          Si tiene alguna duda sobre su tratamiento, no dude en consultar con su médico o farmacéutico.
        </p>
      </div>
      
      <div class="footer">
        <div class="footer-brand">Clínica Médica</div>
        <div class="footer-tagline">Compromiso con su salud y bienestar</div>
        
        <div class="footer-legal">
          <p>© ${new Date().getFullYear()} Clínica Médica. Todos los derechos reservados.</p>
          <p style="margin-top: 10px;">
            Este es un correo electrónico automático generado por nuestro sistema médico. 
            Por favor, no responda directamente a este mensaje.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendPrescriptionNotification(
  email: string,
  patientName: string,
  doctorName: string,
  medication: string,
  dosage: string,
  frequency: string,
  duration: string,
  instructions: string
): Promise<boolean> {
  try {
    console.log('🔄 Iniciando envío de notificación de receta a:', email);
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    if (!client) {
      console.error('❌ No se pudo obtener el cliente de Resend');
      return false;
    }

    console.log('✓ Cliente de Resend obtenido exitosamente');
    console.log('📧 Email de origen:', fromEmail);

    const htmlContent = generatePrescriptionEmailHTML(
      patientName,
      doctorName,
      medication,
      dosage,
      frequency,
      duration,
      instructions
    );

    const emailData = {
      from: `Clínica Médica <${fromEmail}>`,
      to: email,
      subject: `💊 Nueva Receta Médica - ${medication}`,
      html: htmlContent,
    };

    console.log('📤 Enviando email de receta:');
    console.log('   De:', emailData.from);
    console.log('   Para:', emailData.to);

    const { data, error } = await client.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend al enviar email:', error);
      return false;
    }

    console.log('✅ Email de receta enviado exitosamente!');
    console.log('   ID del email:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Excepción al enviar email de receta:', error);
    return false;
  }
}
