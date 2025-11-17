import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "./auth";
import { storage, type Appointment } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { randomUUID } from "crypto";
import { sendAppointmentConfirmation, sendVerificationEmail, sendCancellationEmail, sendPasswordResetEmail, sendUsernameRecoveryEmail, sendPrescriptionNotification } from "./email";

const recoveryAttempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitRecovery(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = recoveryAttempts.get(ip);
  
  if (record && record.resetAt > now) {
    if (record.count >= 5) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({ 
        error: `Demasiados intentos. Por favor espera ${waitSeconds} segundos antes de intentar nuevamente.` 
      });
    }
    record.count++;
  } else {
    recoveryAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }
  
  next();
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "No autenticado" });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const user = req.user as any;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado - requiere rol de administrador" });
  }
  next();
}

function isPatient(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const user = req.user as any;
  if (user.role !== 'patient') {
    return res.status(403).json({ error: "Acceso denegado - requiere rol de paciente" });
  }
  if (!user.emailVerified) {
    return res.status(403).json({ error: "Por favor verifica tu email para acceder a esta funcionalidad" });
  }
  if (user.deleted) {
    return res.status(403).json({ error: "Esta cuenta ha sido eliminada" });
  }
  next();
}

function isPatientForProfileUpdate(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    console.log('🔒 isPatientForProfileUpdate: Usuario no autenticado');
    return res.status(401).json({ error: "No autenticado" });
  }
  const user = req.user as any;
  console.log('👤 isPatientForProfileUpdate: Usuario', { id: user.id, role: user.role, emailVerified: user.emailVerified });
  if (user.role !== 'patient') {
    console.log('❌ isPatientForProfileUpdate: Usuario no es paciente, rol:', user.role);
    return res.status(403).json({ error: "Acceso denegado - Solo los pacientes pueden actualizar su perfil" });
  }
  if (user.deleted) {
    console.log('❌ isPatientForProfileUpdate: Cuenta eliminada');
    return res.status(403).json({ error: "Esta cuenta ha sido eliminada" });
  }
  console.log('✅ isPatientForProfileUpdate: Acceso permitido');
  next();
}

