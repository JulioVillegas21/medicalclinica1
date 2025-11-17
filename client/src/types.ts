export interface User {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage?: string;
  role?: string;
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
