import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface User {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: 'admin' | 'patient' | 'doctor';
  profileImage?: string;
  dni?: string;
  direccion?: string;
  dateOfBirth?: string;
  bloodType?: string;
  healthInsurance?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emailVerified?: boolean;
  verificationToken?: string;
  waitToken?: string;
  passwordResetCode?: string;
  passwordResetExpiry?: Date;
  lastLogin?: Date;
  deleted?: boolean;
  doctorId?: string;
}

export interface InsertUser {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role: 'admin' | 'patient' | 'doctor';
  profileImage?: string;
  doctorId?: string;
}

export interface UpdateUser {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  profileImage?: string;
  dni?: string;
  direccion?: string;
  dateOfBirth?: string;
  bloodType?: string;
  healthInsurance?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emailVerified?: boolean;
  verificationToken?: string;
  waitToken?: string;
  passwordResetCode?: string;
  passwordResetExpiry?: Date;
  lastLogin?: Date;
  deleted?: boolean;
  password?: string;
  doctorId?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientDni: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: Date;
  confirmedBy?: 'admin' | 'patient' | null;
  cancelledBy?: 'admin' | 'patient' | null;
  cancellationReason?: string;
  preConsultFormId?: string;
  reminderSent?: boolean;
}

export interface InsertAppointment {
  patientName: string;
  patientDni: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status?: string;
}

export interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  matricula: string;
  availableSlots: string[];
}

export interface InsertDoctor {
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  matricula: string;
  availableSlots: string[];
}

export interface Office {
  id: string;
  name: string;
  specialty: string;
  capacity: number;
  equipment: string[];
}

export interface InsertOffice {
  name: string;
  specialty: string;
  capacity: number;
  equipment: string[];
}

export interface OfficeAssignment {
  id: string;
  officeId: string;
  officeName: string;
  doctorId: string;
  doctorName: string;
  month: number;
  year: number;
  weekDays: number[];
  startTime: string;
  endTime: string;
  createdAt: Date;
}

export interface InsertOfficeAssignment {
  officeId: string;
  officeName: string;
  doctorId: string;
  doctorName: string;
  month: number;
  year: number;
  weekDays: number[];
  startTime: string;
  endTime: string;
}

export interface MedicalRecord {
  id: string;
  patientEmail: string;
  patientDni: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  notes: string;
  createdAt: Date;
}

export interface Prescription {
  id: string;
  medicalRecordId: string;
  patientEmail: string;
  patientDni: string;
  doctorId: string;
  doctorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  date: string;
  createdAt: Date;
}

export interface Diagnosis {
  id: string;
  medicalRecordId: string;
  patientEmail: string;
  patientDni: string;
  doctorId: string;
  doctorName: string;
  condition: string;
  description: string;
  severity: 'leve' | 'moderado' | 'grave';
  date: string;
  createdAt: Date;
}

export interface MedicalStudy {
  id: string;
  medicalRecordId?: string;
  patientEmail: string;
  patientDni: string;
  studyType: string;
  studyName: string;
  result: string;
  observations: string;
  date: string;
  createdAt: Date;
}

export interface PreConsultForm {
  id: string;
  appointmentId: string;
  patientEmail: string;
  currentSymptoms: string;
  symptomDuration: string;
  symptomIntensity: number;
  medicationTaken?: string;
  currentAllergies?: string;
  createdAt: Date;
}

export interface UserModificationHistory {
  id: string;
  userId: string;
  modifiedFields: string[];
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
  modifiedBy: string;
  timestamp: Date;
}

export interface AppointmentCancellation {
  id: string;
  appointmentId: string;
  reason: string;
  cancelledBy: 'admin' | 'patient';
  cancelledAt: Date;
}

