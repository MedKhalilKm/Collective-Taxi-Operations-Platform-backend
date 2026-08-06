export interface CreateDriverPayload {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  status?: string;
  cin: number;
  professionalIdCard: string;
  professionalCardExpiry: Date;
  drivingLicence: number;
  drivingLicenceExpiry: Date;
}

export interface UpdateDriverPayload {
  cin?: number;
  professionalIdCard?: string;
  professionalCardExpiry?: Date;
  drivingLicence?: number;
  drivingLicenceExpiry?: Date;
}

export interface DriverQueryFilters {
  search?: string;
  page?: number;
  limit?: number;
}
