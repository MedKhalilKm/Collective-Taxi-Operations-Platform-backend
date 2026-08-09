export interface CreateVehiclePayload {
  registrationNumber: number;
  seriesNumber: number;
  carBrand: string;
  capacity?: number;
  status?: string;
  chassisNumber: string;
  insuranceExpiry: Date;
  registrationDate: Date;
  inspectionExpiry: Date;
  routeId?: number;
}

export interface UpdateVehiclePayload {
  registrationNumber?: number;
  seriesNumber?: number;
  carBrand?: string;
  capacity?: number;
  status?: string;
  chassisNumber?: string;
  insuranceExpiry?: Date;
  registrationDate?: Date;
  inspectionExpiry?: Date;
  routeId?: number | null;
}

export interface VehicleQueryFilters {
  search?: string;
  status?: string;
  routeId?: number;
  page?: number;
  limit?: number;
}