function isDoctor(req: Request, res: Response, next: NextFunction) {
  console.log('🔍 isDoctor - Verificando autenticación:', {
    isAuthenticated: req.isAuthenticated(),
    hasSession: !!req.session,
    sessionID: req.sessionID,
    hasUser: !!req.user,
    userRole: req.user ? (req.user as any).role : 'no user'
  });
  
  if (!req.isAuthenticated()) {
    console.log('❌ isDoctor - No autenticado');
    return res.status(401).json({ error: "No autenticado" });
  }
  const user = req.user as any;
  if (user.role !== 'doctor') {
    console.log('❌ isDoctor - No es médico, rol:', user.role);
    return res.status(403).json({ error: "Acceso denegado - requiere rol de médico" });
  }
  if (user.deleted) {
    console.log('❌ isDoctor - Cuenta eliminada');
    return res.status(403).json({ error: "Esta cuenta ha sido eliminada" });
  }
  console.log('✅ isDoctor - Acceso permitido');
  next();
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateVerificationToken(): string {
  return nanoid(32);
}

const insertAppointmentSchema = z.object({
  patientName: z.string().min(1),
  patientDni: z.string().min(1),
  patientEmail: z.string().email(),
  doctorId: z.string(),
  doctorName: z.string(),
  date: z.string(),
  time: z.string(),
  reason: z.string().min(1),
  status: z.string().optional(),
});

const createPrescriptionSchema = z.object({
  appointmentId: z.string().min(1),
  medication: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  duration: z.string().min(1).max(100),
  instructions: z.string().max(1000).optional(),
});

const createDiagnosisSchema = z.object({
  appointmentId: z.string().min(1),
  condition: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(['leve', 'moderado', 'grave']).optional(),
});

const createStudySchema = z.object({
  appointmentId: z.string().min(1),
  studyType: z.string().min(1).max(100),
  studyName: z.string().min(1).max(200),
  result: z.string().max(2000).optional(),
  observations: z.string().max(2000).optional(),
});

const createMedicalRecordSchema = z.object({
  appointmentId: z.string().min(1),
  diagnosis: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
});

const completeConsultationSchema = z.object({
  appointmentId: z.string().min(1),
});

export function registerRoutes(app: Express): Server {
  // Login
  app.post("/api/login", (req, res, next) => {
    const { expectedRole } = req.body;
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Error al iniciar sesión" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Email o contraseña incorrectos" });
      }

      if (expectedRole && user.role !== expectedRole) {
        let errorMessage = "Esta cuenta no tiene los permisos necesarios";
        if (expectedRole === 'admin') {
          errorMessage = "Esta cuenta no tiene permisos de administrador";
        } else if (expectedRole === 'patient') {
          errorMessage = "Esta cuenta no es de paciente";
        } else if (expectedRole === 'doctor') {
          errorMessage = "Esta cuenta no es de médico";
        }
        return res.status(403).json({ error: errorMessage });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Error al iniciar sesión" });
        }
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Error al guardar sesión" });
          }
          const { password, ...userWithoutPassword } = user;
          return res.json({ user: userWithoutPassword });
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Error al destruir sesión" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Sesión cerrada correctamente" });
      });
    });
  });

  // Register patient
  app.post("/api/register/patient", async (req, res) => {
    try {
      const validatedData = z.object({
        dni: z.string().min(7, "DNI debe tener al menos 7 caracteres"),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
        firstName: z.string().min(1, "Nombre es requerido"),
        lastName: z.string().min(1, "Apellido es requerido"),
        phone: z.string().min(1, "Teléfono es requerido"),
        direccion: z.string().min(1, "Dirección es requerida"),
        dateOfBirth: z.string().min(1, "Fecha de nacimiento es requerida"),
        healthInsurance: z.string().min(1, "Obra social es requerida"),
      }).parse(req.body);

      // Check if DNI already exists
      const dniExists = await storage.checkDniExists(validatedData.dni);
      if (dniExists) {
        return res.status(400).json({ error: "El DNI ya está registrado" });
      }

      // Check if email already exists
      const emailExists = await storage.checkEmailExists(validatedData.email);
      if (emailExists) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Generate verification token and wait token
      const verificationToken = generateVerificationToken();
      const waitToken = generateVerificationToken();

      // Create user with all fields
      let user = await storage.createUser({
        username: validatedData.email,
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: 'patient',
        profileImage: undefined,
      });

      // Update with additional fields including verification token and wait token
      const updatedUser = await storage.updateUser(user.id, {
        dni: validatedData.dni,
        direccion: validatedData.direccion,
        dateOfBirth: validatedData.dateOfBirth,
        healthInsurance: validatedData.healthInsurance,
        emailVerified: false,
        verificationToken,
        waitToken,
        deleted: false,
      } as any);

      if (updatedUser) {
        user = updatedUser;
      }

      // Send verification email with link
      await sendVerificationEmail(validatedData.email, validatedData.firstName, verificationToken);

      const { password, verificationToken: token, waitToken: wToken, ...userWithoutSensitiveData } = user;
      res.status(201).json({ 
        message: "Usuario registrado exitosamente. Por favor verifica tu email.",
        user: userWithoutSensitiveData,
        waitToken: updatedUser?.waitToken || waitToken
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error al registrar paciente:", error);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  // Register doctor
  app.post("/api/register/doctor", async (req, res) => {
    try {
      const validatedData = z.object({
        matricula: z.string().min(1, "Matrícula es requerida"),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
        firstName: z.string().min(1, "Nombre es requerido"),
        lastName: z.string().min(1, "Apellido es requerido"),
        phone: z.string().min(1, "Teléfono es requerido"),
        specialty: z.string().min(1, "Especialidad es requerida"),
      }).parse(req.body);

      if (!validatedData.matricula.startsWith('1') || !validatedData.matricula.endsWith('3')) {
        return res.status(400).json({ 
          error: "La matrícula no es válida o no pertenece a un médico" 
        });
      }

      const matriculaExists = await storage.checkMatriculaExists(validatedData.matricula);
      if (matriculaExists) {
        return res.status(400).json({ error: "La matrícula ya está registrada" });
      }

      const emailExists = await storage.checkEmailExists(validatedData.email);
      if (emailExists) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const verificationToken = generateVerificationToken();
      const waitToken = generateVerificationToken();

      const doctorRecord = await storage.createDoctor({
        name: `Dr. ${validatedData.firstName} ${validatedData.lastName}`,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        specialty: validatedData.specialty,
        matricula: validatedData.matricula,
        availableSlots: [],
      });

      let user = await storage.createUser({
        username: validatedData.email,
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: 'doctor',
        profileImage: undefined,
      });

      const updatedUser = await storage.updateUser(user.id, {
        emailVerified: false,
        verificationToken,
        waitToken,
        deleted: false,
        doctorId: doctorRecord.id,
      } as any);

      if (updatedUser) {
        user = updatedUser;
      }

      await sendVerificationEmail(validatedData.email, validatedData.firstName, verificationToken);

      const { password, verificationToken: token, waitToken: wToken, ...userWithoutSensitiveData } = user;
      res.status(201).json({ 
        message: "Médico registrado exitosamente. Por favor verifica tu email.",
        user: userWithoutSensitiveData,
        waitToken: updatedUser?.waitToken || waitToken
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error al registrar médico:", error);
      res.status(500).json({ error: "Error al registrar médico" });
    }
  });

  // Verify email by token (link)
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const users = await storage.getAllUsers();
      const user = users.find(u => u.verificationToken === token);

      if (!user) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error de Verificación</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
              h1 { color: #e53e3e; font-size: 24px; margin-bottom: 16px; }
              p { color: #4a5568; line-height: 1.6; margin-bottom: 24px; }
              a { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
              a:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Token Inválido</h1>
              <p>El enlace de verificación no es válido o ha expirado.</p>
              <a href="/pacientes/login">Ir al Login</a>
            </div>
          </body>
          </html>
        `);
      }

      if (user.emailVerified) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Ya Verificado</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
              h1 { color: #48bb78; font-size: 24px; margin-bottom: 16px; }
              p { color: #4a5568; line-height: 1.6; margin-bottom: 24px; }
              a { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
              a:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✓ Email Ya Verificado</h1>
              <p>Tu email ya ha sido verificado anteriormente. Puedes iniciar sesión.</p>
              <a href="/pacientes/login">Iniciar Sesión</a>
            </div>
          </body>
          </html>
        `);
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: undefined,
      } as any);

      if (req.session && req.isAuthenticated && req.isAuthenticated()) {
        const sessionUser = req.user as any;
        if (sessionUser && sessionUser.id === user.id) {
          req.session.destroy((err) => {
            if (err) {
              console.error('Error destroying session:', err);
            }
          });
        }
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verificado</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              padding: 20px;
            }
            .container { 
              background: white; 
              padding: 50px 40px; 
              border-radius: 20px; 
              box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
              text-align: center; 
              max-width: 500px; 
              width: 100%;
              animation: slideIn 0.4s ease-out;
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .success-icon { 
              font-size: 80px; 
              margin-bottom: 20px; 
              animation: checkmark 0.6s ease-in-out;
            }
            @keyframes checkmark {
              0% { transform: scale(0); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
            h1 { 
              color: #059669; 
              font-size: 28px; 
              margin-bottom: 16px; 
              font-weight: 700;
            }
            p { 
              color: #4b5563; 
              line-height: 1.8; 
              margin-bottom: 12px; 
              font-size: 16px;
            }
            .auto-close { 
              color: #6b7280; 
              font-size: 14px; 
              margin-top: 24px;
              padding: 12px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .countdown {
              font-weight: 600;
              color: #059669;
            }
          </style>
          <script>
            let countdown = 3;
            function updateCountdown() {
              const elem = document.getElementById('countdown');
              if (elem && countdown > 0) {
                elem.textContent = countdown;
                countdown--;
                setTimeout(updateCountdown, 1000);
              } else {
                window.close();
                setTimeout(() => {
                  window.location.href = '/pacientes/login';
                }, 500);
              }
            }
            window.onload = updateCountdown;
          </script>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>¡Email Verificado!</h1>
            <p>Tu cuenta ha sido activada correctamente.</p>
            <p>Por favor, inicia sesión nuevamente con tus nuevas credenciales.</p>
            <div class="auto-close">
              Esta ventana se cerrará en <span class="countdown" id="countdown">3</span> segundos...
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error al verificar email por token:", error);
      res.status(500).send("Error al verificar email");
    }
  });


  // Check verification status by wait token
  app.get("/api/check-verification-status", async (req, res) => {
    try {
      const waitToken = req.query.token as string;
      
      if (!waitToken) {
        return res.status(400).json({ error: "Token requerido" });
      }

      const users = await storage.getAllUsers();
      const user = users.find(u => u.waitToken === waitToken);
      
      if (!user) {
        return res.status(404).json({ error: "Token inválido" });
      }

      const isVerified = user.emailVerified || false;
      const userEmail = user.email;

      if (isVerified) {
        setImmediate(async () => {
          await storage.updateUser(user.id, {
            waitToken: undefined,
          } as any);
        });
      }

      res.json({ verified: isVerified, email: userEmail });
    } catch (error) {
      console.error("Error checking verification status:", error);
      res.status(500).json({ error: "Error al verificar estado" });
    }
  });

  // Resend verification link
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = z.object({
        email: z.string().email(),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "El email ya está verificado" });
      }

      const verificationToken = generateVerificationToken();
      
      await storage.updateUser(user.id, {
        verificationToken,
      } as any);

      // Send verification email with link
      await sendVerificationEmail(user.email, user.firstName, verificationToken);

      res.json({ message: "Email de verificación reenviado" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al reenviar email de verificación" });
    }
  });

  // Recover username (send email with user's email address)
  app.post("/api/recover-username", rateLimitRecovery, async (req, res) => {
    try {
      const { dni } = z.object({
        dni: z.string().min(7, "DNI debe tener al menos 7 caracteres"),
      }).parse(req.body);

      const user = await storage.getUserByDni(dni);
      
      if (user && user.role === 'patient') {
        sendUsernameRecoveryEmail(user.email, user.firstName).catch(err => 
          console.error('[RECOVERY] Failed to send username recovery email:', err)
        );
      }
      
      const jitter = Math.floor(Math.random() * 100);
      await new Promise(resolve => setTimeout(resolve, 350 + jitter));
      
      res.json({ 
        message: "Si tu DNI está registrado, recibirás un email con tu dirección de correo electrónico."
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al procesar solicitud" });
    }
  });

  // Recover username for doctor (send email with user's email address)
  app.post("/api/recover-username-doctor", rateLimitRecovery, async (req, res) => {
    try {
      const { matricula } = z.object({
        matricula: z.string().min(1, "Matrícula es requerida"),
      }).parse(req.body);

      const user = await storage.getUserByMatricula(matricula);
      
      if (user && user.role === 'doctor') {
        sendUsernameRecoveryEmail(user.email, user.firstName).catch(err => 
          console.error('[RECOVERY] Failed to send username recovery email:', err)
        );
      }
      
      const jitter = Math.floor(Math.random() * 100);
      await new Promise(resolve => setTimeout(resolve, 350 + jitter));
      
      res.json({ 
        message: "Si tu matrícula está registrada, recibirás un email con tu dirección de correo electrónico."
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al procesar solicitud" });
    }
  });

  // Forgot password
  app.post("/api/forgot-password", rateLimitRecovery, async (req, res) => {
    try {
      const { email } = z.object({
        email: z.string().email(),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      
      if (user) {
        const resetCode = generateVerificationCode();
        const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await storage.updateUser(user.id, {
          passwordResetCode: resetCode,
          passwordResetExpiry: resetExpiry,
        } as any);
        void sendPasswordResetEmail(user.email, user.firstName, resetCode).catch(err => 
          console.error('[RECOVERY] Failed to send password reset email:', err)
        );
      }
      
      const jitter = Math.floor(Math.random() * 100);
      await new Promise(resolve => setTimeout(resolve, 350 + jitter));

      res.json({ message: "Si el email existe, recibirás un código de recuperación" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al procesar solicitud" });
    }
  });

  // Reset password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = z.object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(8),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (!user.passwordResetCode || user.passwordResetCode !== code) {
        return res.status(400).json({ error: "Código de recuperación incorrecto" });
      }

      if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        return res.status(400).json({ error: "El código de recuperación ha expirado" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetCode: undefined,
        passwordResetExpiry: undefined,
      } as any);

      res.json({ message: "Contraseña restablecida correctamente" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al restablecer contraseña" });
    }
  });

  // Get current user
  app.get("/api/user", isAuthenticated, (req, res) => {
    if (req.user) {
      const { password, ...userWithoutPassword } = req.user as any;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "No autenticado" });
    }
  });

  // Update patient profile (with email re-verification) - MUST be before /api/user/:id
  app.patch("/api/user/update-profile", isPatientForProfileUpdate, async (req, res) => {
    try {
      const validatedData = z.object({
        firstName: z.string().min(1, "El nombre es requerido"),
        lastName: z.string().min(1, "El apellido es requerido"),
        email: z.string().email("Email inválido"),
        currentPassword: z.string().min(1, "La contraseña es requerida"),
      }).parse(req.body);

      const user = req.user as any;
      const currentUser = await storage.getUser(user.id);
      
      if (!currentUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Verificar la contraseña actual
      const isValidPassword = await bcrypt.compare(validatedData.currentPassword, currentUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "La contraseña actual es incorrecta" });
      }

      // Remover currentPassword del objeto de actualización
      const { currentPassword, ...updateData } = validatedData;

      const emailChanged = updateData.email !== currentUser.email;

      if (emailChanged) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(400).json({ error: "Este email ya está en uso" });
        }

        const verificationToken = nanoid(32);
        const waitToken = nanoid(32);

        await storage.updateUser(user.id, {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          email: updateData.email,
          emailVerified: false,
          verificationToken,
          waitToken,
        } as any);

        try {
          await sendVerificationEmail(updateData.email, updateData.firstName, verificationToken);
        } catch (emailError) {
          console.error("Error sending verification email:", emailError);
        }

        await new Promise<void>((resolve, reject) => {
          req.logout((err) => {
            if (err) {
              console.error('Error during logout:', err);
              return reject(err);
            }
            resolve();
          });
        });

        if (req.session) {
          await new Promise<void>((resolve, reject) => {
            req.session.destroy((err) => {
              if (err) {
                console.error('Error destroying session:', err);
                return reject(err);
              }
              resolve();
            });
          });
        }

        if (req.isAuthenticated && req.isAuthenticated()) {
          console.error('⚠️ WARNING: Session still active after logout attempt');
        }

        res.json({ 
          message: "Perfil actualizado. Por favor verifica tu nuevo email", 
          emailChanged: true
        });
      } else {
        await storage.updateUser(user.id, {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
        } as any);

        res.json({ 
          message: "Perfil actualizado correctamente", 
          emailChanged: false 
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al actualizar perfil" });
    }
  });

  // Update user
  app.patch("/api/user/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user as any;
      
      if (currentUser.id !== id && currentUser.role !== 'admin') {
        return res.status(403).json({ 
          error: "No tiene permisos para actualizar este usuario" 
        });
      }
      
      const validatedData = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        profileImage: z.string().optional(),
        dni: z.string().optional(),
        direccion: z.string().optional(),
        dateOfBirth: z.string().optional(),
        bloodType: z.string().optional(),
        healthInsurance: z.string().optional(),
        allergies: z.array(z.string()).optional(),
        chronicConditions: z.array(z.string()).optional(),
        currentMedications: z.array(z.string()).optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        currentPassword: z.string().optional(),
      }).parse(req.body);
      
      // Get old user data for history tracking
      const oldUser = await storage.getUser(id);
      if (!oldUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Solo pacientes que modifican sus propios datos requieren contraseña
      const isUpdatingSelf = currentUser.id === id;
      if (isUpdatingSelf && currentUser.role === 'patient') {
        if (!validatedData.currentPassword) {
          return res.status(400).json({ error: "La contraseña es requerida para modificar tus datos" });
        }
        
        // Verificar la contraseña actual
        const isValidPassword = await bcrypt.compare(validatedData.currentPassword, oldUser.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: "La contraseña actual es incorrecta" });
        }
      }

      // Remover currentPassword del objeto de actualización
      const { currentPassword, ...updateData } = validatedData;
      
      const user = await storage.updateUser(id, updateData as any);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      // Track modifications in history
      const changedFields: string[] = [];
      Object.keys(updateData).forEach(key => {
        const oldValue = (oldUser as any)[key];
        const newValue = (updateData as any)[key];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changedFields.push(key);
        }
      });
      
      if (changedFields.length > 0) {
        await storage.createModificationHistory({
          userId: id,
          modifiedBy: currentUser.id,
          modifiedFields: changedFields,
          timestamp: new Date(),
          previousValues: changedFields.reduce((acc, field) => {
            acc[field] = (oldUser as any)[field];
            return acc;
          }, {} as Record<string, any>),
          newValues: changedFields.reduce((acc, field) => {
            acc[field] = (updateData as any)[field];
            return acc;
          }, {} as Record<string, any>),
        });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  });

  // Change password
  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const validatedData = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      }).parse(req.body);

      const user = req.user as any;
      const result = await storage.changePassword(
        user.id,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al cambiar contraseña" });
    }
  });

  // Get all doctors
  app.get("/api/doctors", isAuthenticated, async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener médicos" });
    }
  });

  // Get doctors by specialty
  app.get("/api/doctors/specialty/:specialty", isAuthenticated, async (req, res) => {
    try {
      const { specialty } = req.params;
      const doctors = await storage.getDoctorsBySpecialty(specialty);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener médicos" });
    }
  });

  // Get all appointments (admin only)
  app.get("/api/appointments", isAdmin, async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener citas" });
    }
  });

  // Get doctor's appointments for availability checking (authenticated users)
  app.get("/api/appointments/doctor/:doctorId", isAuthenticated, async (req, res) => {
    try {
      const { doctorId } = req.params;
      const allAppointments = await storage.getAppointmentsByDoctor(doctorId);
      
      // Return only necessary fields for availability checking (no sensitive patient info)
      const sanitizedAppointments = allAppointments.map(apt => ({
        id: apt.id,
        doctorId: apt.doctorId,
        doctorName: apt.doctorName,
        date: apt.date,
        time: apt.time,
        status: apt.status,
      }));
      
      res.json(sanitizedAppointments);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener citas del doctor" });
    }
  });

  // Get patient's own appointments
  app.get("/api/appointments/my-appointments", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const appointments = await storage.getAppointmentsByEmail(user.email);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener citas" });
    }
  });

  // Get doctor's own appointments with full patient information
  app.get("/api/doctors/my-appointments", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.doctorId) {
        return res.status(400).json({ error: "Usuario no tiene doctorId asociado" });
      }
      const appointments = await storage.getAppointmentsByDoctor(user.doctorId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener citas del médico" });
    }
  });

  // Get patient info for doctor (by appointment)
  app.get("/api/doctors/patient-info/:appointmentId", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      const { appointmentId } = req.params;

      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.doctorId !== user.doctorId) {
        return res.status(403).json({ error: "No tienes permiso para ver este paciente" });
      }

      const patient = await storage.getUserByEmail(appointment.patientEmail);
      const medicalRecords = await storage.getMedicalRecordsByEmail(appointment.patientEmail);
      const prescriptions = await storage.getPrescriptionsByEmail(appointment.patientEmail);
      const diagnoses = await storage.getDiagnosesByEmail(appointment.patientEmail);
      const studies = await storage.getMedicalStudiesByEmail(appointment.patientEmail);
      const preConsultForm = await storage.getPreConsultForm(appointmentId);

      res.json({
        patient: patient ? {
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          dni: patient.dni,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          direccion: patient.direccion,
          bloodType: patient.bloodType,
          allergies: patient.allergies,
          chronicConditions: patient.chronicConditions,
          currentMedications: patient.currentMedications,
          healthInsurance: patient.healthInsurance,
          emergencyContactName: patient.emergencyContactName,
          emergencyContactPhone: patient.emergencyContactPhone,
        } : null,
        appointment,
        medicalRecords: medicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        prescriptions: prescriptions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        diagnoses: diagnoses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        studies: studies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        preConsultForm,
      });
    } catch (error) {
      console.error("Error getting patient info:", error);
      res.status(500).json({ error: "Error al obtener información del paciente" });
    }
  });

  // Create prescription (doctor)
  app.post("/api/doctors/create-prescription", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate input
      const validatedData = createPrescriptionSchema.parse(req.body);

      const appointment = await storage.getAppointment(validatedData.appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.doctorId !== user.doctorId) {
        return res.status(403).json({ error: "No tienes permiso para crear recetas para este paciente" });
      }

      const medicalRecordId = randomUUID();

      // Sanitize data before storing
      const prescription = await storage.createPrescription({
        medicalRecordId,
        patientEmail: appointment.patientEmail,
        patientDni: appointment.patientDni,
        doctorId: user.doctorId,
        doctorName: appointment.doctorName,
        medication: validatedData.medication.trim(),
        dosage: validatedData.dosage.trim(),
        frequency: validatedData.frequency.trim(),
        duration: validatedData.duration.trim(),
        instructions: validatedData.instructions?.trim() || '',
        date: new Date().toISOString().split('T')[0],
      });

      // Send email notification to patient (sanitization happens in email.ts)
      try {
        await sendPrescriptionNotification(
          appointment.patientEmail,
          appointment.patientName,
          appointment.doctorName,
          validatedData.medication.trim(),
          validatedData.dosage.trim(),
          validatedData.frequency.trim(),
          validatedData.duration.trim(),
          validatedData.instructions?.trim() || ''
        );
      } catch (emailError) {
        console.error("Error sending prescription email:", emailError);
      }

      res.json({ success: true, prescription });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating prescription:", error);
      res.status(500).json({ error: "Error al crear receta" });
    }
  });

  // Create diagnosis (doctor)
  app.post("/api/doctors/create-diagnosis", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate input
      const validatedData = createDiagnosisSchema.parse(req.body);

      const appointment = await storage.getAppointment(validatedData.appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.doctorId !== user.doctorId) {
        return res.status(403).json({ error: "No tienes permiso para crear diagnósticos para este paciente" });
      }

      const medicalRecordId = randomUUID();

      const diagnosis = await storage.createDiagnosis({
        medicalRecordId,
        patientEmail: appointment.patientEmail,
        patientDni: appointment.patientDni,
        doctorId: user.doctorId,
        doctorName: appointment.doctorName,
        condition: validatedData.condition.trim(),
        description: validatedData.description?.trim() || '',
        severity: validatedData.severity || 'moderado',
        date: new Date().toISOString().split('T')[0],
      });

      res.json({ success: true, diagnosis });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating diagnosis:", error);
      res.status(500).json({ error: "Error al crear diagnóstico" });
    }
  });

  // Create medical study (doctor)
  app.post("/api/doctors/create-study", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate input
      const validatedData = createStudySchema.parse(req.body);

      const appointment = await storage.getAppointment(validatedData.appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.doctorId !== user.doctorId) {
        return res.status(403).json({ error: "No tienes permiso para crear estudios para este paciente" });
      }

      const study = await storage.createMedicalStudy({
        medicalRecordId: randomUUID(),
        patientEmail: appointment.patientEmail,
        patientDni: appointment.patientDni,
        studyType: validatedData.studyType.trim(),
        studyName: validatedData.studyName.trim(),
        result: validatedData.result?.trim() || '',
        observations: validatedData.observations?.trim() || '',
        date: new Date().toISOString().split('T')[0],
      });

      res.json({ success: true, study });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating study:", error);
      res.status(500).json({ error: "Error al crear estudio" });
    }
  });

  // Create/Update medical record (doctor)
  app.post("/api/doctors/create-medical-record", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate input
      const validatedData = createMedicalRecordSchema.parse(req.body);

      const appointment = await storage.getAppointment(validatedData.appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.doctorId !== user.doctorId) {
        return res.status(403).json({ error: "No tienes permiso para modificar el historial de este paciente" });
      }

      const record = await storage.createMedicalRecord({
        patientDni: appointment.patientDni,
        patientEmail: appointment.patientEmail,
        appointmentId: appointment.id,
        doctorId: user.doctorId,
        doctorName: appointment.doctorName,
        date: new Date().toISOString().split('T')[0],
        diagnosis: validatedData.diagnosis?.trim() || '',
        notes: validatedData.notes?.trim() || '',
      });

      res.json({ success: true, record });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating medical record:", error);
      res.status(500).json({ error: "Error al crear registro médico" });
    }
  });

  // Complete consultation (doctor)
  app.post("/api/doctors/complete-consultation", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate input
      const validatedData = completeConsultationSchema.parse(req.body);

      const appointment = await storage.getAppointment(validatedData.appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.doctorId !== user.doctorId) {
        return res.status(403).json({ error: "No tienes permiso para completar esta cita" });
      }

      await storage.updateAppointmentStatus(validatedData.appointmentId, 'completada');

      res.json({ success: true, message: "Consulta completada exitosamente" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error completing consultation:", error);
      res.status(500).json({ error: "Error al completar la consulta" });
    }
  });

  // Save doctor's consultation (diagnosis and medical history) - LEGACY
  app.post("/api/doctors/save-consultation", isDoctor, async (req, res) => {
    try {
      const user = req.user as any;
      const { appointmentId, diagnosis, medicalHistory } = req.body;

      if (!appointmentId) {
        return res.status(400).json({ error: "ID de cita requerido" });
      }

      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.doctorId !== user.doctorId) {
        return res.status(403).json({ error: "No tienes permiso para modificar esta cita" });
      }

      const medicalRecordId = randomUUID();

      if (medicalHistory) {
        await storage.createMedicalRecord({
          patientDni: appointment.patientDni,
          patientEmail: appointment.patientEmail,
          appointmentId: appointment.id,
          doctorId: user.doctorId,
          doctorName: appointment.doctorName,
          date: new Date().toISOString().split('T')[0],
          diagnosis: diagnosis || '',
          notes: medicalHistory,
        });
      }

      if (diagnosis) {
        await storage.createDiagnosis({
          medicalRecordId: medicalRecordId,
          patientDni: appointment.patientDni,
          patientEmail: appointment.patientEmail,
          doctorId: user.doctorId,
          doctorName: appointment.doctorName,
          condition: diagnosis,
          description: medicalHistory || '',
          severity: 'moderado',
          date: new Date().toISOString().split('T')[0],
        });
      }

      await storage.updateAppointmentStatus(appointmentId, 'completada');

      res.json({ success: true, message: "Consulta guardada exitosamente" });
    } catch (error) {
      console.error("Error saving consultation:", error);
      res.status(500).json({ error: "Error al guardar la consulta" });
    }
  });

  // Get patient's medical records
  app.get("/api/medical-records/my-records", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const records = await storage.getMedicalRecordsByEmail(user.email);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener historial médico" });
    }
  });

  // Get patient's prescriptions
  app.get("/api/prescriptions/my-prescriptions", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const prescriptions = await storage.getPrescriptionsByEmail(user.email);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener recetas" });
    }
  });

  // Get patient's latest diagnosis
  app.get("/api/diagnoses/latest", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const records = await storage.getMedicalRecordsByEmail(user.email);
      
      if (records.length === 0) {
        return res.json(null);
      }

      const latestRecord = records.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      res.json({
        id: latestRecord.id,
        diagnosis: latestRecord.diagnosis,
        notes: latestRecord.notes,
        doctorName: latestRecord.doctorName,
        date: latestRecord.date,
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener diagnóstico" });
    }
  });

  // Confirm appointment (patient)
  app.patch("/api/appointments/:id/confirm", isPatient, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.patientEmail !== user.email) {
        return res.status(403).json({ error: "No tienes permiso para confirmar esta cita" });
      }

      const updated = await storage.updateAppointment(id, {
        status: 'confirmada',
        confirmedBy: 'patient'
      } as any);

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al confirmar cita" });
    }
  });

  // Cancel appointment (patient)
  app.patch("/api/appointments/:id/cancel", isPatient, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const { reason } = req.body;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.patientEmail !== user.email) {
        return res.status(403).json({ error: "No tienes permiso para cancelar esta cita" });
      }

      const updated = await storage.updateAppointment(id, {
        status: 'cancelada',
        cancelledBy: 'patient',
        cancellationReason: reason || 'Cancelado por el paciente'
      } as any);

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al cancelar cita" });
    }
  });

  // Create new appointment
  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      if (user.role === 'patient') {
        if (validatedData.patientEmail !== user.email) {
          return res.status(403).json({ 
            error: "Los pacientes solo pueden crear citas para sí mismos" 
          });
        }
        validatedData.patientName = `${user.firstName} ${user.lastName}`;
      }
      
      // Auto-link appointment to patient account by DNI (intelligent feature)
      if (user.role === 'admin' && validatedData.patientDni) {
        const patientByDni = await storage.getUserByDni(validatedData.patientDni);
        if (patientByDni) {
          // Patient has an account, link appointment to their account
          validatedData.patientEmail = patientByDni.email;
          validatedData.patientName = `${patientByDni.firstName} ${patientByDni.lastName}`;
          console.log(`Auto-linked appointment to patient account: ${patientByDni.email}`);
        }
      }
      
      const result = await storage.createAppointment(validatedData);
      
      if ('error' in result) {
        return res.status(400).json({ error: result.error });
      }
      
      // Enviar email de confirmación automáticamente
      const emailSent = await sendAppointmentConfirmation(result);
      if (!emailSent) {
        console.warn('No se pudo enviar email de confirmación. La cita se creó correctamente pero el paciente no recibió el comprobante.');
      }
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Error al crear cita" });
    }
  });

  // Update appointment (admin only)
  app.patch("/api/appointments/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = z.object({
        patientName: z.string().min(1).optional(),
        patientDni: z.string().min(1).optional(),
        patientEmail: z.string().email().optional(),
        doctorId: z.string().optional(),
        doctorName: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
        reason: z.string().min(1).optional(),
        status: z.string().optional(),
      }).parse(req.body);
      
      const appointment = await storage.updateAppointment(id, validatedData);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al actualizar cita" });
    }
  });

  // Update appointment status (admin only)
  app.patch("/api/appointments/:id/status", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = z.object({
        status: z.enum(['pendiente', 'confirmada', 'cancelada', 'completada']),
        cancellationReason: z.string().optional(),
      }).parse(req.body);
      
      // Si se está cancelando, el motivo es OBLIGATORIO
      if (validatedData.status === 'cancelada') {
        if (!validatedData.cancellationReason || !validatedData.cancellationReason.trim()) {
          return res.status(400).json({ 
            error: "El motivo de cancelación es obligatorio",
            details: [{
              code: "custom",
              path: ["cancellationReason"],
              message: "El motivo de cancelación es obligatorio"
            }]
          });
        }
        
        const updateData: any = {
          status: validatedData.status,
          cancelledBy: 'admin',
          cancellationReason: validatedData.cancellationReason.trim(),
        };
        
        const appointment = await storage.updateAppointment(id, updateData);
        
        if (!appointment) {
          return res.status(404).json({ error: "Cita no encontrada" });
        }
        
        // Enviar email con el motivo de cancelación desde el appointment actualizado
        if (appointment.patientEmail) {
          const emailSent = await sendCancellationEmail(
            appointment, 
            appointment.cancellationReason
          );
          if (!emailSent) {
            console.warn('No se pudo enviar email de cancelación. La cita se canceló correctamente pero el paciente no recibió la notificación.');
          }
        }
        
        return res.json(appointment);
      }
      
      // Para otros estados, actualizar normalmente
      const appointment = await storage.updateAppointmentStatus(id, validatedData.status);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Estado inválido", details: error.errors });
      }
      res.status(500).json({ error: "Error al actualizar cita" });
    }
  });

  // Get all offices (admin only)
  app.get("/api/offices", isAdmin, async (req, res) => {
    try {
      const offices = await storage.getAllOffices();
      res.json(offices);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener consultorios" });
    }
  });

  // Get all office assignments (authenticated users - needed for patients to see available slots)
  app.get("/api/office-assignments", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getAllOfficeAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener asignaciones" });
    }
  });

  // Create office assignment (admin only)
  app.post("/api/office-assignments", isAdmin, async (req, res) => {
    try {
      const validatedData = z.object({
        officeId: z.string(),
        officeName: z.string(),
        doctorId: z.string(),
        doctorName: z.string(),
        month: z.number().min(1).max(12),
        year: z.number().min(2024),
        weekDays: z.array(z.number().min(0).max(6)),
        startTime: z.string(),
        endTime: z.string(),
      }).parse(req.body);

      const result = await storage.createOfficeAssignment(validatedData);
      
      if ('error' in result) {
        return res.status(409).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating office assignment:", error);
      res.status(500).json({ error: "Error al crear asignación" });
    }
  });

  // Update office assignment (admin only)
  app.patch("/api/office-assignments/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = z.object({
        officeId: z.string(),
        officeName: z.string(),
        doctorId: z.string(),
        doctorName: z.string(),
        month: z.number().min(1).max(12),
        year: z.number().min(2024),
        weekDays: z.array(z.number().min(0).max(6)),
        startTime: z.string(),
        endTime: z.string(),
      }).parse(req.body);

      const result = await storage.updateOfficeAssignment(id, validatedData);
      
      if (!result) {
        return res.status(404).json({ error: "Asignación no encontrada" });
      }

      if ('error' in result) {
        return res.status(409).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating office assignment:", error);
      res.status(500).json({ error: "Error al actualizar asignación" });
    }
  });

  // Delete office assignment (admin only)
  app.delete("/api/office-assignments/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteOfficeAssignment(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Asignación no encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar asignación" });
    }
  });

  // Check office availability
  app.post("/api/offices/check-availability", isAuthenticated, async (req, res) => {
    try {
      const validatedData = z.object({
        officeId: z.string(),
        month: z.number().min(1).max(12),
        year: z.number().min(2024),
        weekDays: z.array(z.number().min(0).max(6)),
        startTime: z.string(),
        endTime: z.string(),
      }).parse(req.body);

      const availability = await storage.checkOfficeAvailability(
        validatedData.officeId,
        validatedData.month,
        validatedData.year,
        validatedData.weekDays,
        validatedData.startTime,
        validatedData.endTime
      );

      res.json(availability);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al verificar disponibilidad" });
    }
  });

  // Confirm appointment (patient)
  app.patch("/api/appointments/:id/confirm", isPatient, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.patientEmail !== user.email) {
        return res.status(403).json({ error: "No tienes permiso para confirmar esta cita" });
      }

      const updated = await storage.updateAppointment(id, {
        status: 'confirmada',
      });

      if (updated) {
        (updated as any).confirmedBy = 'patient';
        await storage.updateAppointment(id, updated as any);
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al confirmar cita" });
    }
  });

  // Cancel appointment (patient)
  app.post("/api/appointments/:id/cancel", isPatient, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const { cancellationReason } = z.object({
        cancellationReason: z.string().min(1, "El motivo de cancelación es requerido"),
      }).parse(req.body);
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.patientEmail !== user.email) {
        return res.status(403).json({ error: "No tienes permiso para cancelar esta cita" });
      }

      // Check if appointment is at least 24 hours away
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        return res.status(400).json({ 
          error: "No se puede cancelar con menos de 24 horas de anticipación" 
        });
      }

      const updated = await storage.updateAppointment(id, {
        status: 'cancelada',
        cancellationReason,
      } as any);

      if (updated) {
        (updated as any).cancelledBy = 'patient';
        await storage.updateAppointment(id, updated as any);
        
        await storage.createAppointmentCancellation({
          appointmentId: id,
          reason: cancellationReason,
          cancelledBy: 'patient',
          cancelledAt: new Date(),
        });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al cancelar cita" });
    }
  });

  // Update medical profile
  app.patch("/api/patient/medical-profile", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = z.object({
        allergies: z.array(z.string()).optional(),
        chronicConditions: z.array(z.string()).optional(),
        currentMedications: z.array(z.string()).optional(),
        bloodType: z.string().optional(),
        healthInsurance: z.string().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
      }).parse(req.body);

      const updated = await storage.updateUser(user.id, validatedData as any);
      if (!updated) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al actualizar perfil médico" });
    }
  });

  // Get medical profile
  app.get("/api/patient/medical-profile", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const userProfile = await storage.getUser(user.id);
      
      if (!userProfile) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const { password, passwordResetCode, ...profile } = userProfile;
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener perfil médico" });
    }
  });

  // Get user modification history
  app.get("/api/user/modification-history", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const history = await storage.getUserModificationHistory(user.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener historial de modificaciones" });
    }
  });

  // Get pre-consult form
  app.get("/api/appointments/:id/pre-consult-form", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const form = await storage.getPreConsultForm(id);
      
      if (!form) {
        return res.status(404).json({ error: "Formulario no encontrado" });
      }

      res.json(form);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener formulario" });
    }
  });

  // Create/update pre-consult form
  app.post("/api/appointments/:id/pre-consult-form", isPatient, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.patientEmail !== user.email) {
        return res.status(403).json({ error: "No tienes permiso para llenar este formulario" });
      }

      const validatedData = z.object({
        currentSymptoms: z.string().min(1),
        symptomDuration: z.string().min(1),
        symptomIntensity: z.number().min(1).max(10),
        medicationTaken: z.string().optional(),
        currentAllergies: z.string().optional(),
      }).parse(req.body);

      const form = await storage.createPreConsultForm({
        appointmentId: id,
        patientEmail: user.email,
        ...validatedData,
      });

      res.status(201).json(form);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al guardar formulario" });
    }
  });

  // Get medical records
  app.get("/api/medical-records/my-records", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const records = await storage.getMedicalRecordsByEmail(user.email);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener registros médicos" });
    }
  });

  // Get prescriptions
  app.get("/api/prescriptions/my-prescriptions", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const prescriptions = await storage.getPrescriptionsByEmail(user.email);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener recetas" });
    }
  });

  // Get diagnoses
  app.get("/api/diagnoses/my-diagnoses", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const diagnoses = await storage.getDiagnosesByEmail(user.email);
      res.json(diagnoses);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener diagnósticos" });
    }
  });

  // Get medical studies
  app.get("/api/medical-studies/my-studies", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const studies = await storage.getMedicalStudiesByEmail(user.email);
      res.json(studies);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener estudios" });
    }
  });

  // Reschedule appointment
  app.post("/api/appointments/:id/reschedule", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const { date, time, reason } = z.object({
        date: z.string().min(1),
        time: z.string().min(1),
        reason: z.string().optional(),
      }).parse(req.body);
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      // Check permissions
      if (user.role === 'patient' && appointment.patientEmail !== user.email) {
        return res.status(403).json({ error: "No tienes permiso para reagendar esta cita" });
      }

      // Check if rescheduling with enough notice
      if (user.role === 'patient') {
        const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
        const now = new Date();
        const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilAppointment < 24) {
          return res.status(400).json({ 
            error: "No se puede reagendar con menos de 24 horas de anticipación" 
          });
        }
      }

      const updated = await storage.updateAppointment(id, {
        date,
        time,
        status: 'pendiente',
      } as any);

      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al reagendar cita" });
    }
  });

  // Search available appointment slots
  app.post("/api/appointments/search-availability", isAuthenticated, async (req, res) => {
    try {
      const { doctorId, startDate, endDate, preferredTimes } = z.object({
        doctorId: z.string().min(1),
        startDate: z.string().min(1),
        endDate: z.string().optional(),
        preferredTimes: z.array(z.string()).optional(),
      }).parse(req.body);

      // Get all appointments for the doctor in the date range
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Generate available slots (8 AM to 6 PM, 30-minute slots)
      const availableSlots: { date: string; time: string }[] = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) continue; // Skip Sundays
        
        const dateStr = d.toISOString().split('T')[0];
        
        for (let hour = 8; hour < 18; hour++) {
          for (let minute of [0, 30]) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Check if slot is already taken
            const isTaken = appointments.some((apt: Appointment) => 
              apt.date === dateStr && apt.time === time && apt.status !== 'cancelada'
            );
            
            if (!isTaken) {
              availableSlots.push({ date: dateStr, time });
            }
          }
        }
      }

      // Filter by preferred times if provided
      let filteredSlots = availableSlots;
      if (preferredTimes && preferredTimes.length > 0) {
        filteredSlots = availableSlots.filter(slot => 
          preferredTimes.some(pt => slot.time.startsWith(pt))
        );
      }

      res.json({ 
        availableSlots: filteredSlots.slice(0, 50),
        total: filteredSlots.length 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al buscar disponibilidad" });
    }
  });

  // Delete user account (soft delete)
  app.delete("/api/user/account", isPatient, async (req, res) => {
    try {
      const user = req.user as any;
      const { password } = z.object({
        password: z.string().min(1),
      }).parse(req.body);

      // Verify password
      const userFromDb = await storage.getUser(user.id);
      if (!userFromDb) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const isValidPassword = await bcrypt.compare(password, userFromDb.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      // Soft delete user
      await storage.deleteUser(user.id);

      // Cancel all future appointments
      const appointments = await storage.getAppointmentsByEmail(user.email);
      const now = new Date();
      
      for (const appointment of appointments) {
        const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
        if (appointmentDate > now && appointment.status !== 'cancelada') {
          await storage.updateAppointment(appointment.id, {
            status: 'cancelada',
            cancellationReason: 'Cuenta eliminada',
          } as any);
          
          await storage.createAppointmentCancellation({
            appointmentId: appointment.id,
            reason: 'Cuenta eliminada',
            cancelledBy: 'patient',
            cancelledAt: new Date(),
          });
        }
      }

      // Logout and destroy session
      req.logout((err) => {
        if (err) {
          console.error("Error al cerrar sesión:", err);
        }
        req.session.destroy((err) => {
          if (err) {
            console.error("Error al destruir sesión:", err);
          }
          res.clearCookie('connect.sid');
          res.json({ message: "Cuenta eliminada correctamente" });
        });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al eliminar cuenta" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
