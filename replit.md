# Medical Clinic Management System

## Overview
This full-stack medical clinic management system, built with React, TypeScript, and Express, provides a comprehensive platform for managing appointments, doctors, and patient information. It features a professional landing page and secure dual-portal access for administrators, patients, and doctors. The system aims to streamline clinic operations and enhance patient care through robust role-based access control, automated email confirmations, dynamic scheduling, and intelligent patient-to-appointment linking via DNI. It uses in-memory data storage for rapid development and testing.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The frontend utilizes React 18, TypeScript, Vite, Tailwind CSS, and `shadcn/ui` for a modern, responsive interface. It features a professional landing page with clinic branding, separate public and role-specific routes, and visually appealing dashboards. Dashboards include gradient color schemes, smooth animations (framer-motion), personalized greetings, vibrant stat cards, and area charts. All UI text is in Spanish, and the design is responsive. A triple-portal landing page offers distinct visual themes for admin (sky/teal), patient (violet/purple), and doctor (emerald/green) logins.

### Technical Implementations
- **Authentication & Authorization:** Implements a secure multi-portal architecture using Passport.js local strategy, bcrypt for password hashing, and `express-session`. It features robust role-based access control with `isAuthenticated`, `isAdmin`, `isPatient`, and `isDoctor` middlewares, and ownership verification. Both patient and doctor accounts include complete registration and recovery flows. Patient account recovery uses DNI-based username recovery and email-based password reset. Doctor account recovery uses Matricula-based username recovery (with validation: starts with 1, ends with 3) and email-based password reset. All recovery endpoints include timing attack mitigation and rate limiting.
- **Email Notifications:** Integrates with the Resend API for automatic transactional email confirmations for appointments and email verification during patient registration. Emails are sent from `noreply@medicalclinica.online` using professional HTML templates. Email verification is link-based with unique tokens and an auto-refreshing waiting page. Email changes trigger re-verification and session logout.
- **Appointment Management:** Provides CRUD operations for appointments, including status tracking (using Spanish values: 'pendiente', 'confirmada', 'cancelada', 'completada'), patient details, visual weekly calendars, dynamic slot generation based on office assignments, and validation to prevent double-booking. Admin-initiated cancellations require a mandatory reason, which is included in patient notification emails.
- **Office Management:** Supports assigning doctors to offices with detailed monthly schedules, including specific weekdays and time ranges, with smart conflict detection.
- **Data Storage:** Uses in-memory RAM-based storage (`MemStorage`) for development and testing, pre-initialized with sample data including admin, test patients, doctors, offices, and auto-generated office assignments. Data is not persistent across server restarts.
- **Smart Appointment Linking:** Automatically links appointments to registered patient accounts via DNI when created by administrators.
- **Appointment Availability Search:** Provides endpoints to search for available appointment slots by doctor and date range, and a doctor-specific endpoint to check availability without sensitive patient information.

### Feature Specifications
- **Landing Page:** Professional presentation with hero imagery and triple-portal access cards for admin, patients, and doctors with distinct color schemes.
- **Authentication System:** Separate login pages for Admin (`/admin/login`), Patients (`/pacientes/login`), and Doctors (`/medicos/login`), with role verification and session management. Both patient and doctor registration include email verification with unique tokens and auto-refreshing waiting pages. Login pages include links to registration and account recovery options.
- **Patient Registration & Recovery:** Complete registration flow at `/pacientes/registro` with email verification. Account recovery accessible from patient login, offering DNI-based username recovery and 2-step email verification code-based password reset. All endpoints are hardened against enumeration attacks with fire-and-forget email sending, randomized delays, generic responses, and IP-based rate limiting.
- **Doctor Registration & Recovery:** Complete registration flow at `/medicos/registro` with Matricula field (medical license number) and email verification. Matricula validation requires it to start with 1 and end with 3. Account recovery accessible from doctor login (`/medicos/recuperar-seleccion`), offering Matricula-based username recovery and email-based password reset. Recovery flows mirror patient functionality with emerald/green theme instead of violet/purple.
- **Appointment Handling:** Full CRUD for appointments with status tracking, patient information, and print functionality.
- **Doctor & Office Management:** Directories for doctors and offices, with detailed scheduling, conflict detection, and assignment certificate generation.
- **Dynamic Scheduling:** Real-time generation of appointment time slots based on doctor's office assignments.
- **Admin Interface:** Streamlined dashboard with stats, a TaskList, personalized greetings, and logout. Administrators can view, confirm, and cancel appointments.
- **Doctor Interface:** Professional portal with an emerald/green theme, personalized dashboard with Quick Actions section for accessing shift management and schedules. The header includes a "Inicio" button for returning to the dashboard. Includes a dedicated "Turnos del Día" (Daily Shifts) page at `/medicos/turnos` with an active patient consultation workflow:
  - Sequential patient queue system with "Comenzar Atención" (Start Attending) button
  - Displays current patient details (name, DNI, email, time, appointment reason)
  - Consultation forms for recording diagnosis and medical history (both required)
  - Navigation controls: "Siguiente Paciente" (enabled only when both fields are filled), "Saltear por Ausencia" (Skip for Absence), and "Resetear" (Reset)
  - Absent patient management: maintains a separate list of skipped patients with option to resume consultation later
  - ID-based patient tracking (not index-based) to prevent queue desynchronization during React Query refetches
  - Automatic queue advancement after completing consultation and saving records
  - Automatic session end when all patients are attended or queue is empty
  - Backend endpoint `/api/doctors/save-consultation` saves diagnosis and medical history, marks appointments as "completada"
- **Patient Interface:** Modern, responsive portal with personalized header, logout functionality, and a Quick Actions component for medical history, diagnosis, prescriptions, managing existing appointments (confirm/cancel), and booking new appointments.
- **Patient Profile Management:** Allows patients to edit name and email, with email changes triggering re-verification and session logout.
- **Patient Quick Actions:** Interactive dashboard component for viewing medical data and managing/booking appointments, including specialty and doctor selection, calendar view, availability checking, and double-booking prevention.
- **Auto-Initialization:** Automatically generates random office schedules for all doctors upon server startup.

### System Design Choices
- **Fullstack TypeScript:** Ensures consistency and type safety across the application.
- **Modular Project Structure:** Clear separation between client and server.
- **Build Process:** Vite for frontend and esbuild for backend.
- **Session-based Authentication:** Leverages `express-session` for secure user session management.

## External Dependencies

- **Frontend:**
    - React 18
    - TypeScript
    - Vite
    - Tailwind CSS
    - `shadcn/ui`
    - `date-fns`
    - React Query
    - `framer-motion`
    - `recharts`
- **Backend:**
    - Express.js
    - TypeScript
    - Passport.js
    - `express-session`
    - `bcrypt`
    - `tsx`
    - `esbuild`
    - Resend (for email services)