import { Driver, User } from "@prisma/client";

type DriverWithUser = Driver & { user: User };

export interface DriverResponseDto {
  id: string;
  cin: number;
  professionalIdCard: string;
  professionalCardExpiry: Date;
  drivingLicence: number;
  drivingLicenceExpiry: Date;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: string;
    status: string;
  };
}

export class DriverDto {
  static toResponse(driver: DriverWithUser): DriverResponseDto {
    return {
      id: driver.id,
      cin: driver.cin,
      professionalIdCard: driver.professionalIdCard,
      professionalCardExpiry: driver.professionalCardExpiry,
      drivingLicence: driver.drivingLicence,
      drivingLicenceExpiry: driver.drivingLicenceExpiry,
      user: {
        id: driver.user.id,
        name: driver.user.name,
        email: driver.user.email,
        username: driver.user.username,
        firstName: driver.user.firstName,
        lastName: driver.user.lastName,
        phoneNumber: driver.user.phoneNumber,
        role: driver.user.role,
        status: driver.user.status,
      },
    };
  }

  static toResponseList(drivers: DriverWithUser[]): DriverResponseDto[] {
    return drivers.map((driver) => this.toResponse(driver));
  }
}