export interface IStorage {
  // User methods
  getAllUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByDni(dni: string): Promise<User | undefined>;
  getUserByMatricula(matricula: string): Promise<User | undefined>;
  checkDniExists(dni: string): Promise<boolean>;
  checkEmailExists(email: string): Promise<boolean>;
  checkMatriculaExists(matricula: string): Promise<boolean>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: UpdateUser): Promise<User | undefined>;
  changePassword(id: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }>;
  deleteUser(id: string): Promise<boolean>;
  
  // Appointment methods
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByEmail(email: string): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment | { error: string }>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
  updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment | undefined>;
  
  // Doctor methods
  getAllDoctors(): Promise<Doctor[]>;
  getDoctorsBySpecialty(specialty: string): Promise<Doctor[]>;
  getDoctor(id: string): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  
  // Office methods
  getAllOffices(): Promise<Office[]>;
  getOffice(id: string): Promise<Office | undefined>;
  createOffice(office: InsertOffice): Promise<Office>;
  
  // Office Assignment methods
  getAllOfficeAssignments(): Promise<OfficeAssignment[]>;
  getOfficeAssignment(id: string): Promise<OfficeAssignment | undefined>;
  createOfficeAssignment(assignment: InsertOfficeAssignment): Promise<OfficeAssignment | { error: string }>;
  updateOfficeAssignment(id: string, assignment: InsertOfficeAssignment): Promise<OfficeAssignment | { error: string } | undefined>;
  deleteOfficeAssignment(id: string): Promise<boolean>;
  checkOfficeAvailability(
    officeId: string,
    month: number,
    year: number,
    weekDays: number[],
    startTime: string,
    endTime: string,
    excludeAssignmentId?: string
  ): Promise<{ available: boolean; conflicts?: OfficeAssignment[] }>;
  checkDoctorAvailability(
    doctorId: string,
    month: number,
    year: number,
    weekDays: number[],
    startTime: string,
    endTime: string,
    excludeAssignmentId?: string
  ): Promise<{ available: boolean; conflicts?: OfficeAssignment[] }>;
  
  // Medical Record methods
  getMedicalRecordsByEmail(email: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt'>): Promise<MedicalRecord>;
  
  // Prescription methods
  getPrescriptionsByEmail(email: string): Promise<Prescription[]>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  createPrescription(prescription: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription>;
  
  // Diagnosis methods
  getDiagnosesByEmail(email: string): Promise<Diagnosis[]>;
  getDiagnosis(id: string): Promise<Diagnosis | undefined>;
  createDiagnosis(diagnosis: Omit<Diagnosis, 'id' | 'createdAt'>): Promise<Diagnosis>;
  
  // Medical Study methods
  getMedicalStudiesByEmail(email: string): Promise<MedicalStudy[]>;
  getMedicalStudy(id: string): Promise<MedicalStudy | undefined>;
  createMedicalStudy(study: Omit<MedicalStudy, 'id' | 'createdAt'>): Promise<MedicalStudy>;
  
  // Pre-Consult Form methods
  getPreConsultForm(appointmentId: string): Promise<PreConsultForm | undefined>;
  createPreConsultForm(form: Omit<PreConsultForm, 'id' | 'createdAt'>): Promise<PreConsultForm>;
  
  // User Modification History methods
  getUserModificationHistory(userId: string): Promise<UserModificationHistory[]>;
  createModificationHistory(history: Omit<UserModificationHistory, 'id'>): Promise<void>;
  
  // Appointment Cancellation methods
  createAppointmentCancellation(cancellation: Omit<AppointmentCancellation, 'id'>): Promise<AppointmentCancellation>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private appointments: Map<string, Appointment>;
  private doctors: Map<string, Doctor>;
  private offices: Map<string, Office>;
  private officeAssignments: Map<string, OfficeAssignment>;
  private medicalRecords: Map<string, MedicalRecord>;
  private prescriptions: Map<string, Prescription>;
  private diagnoses: Map<string, Diagnosis>;
  private medicalStudies: Map<string, MedicalStudy>;
  private preConsultForms: Map<string, PreConsultForm>;
  private userModificationHistory: Map<string, UserModificationHistory>;
  private appointmentCancellations: Map<string, AppointmentCancellation>;

  constructor() {
    this.users = new Map();
    this.appointments = new Map();
    this.doctors = new Map();
    this.offices = new Map();
    this.officeAssignments = new Map();
    this.medicalRecords = new Map();
    this.prescriptions = new Map();
    this.diagnoses = new Map();
    this.medicalStudies = new Map();
    this.preConsultForms = new Map();
    this.userModificationHistory = new Map();
    this.appointmentCancellations = new Map();
    this.initializeDoctors();
    this.initializeUser();
    this.initializePatients();
    this.initializeDoctorUsers();
    this.initializeOffices();
    this.initializeRandomOfficeAssignments();
    this.initializeTestAppointments();
  }

  private initializeDoctors() {
    const doctorsData: Array<Omit<Doctor, 'id'>> = [
      {
        name: "Dr. Ezequiel Mermet",
        firstName: "Ezequiel",
        lastName: "Mermet",
        specialty: "Cardiología",
        matricula: "MN-12345",
        availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      },
      {
        name: "Dr. Valentin Lucero",
        firstName: "Valentin",
        lastName: "Lucero",
        specialty: "Pediatría",
        matricula: "MN-23456",
        availableSlots: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
      },
      {
        name: "Dr. Walter Lucero",
        firstName: "Walter",
        lastName: "Lucero",
        specialty: "Neurología",
        matricula: "MN-34567",
        availableSlots: ["08:30", "09:30", "10:30", "14:00", "15:00", "16:00"],
      },
      {
        name: "Dr. Leo Zabala",
        firstName: "Leo",
        lastName: "Zabala",
        specialty: "Urología y Ginecología",
        matricula: "MN-45678",
        availableSlots: ["09:30", "10:30", "11:30", "14:30", "15:30", "16:30"],
      },
      {
        name: "Dr. Matias Aspilcueta",
        firstName: "Matias",
        lastName: "Aspilcueta",
        specialty: "Traumatología",
        matricula: "MN-56789",
        availableSlots: ["08:00", "09:00", "10:00", "13:00", "14:00", "15:00"],
      },
      {
        name: "Dra. Aldana Ponce",
        firstName: "Aldana",
        lastName: "Ponce",
        specialty: "Dermatología",
        matricula: "MN-67890",
        availableSlots: ["10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      },
    ];

    doctorsData.forEach(doctor => {
      const id = randomUUID();
      this.doctors.set(id, { ...doctor, id });
    });
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email && !user.deleted,
    );
  }

  async getUserByDni(dni: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.dni === dni && !user.deleted,
    );
  }

  async getUserByMatricula(matricula: string): Promise<User | undefined> {
    const allDoctors = Array.from(this.doctors.values());
    const doctor = allDoctors.find((doc) => doc.matricula === matricula);
    
    if (!doctor) {
      return undefined;
    }
    
    return Array.from(this.users.values()).find(
      (user) => user.doctorId === doctor.id && user.role === 'doctor' && !user.deleted,
    );
  }

  async checkDniExists(dni: string): Promise<boolean> {
    return Array.from(this.users.values()).some(
      (user) => user.dni === dni && !user.deleted,
    );
  }

  async checkEmailExists(email: string): Promise<boolean> {
    return Array.from(this.users.values()).some(
      (user) => user.email === email && !user.deleted,
    );
  }

  async checkMatriculaExists(matricula: string): Promise<boolean> {
    return Array.from(this.doctors.values()).some(
      (doctor) => doctor.matricula === matricula,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      firstName: insertUser.firstName || "",
      lastName: insertUser.lastName || "",
      phone: insertUser.phone || "",
      email: insertUser.email || "",
      role: insertUser.role,
      profileImage: insertUser.profileImage,
      doctorId: insertUser.doctorId,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(id);
    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return { success: false, error: "La contraseña actual es incorrecta" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated: User = { ...user, password: hashedPassword };
    this.users.set(id, updated);
    
    return { success: true };
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    // Soft delete
    const updated: User = { ...user, deleted: true };
    this.users.set(id, updated);
    return true;
  }

  private initializeUser() {
    const userId = "admin-user-id";
    const hashedPassword = bcrypt.hashSync("1", 10);
    const adminUser: User = {
      id: userId,
      username: "admin",
      password: hashedPassword,
      firstName: "Fran",
      lastName: "Blason",
      phone: "",
      email: "a@a.com",
      role: "admin",
      profileImage: undefined,
    };
    this.users.set(userId, adminUser);
  }

  private initializePatients() {
    const patientsData = [
      {
        username: "d",
        email: "d@d.com",
        firstName: "Test",
        lastName: "User",
        phone: "+54 11 0000-0000",
        dni: "11111111",
        password: "1",
      },
      {
        username: "maria.gonzalez",
        email: "maria.gonzalez@email.com",
        firstName: "María",
        lastName: "González",
        phone: "+54 11 1234-5678",
        dni: "35123456",
      },
      {
        username: "juan.perez",
        email: "juan.perez@email.com",
        firstName: "Juan",
        lastName: "Pérez",
        phone: "+54 11 2345-6789",
        dni: "34567890",
      },
      {
        username: "laura.martinez",
        email: "laura.martinez@email.com",
        firstName: "Laura",
        lastName: "Martínez",
        phone: "+54 11 3456-7890",
        dni: "36789012",
      },
    ];

    patientsData.forEach(patientData => {
      const hashedPassword = bcrypt.hashSync(patientData.password || "paciente123", 10);
      const patient: User = {
        id: randomUUID(),
        username: patientData.username,
        password: hashedPassword,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phone: patientData.phone,
        email: patientData.email,
        role: "patient",
        profileImage: undefined,
        dni: patientData.dni,
        emailVerified: true,
        deleted: false,
      };
      this.users.set(patient.id, patient);
    });
  }

  private initializeDoctorUsers() {
    const allDoctors = Array.from(this.doctors.values());
    
    allDoctors.forEach(doctor => {
      const hashedPassword = bcrypt.hashSync("1", 10);
      const email = `${doctor.firstName.toLowerCase()}.${doctor.lastName.toLowerCase()}@clinica.com`;
      const username = `${doctor.firstName.toLowerCase()}.${doctor.lastName.toLowerCase()}`;
      
      const doctorUser: User = {
        id: randomUUID(),
        username: username,
        password: hashedPassword,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        phone: "",
        email: email,
        role: "doctor",
        profileImage: undefined,
        emailVerified: true,
        deleted: false,
        doctorId: doctor.id,
      };
      this.users.set(doctorUser.id, doctorUser);
    });
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByEmail(email: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(apt => apt.patientEmail === email)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(apt => apt.doctorId === doctorId)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment | { error: string }> {
    const [yearStr, monthStr, dayStr] = insertAppointment.date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    
    const appointmentDate = new Date(year, month - 1, day);
    const dayOfWeek = appointmentDate.getDay();

    const doctorAssignments = Array.from(this.officeAssignments.values())
      .filter(assignment => 
        assignment.doctorId === insertAppointment.doctorId &&
        assignment.month === month &&
        assignment.year === year
      );

    if (doctorAssignments.length === 0) {
      return { error: "El médico no tiene consultorio asignado para este mes" };
    }

    const validAssignment = doctorAssignments.find(assignment => {
      const isDayAllowed = assignment.weekDays.includes(dayOfWeek);
      if (!isDayAllowed) return false;

      const [reqHour, reqMin] = insertAppointment.time.split(':').map(Number);
      const [startHour, startMin] = assignment.startTime.split(':').map(Number);
      const [endHour, endMin] = assignment.endTime.split(':').map(Number);

      const reqMinutes = reqHour * 60 + reqMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const endAppointmentMinutes = reqMinutes + 30;

      return reqMinutes >= startMinutes && endAppointmentMinutes <= endMinutes;
    });

    if (!validAssignment) {
      return { error: "El horario seleccionado no está disponible para este médico en este día" };
    }

    const existingAppointments = Array.from(this.appointments.values())
      .filter(apt => 
        apt.doctorId === insertAppointment.doctorId &&
        apt.date === insertAppointment.date &&
        apt.status !== "cancelada"
      );

    for (const existing of existingAppointments) {
      if (existing.time === insertAppointment.time) {
        return { error: "Ya existe una cita para este médico en este horario" };
      }
    }

    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      status: insertAppointment.status || "pendiente",
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updated = { ...appointment, status };
    this.appointments.set(id, updated);
    return updated;
  }

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updated = { ...appointment, ...data };
    this.appointments.set(id, updated);
    return updated;
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    return Array.from(this.doctors.values())
      .filter(doctor => doctor.specialty === specialty)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDoctor(id: string): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = randomUUID();
    const doctor: Doctor = {
      id,
      ...insertDoctor,
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  private initializeOffices() {
    const officesData: Array<Omit<Office, 'id'>> = [
      {
        name: "Consultorio A",
        specialty: "Cardiología",
        capacity: 1,
        equipment: ["Camilla", "Escritorio", "Computadora", "Electrocardiograma", "Esfigmomanómetro", "Estetoscopio", "Desfibrilador", "Monitor cardíaco"],
      },
      {
        name: "Consultorio B",
        specialty: "Pediatría",
        capacity: 1,
        equipment: ["Camilla pediátrica", "Escritorio", "Computadora", "Báscula infantil", "Tallímetro", "Otoscopio", "Estetoscopio pediátrico", "Termómetro digital"],
      },
      {
        name: "Consultorio C",
        specialty: "Neurología",
        capacity: 1,
        equipment: ["Camilla", "Escritorio", "Computadora", "Martillo de reflejos", "Oftalmoscopio", "Estetoscopio", "Equipo de electroencefalografía"],
      },
      {
        name: "Consultorio D",
        specialty: "Dermatología",
        capacity: 1,
        equipment: ["Camilla", "Escritorio", "Computadora", "Dermatoscopio", "Lámpara de Wood", "Crioterapia", "Lupa dermatológica", "Bisturí eléctrico"],
      },
      {
        name: "Consultorio E",
        specialty: "Traumatología",
        capacity: 1,
        equipment: ["Camilla ortopédica", "Escritorio", "Computadora", "Negatoscopio", "Goniómetro", "Martillo de reflejos", "Inmovilizadores", "Mesa de yesos"],
      },
      {
        name: "Consultorio F",
        specialty: "Urología y Ginecología",
        capacity: 1,
        equipment: ["Camilla ginecológica", "Escritorio", "Computadora", "Ecógrafo", "Espéculo vaginal", "Colposcopio", "Lámpara de pie", "Instrumental quirúrgico menor"],
      },
    ];

    officesData.forEach(office => {
      const id = randomUUID();
      this.offices.set(id, { ...office, id });
    });
  }

  async getAllOffices(): Promise<Office[]> {
    return Array.from(this.offices.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async getOffice(id: string): Promise<Office | undefined> {
    return this.offices.get(id);
  }

  async createOffice(insertOffice: InsertOffice): Promise<Office> {
    const id = randomUUID();
    const office: Office = {
      ...insertOffice,
      id,
    };
    this.offices.set(id, office);
    return office;
  }

  async getAllOfficeAssignments(): Promise<OfficeAssignment[]> {
    return Array.from(this.officeAssignments.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.month !== b.month) return b.month - a.month;
      return a.officeName.localeCompare(b.officeName);
    });
  }

  async getOfficeAssignment(id: string): Promise<OfficeAssignment | undefined> {
    return this.officeAssignments.get(id);
  }

  async createOfficeAssignment(insertAssignment: InsertOfficeAssignment): Promise<OfficeAssignment | { error: string }> {
    const normalizedWeekDays = Array.from(new Set(insertAssignment.weekDays)).sort((a, b) => a - b);
    
    const officeAvailability = await this.checkOfficeAvailability(
      insertAssignment.officeId,
      insertAssignment.month,
      insertAssignment.year,
      normalizedWeekDays,
      insertAssignment.startTime,
      insertAssignment.endTime
    );

    if (!officeAvailability.available) {
      return {
        error: `El consultorio ya está ocupado en el horario seleccionado. Conflictos: ${
          officeAvailability.conflicts?.map(c => `${c.doctorName} (${c.startTime} - ${c.endTime})`).join(', ')
        }`
      };
    }

    const doctorAvailability = await this.checkDoctorAvailability(
      insertAssignment.doctorId,
      insertAssignment.month,
      insertAssignment.year,
      normalizedWeekDays,
      insertAssignment.startTime,
      insertAssignment.endTime
    );

    if (!doctorAvailability.available) {
      return {
        error: `El médico ya está asignado a otro consultorio en el horario seleccionado. Conflictos: ${
          doctorAvailability.conflicts?.map(c => `${c.officeName} (${c.startTime} - ${c.endTime})`).join(', ')
        }`
      };
    }

    const id = randomUUID();
    const assignment: OfficeAssignment = {
      ...insertAssignment,
      weekDays: normalizedWeekDays,
      id,
      createdAt: new Date(),
    };
    this.officeAssignments.set(id, assignment);
    return assignment;
  }

  async updateOfficeAssignment(id: string, updateData: InsertOfficeAssignment): Promise<OfficeAssignment | { error: string } | undefined> {
    const existing = this.officeAssignments.get(id);
    if (!existing) return undefined;

    const normalizedWeekDays = Array.from(new Set(updateData.weekDays)).sort((a, b) => a - b);
    
    const officeAvailability = await this.checkOfficeAvailability(
      updateData.officeId,
      updateData.month,
      updateData.year,
      normalizedWeekDays,
      updateData.startTime,
      updateData.endTime,
      id
    );

    if (!officeAvailability.available) {
      return {
        error: `El consultorio ya está ocupado en el horario seleccionado. Conflictos: ${
          officeAvailability.conflicts?.map(c => `${c.doctorName} (${c.startTime} - ${c.endTime})`).join(', ')
        }`
      };
    }

    const doctorAvailability = await this.checkDoctorAvailability(
      updateData.doctorId,
      updateData.month,
      updateData.year,
      normalizedWeekDays,
      updateData.startTime,
      updateData.endTime,
      id
    );

    if (!doctorAvailability.available) {
      return {
        error: `El médico ya está asignado a otro consultorio en el horario seleccionado. Conflictos: ${
          doctorAvailability.conflicts?.map(c => `${c.officeName} (${c.startTime} - ${c.endTime})`).join(', ')
        }`
      };
    }

    const updated: OfficeAssignment = {
      ...existing,
      ...updateData,
      weekDays: normalizedWeekDays,
    };
    this.officeAssignments.set(id, updated);
    return updated;
  }

  async deleteOfficeAssignment(id: string): Promise<boolean> {
    return this.officeAssignments.delete(id);
  }

  async checkOfficeAvailability(
    officeId: string,
    month: number,
    year: number,
    weekDays: number[],
    startTime: string,
    endTime: string,
    excludeAssignmentId?: string
  ): Promise<{ available: boolean; conflicts?: OfficeAssignment[] }> {
    const existingAssignments = Array.from(this.officeAssignments.values())
      .filter(assignment => 
        assignment.officeId === officeId &&
        assignment.month === month &&
        assignment.year === year &&
        (!excludeAssignmentId || assignment.id !== excludeAssignmentId)
      );

    const conflicts: OfficeAssignment[] = [];

    for (const assignment of existingAssignments) {
      const hasCommonDay = assignment.weekDays.some(day => weekDays.includes(day));
      
      if (hasCommonDay) {
        const hasTimeOverlap = this.checkTimeOverlap(
          startTime,
          endTime,
          assignment.startTime,
          assignment.endTime
        );

        if (hasTimeOverlap) {
          conflicts.push(assignment);
        }
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  async checkDoctorAvailability(
    doctorId: string,
    month: number,
    year: number,
    weekDays: number[],
    startTime: string,
    endTime: string,
    excludeAssignmentId?: string
  ): Promise<{ available: boolean; conflicts?: OfficeAssignment[] }> {
    const existingAssignments = Array.from(this.officeAssignments.values())
      .filter(assignment => 
        assignment.doctorId === doctorId &&
        assignment.month === month &&
        assignment.year === year &&
        (!excludeAssignmentId || assignment.id !== excludeAssignmentId)
      );

    const conflicts: OfficeAssignment[] = [];

    for (const assignment of existingAssignments) {
      const hasCommonDay = assignment.weekDays.some(day => weekDays.includes(day));
      
      if (hasCommonDay) {
        const hasTimeOverlap = this.checkTimeOverlap(
          startTime,
          endTime,
          assignment.startTime,
          assignment.endTime
        );

        if (hasTimeOverlap) {
          conflicts.push(assignment);
        }
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  private checkTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [h1Start, m1Start] = start1.split(':').map(Number);
    const [h1End, m1End] = end1.split(':').map(Number);
    const [h2Start, m2Start] = start2.split(':').map(Number);
    const [h2End, m2End] = end2.split(':').map(Number);

    const minutes1Start = h1Start * 60 + m1Start;
    const minutes1End = h1End * 60 + m1End;
    const minutes2Start = h2Start * 60 + m2Start;
    const minutes2End = h2End * 60 + m2End;

    return minutes1Start < minutes2End && minutes1End > minutes2Start;
  }

  private initializeRandomOfficeAssignments() {
    const doctors = Array.from(this.doctors.values());
    const offices = Array.from(this.offices.values());
    const year = 2025;
    const months = [11, 12];

    const officesBySpecialty = new Map<string, Office>();
    offices.forEach(office => {
      officesBySpecialty.set(office.specialty, office);
    });

    const timeSlotOptions = [
      { start: "08:00", end: "12:00" },
      { start: "08:00", end: "13:00" },
      { start: "09:00", end: "13:00" },
      { start: "14:00", end: "18:00" },
      { start: "15:00", end: "19:00" },
      { start: "16:00", end: "20:00" },
    ];

    const weekDayOptions = [
      [1, 3, 5],
      [2, 4],
      [1, 2, 3],
      [3, 4, 5],
      [1, 4],
      [2, 5],
    ];

    doctors.forEach((doctor) => {
      const office = officesBySpecialty.get(doctor.specialty);
      if (!office) {
        console.warn(`No se encontró consultorio para la especialidad: ${doctor.specialty} (Doctor: ${doctor.name})`);
        return;
      }

      months.forEach((month) => {
        const randomTimeSlot = timeSlotOptions[Math.floor(Math.random() * timeSlotOptions.length)];
        const randomWeekDays = weekDayOptions[Math.floor(Math.random() * weekDayOptions.length)];

        const id = randomUUID();
        const assignment: OfficeAssignment = {
          id,
          officeId: office.id,
          officeName: office.name,
          doctorId: doctor.id,
          doctorName: doctor.name,
          month,
          year,
          weekDays: randomWeekDays,
          startTime: randomTimeSlot.start,
          endTime: randomTimeSlot.end,
          createdAt: new Date(),
        };

        this.officeAssignments.set(id, assignment);
      });
    });
  }

  // Medical Record methods
  async getMedicalRecordsByEmail(email: string): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values())
      .filter(record => record.patientEmail === email)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt'>): Promise<MedicalRecord> {
    const id = randomUUID();
    const medicalRecord: MedicalRecord = {
      ...record,
      id,
      createdAt: new Date(),
    };
    this.medicalRecords.set(id, medicalRecord);
    return medicalRecord;
  }

  // Prescription methods
  async getPrescriptionsByEmail(email: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values())
      .filter(prescription => prescription.patientEmail === email)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async createPrescription(prescription: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> {
    const id = randomUUID();
    const newPrescription: Prescription = {
      ...prescription,
      id,
      createdAt: new Date(),
    };
    this.prescriptions.set(id, newPrescription);
    return newPrescription;
  }

  // Diagnosis methods
  async getDiagnosesByEmail(email: string): Promise<Diagnosis[]> {
    return Array.from(this.diagnoses.values())
      .filter(diagnosis => diagnosis.patientEmail === email)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getDiagnosis(id: string): Promise<Diagnosis | undefined> {
    return this.diagnoses.get(id);
  }

  async createDiagnosis(diagnosis: Omit<Diagnosis, 'id' | 'createdAt'>): Promise<Diagnosis> {
    const id = randomUUID();
    const newDiagnosis: Diagnosis = {
      ...diagnosis,
      id,
      createdAt: new Date(),
    };
    this.diagnoses.set(id, newDiagnosis);
    return newDiagnosis;
  }

  // Medical Study methods
  async getMedicalStudiesByEmail(email: string): Promise<MedicalStudy[]> {
    return Array.from(this.medicalStudies.values())
      .filter(study => study.patientEmail === email)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMedicalStudy(id: string): Promise<MedicalStudy | undefined> {
    return this.medicalStudies.get(id);
  }

  async createMedicalStudy(study: Omit<MedicalStudy, 'id' | 'createdAt'>): Promise<MedicalStudy> {
    const id = randomUUID();
    const newStudy: MedicalStudy = {
      ...study,
      id,
      createdAt: new Date(),
    };
    this.medicalStudies.set(id, newStudy);
    return newStudy;
  }

  // Pre-Consult Form methods
  async getPreConsultForm(appointmentId: string): Promise<PreConsultForm | undefined> {
    return Array.from(this.preConsultForms.values()).find(
      form => form.appointmentId === appointmentId
    );
  }

  async createPreConsultForm(form: Omit<PreConsultForm, 'id' | 'createdAt'>): Promise<PreConsultForm> {
    const id = randomUUID();
    const newForm: PreConsultForm = {
      ...form,
      id,
      createdAt: new Date(),
    };
    this.preConsultForms.set(id, newForm);
    
    // Update appointment with form reference
    const appointment = this.appointments.get(form.appointmentId);
    if (appointment) {
      appointment.preConsultFormId = id;
      this.appointments.set(form.appointmentId, appointment);
    }
    
    return newForm;
  }

  // User Modification History methods
  async getUserModificationHistory(userId: string): Promise<UserModificationHistory[]> {
    return Array.from(this.userModificationHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createModificationHistory(history: Omit<UserModificationHistory, 'id'>): Promise<void> {
    const id = randomUUID();
    const newHistory: UserModificationHistory = {
      ...history,
      id,
    };
    this.userModificationHistory.set(id, newHistory);
  }

  // Appointment Cancellation methods
  async createAppointmentCancellation(cancellation: Omit<AppointmentCancellation, 'id'>): Promise<AppointmentCancellation> {
    const id = randomUUID();
    const newCancellation: AppointmentCancellation = {
      ...cancellation,
      id,
    };
    this.appointmentCancellations.set(id, newCancellation);
    return newCancellation;
  }

  private initializeTestAppointments() {
    const ezequiel = Array.from(this.doctors.values()).find(d => 
      d.name.includes("Ezequiel") || d.name.includes("Mermet")
    );
    
    if (!ezequiel) {
      console.log("No se encontró al Dr. Ezequiel Mermet para crear turnos de prueba");
      return;
    }

    const testAppointments = [
      {
        patientName: "Test User",
        patientDni: "11111111",
        patientEmail: "d@d.com",
        doctorId: ezequiel.id,
        doctorName: ezequiel.name,
        date: "2025-11-16",
        time: "10:00",
        reason: "Consulta de prueba - Hoy 10:00",
        status: "confirmada",
      },
      {
        patientName: "Test User",
        patientDni: "11111111",
        patientEmail: "d@d.com",
        doctorId: ezequiel.id,
        doctorName: ezequiel.name,
        date: "2025-11-17",
        time: "19:00",
        reason: "Consulta de prueba - Mañana 19:00",
        status: "confirmada",
      },
      {
        patientName: "Test User",
        patientDni: "11111111",
        patientEmail: "d@d.com",
        doctorId: ezequiel.id,
        doctorName: ezequiel.name,
        date: "2025-11-17",
        time: "20:00",
        reason: "Consulta de prueba - Mañana 20:00",
        status: "confirmada",
      },
      {
        patientName: "Test User",
        patientDni: "11111111",
        patientEmail: "d@d.com",
        doctorId: ezequiel.id,
        doctorName: ezequiel.name,
        date: "2025-11-17",
        time: "21:00",
        reason: "Consulta de prueba - Mañana 21:00",
        status: "confirmada",
      },
    ];

    testAppointments.forEach(apt => {
      const id = randomUUID();
      const appointment: Appointment = {
        ...apt,
        id,
        createdAt: new Date(),
      };
      this.appointments.set(id, appointment);
    });

    console.log(`✅ Se crearon ${testAppointments.length} turnos de prueba para ${ezequiel.name}`);
  }
}

export const storage = new MemStorage();
