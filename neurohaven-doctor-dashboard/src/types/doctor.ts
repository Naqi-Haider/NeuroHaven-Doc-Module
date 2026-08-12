export interface Doctor {
  id: string;
  email: string;
  name: string;
  licenseNumber: string;
  specialization?: string;
  institution?: string;
  verified: boolean;
  createdAt: string;
}

export interface PatientLink {
  id: string;
  doctorId: string;
  patientId: string;
  linkedAt: string;
  status: "active" | "inactive" | "pending";
}
