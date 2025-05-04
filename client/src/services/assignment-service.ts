import { apiRequest } from "@/lib/queryClient";

// Type definitions for API models
interface RepType {
  typeId: number;
  typeName: string;
}

interface SalesRep {
  SalesRepId: number;
  SalesRepNo: string;
  SalesRepType: number;
  Division: string;
}

interface County {
  CountyCode: string;
  CountyName: string;
  CATCountyCode: string | null;
  SystemId: number;
  BusinessEntityId: number;
  StateProvinceCode: string;
}

interface CountyZipCode {
  ZipCodeId: number;
  ZipCode: string;
  CountyId: number;
  EnterXUId: number;
  EnterDate: string;
  ChangeXUId: number;
  ChangeDate: string;
}

interface CurrentAssignment {
  ZipCodeId: number;
  ZipCode: string;
}

interface ValidateAssignmentRequest {
  typeId: number;
  repId: number;
  counties?: string[];
  zipFrom?: string;
  zipTo?: string;
}

interface ValidateAssignmentResponse {
  valid: boolean;
  errors: string[];
}

interface ReassignRequest {
  typeId: number;
  fromRepId: number;
  toRepId: number;
  counties?: string[];
  zipFrom?: string;
  zipTo?: string;
}

interface BatchAssignmentUpdateRequest {
  assigns: ValidateAssignmentRequest[];
  reassigns: ReassignRequest[];
}

interface BatchAssignmentUpdateResponse {
  success: boolean;
}

// Service implementation
export class AssignmentService {
  // In-memory staging for assignments and reassignments
  private _assigns: ValidateAssignmentRequest[] = [];
  private _reassigns: ReassignRequest[] = [];
  
  // Fetch all rep types
  async getRepTypes(): Promise<RepType[]> {
    try {
      // Simulate API response
      return [
        { typeId: 1, typeName: "Inside" },
        { typeId: 2, typeName: "Outside" },
        { typeId: 3, typeName: "Regional" }
      ];
    } catch (error) {
      console.error("Error fetching rep types:", error);
      return [];
    }
  }
  
  // Fetch sales reps by type
  async getSalesReps(typeId: number): Promise<SalesRep[]> {
    try {
      // Simulate API response based on type
      const allReps = {
        1: [ // Inside reps
          { SalesRepId: 101, SalesRepNo: "0123", SalesRepType: 1, Division: "C" },
          { SalesRepId: 102, SalesRepNo: "0347", SalesRepType: 1, Division: "C" }
        ],
        2: [ // Outside reps
          { SalesRepId: 201, SalesRepNo: "2301", SalesRepType: 2, Division: "C" },
          { SalesRepId: 202, SalesRepNo: "2574", SalesRepType: 2, Division: "C" }
        ],
        3: [ // Regional reps
          { SalesRepId: 301, SalesRepNo: "3120", SalesRepType: 3, Division: "C" },
          { SalesRepId: 302, SalesRepNo: "3462", SalesRepType: 3, Division: "C" }
        ]
      };
      
      return allReps[typeId as keyof typeof allReps] || [];
    } catch (error) {
      console.error("Error fetching sales reps:", error);
      return [];
    }
  }
  
  // Fetch all counties
  async getCounties(): Promise<County[]> {
    try {
      // Simulate API response
      return [
        { CountyCode: "001", CountyName: "Adams", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
        { CountyCode: "013", CountyName: "Boulder", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
        { CountyCode: "004", CountyName: "Arapahoe", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
        { CountyCode: "016", CountyName: "Chaffee", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
        { CountyCode: "003", CountyName: "Apache", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "AZ" },
        { CountyCode: "007", CountyName: "Bannock", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "ID" }
      ];
    } catch (error) {
      console.error("Error fetching counties:", error);
      return [];
    }
  }
  
  // Fetch ZIP codes for a county
  async getZips(countyId: number): Promise<CountyZipCode[]> {
    try {
      // Simulate API response
      const zipsByCounty = {
        1: [ // Adams
          { ZipCodeId: 0, ZipCode: "80019", CountyId: 1, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.250" },
          { ZipCodeId: 1, ZipCode: "80022", CountyId: 1, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" },
          { ZipCodeId: 2, ZipCode: "80024", CountyId: 1, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" }
        ],
        13: [ // Boulder
          { ZipCodeId: 10, ZipCode: "80301", CountyId: 13, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.250" },
          { ZipCodeId: 11, ZipCode: "80302", CountyId: 13, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" },
          { ZipCodeId: 12, ZipCode: "80303", CountyId: 13, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" }
        ]
      };
      
      return zipsByCounty[countyId as keyof typeof zipsByCounty] || [];
    } catch (error) {
      console.error("Error fetching county zip codes:", error);
      return [];
    }
  }
  
  // Get current assignments for a sales rep
  async getCurrentAssignments(repId: number): Promise<CurrentAssignment[]> {
    try {
      // Simulate API response
      const assignmentsByRep = {
        101: [ // First inside rep
          { ZipCodeId: 0, ZipCode: "80019" },
          { ZipCodeId: 1, ZipCode: "80022" },
          { ZipCodeId: 2, ZipCode: "80024" }
        ],
        102: [ // Second inside rep
          { ZipCodeId: 3, ZipCode: "80030" },
          { ZipCodeId: 4, ZipCode: "80031" },
          { ZipCodeId: 10, ZipCode: "80301" },
          { ZipCodeId: 11, ZipCode: "80302" }
        ],
        201: [ // First outside rep
          { ZipCodeId: 5, ZipCode: "80037" },
          { ZipCodeId: 6, ZipCode: "80045" },
          { ZipCodeId: 12, ZipCode: "80303" }
        ]
      };
      
      return assignmentsByRep[repId as keyof typeof assignmentsByRep] || [];
    } catch (error) {
      console.error("Error fetching current assignments:", error);
      return [];
    }
  }
  
  // Validate assignment request
  async validate(request: ValidateAssignmentRequest): Promise<ValidateAssignmentResponse> {
    try {
      // Simulate validation logic
      // For simplicity, we'll check for a specific ZIP code that causes an overlap
      if (request.zipFrom === "80019" || request.zipTo === "80019") {
        return {
          valid: false,
          errors: ["ZIP 80019 overlaps Rep 99"]
        };
      }
      
      // All other cases are valid
      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      console.error("Error validating assignment:", error);
      return {
        valid: false,
        errors: ["An unexpected error occurred during validation"]
      };
    }
  }
  
  // Submit batch update
  async batchUpdate(request: BatchAssignmentUpdateRequest): Promise<BatchAssignmentUpdateResponse> {
    try {
      // Simulate API call
      // In a real application, this would send the request to the server
      
      // For test case 3.6, simulate failure if certain condition is met
      const hasInvalidReassign = request.reassigns.some(
        r => r.fromRepId === 101 && r.toRepId === 201
      );
      
      if (hasInvalidReassign) {
        return { success: false };
      }
      
      // Clear staging after successful update
      this._assigns = [];
      this._reassigns = [];
      
      return { success: true };
    } catch (error) {
      console.error("Error submitting batch update:", error);
      return { success: false };
    }
  }
  
  // In-memory staging methods
  get assigns(): ValidateAssignmentRequest[] {
    return [...this._assigns];
  }
  
  get reassigns(): ReassignRequest[] {
    return [...this._reassigns];
  }
  
  addAssign(assign: ValidateAssignmentRequest): void {
    this._assigns.push(assign);
  }
  
  addReassign(reassign: ReassignRequest): void {
    this._reassigns.push(reassign);
  }
  
  removeAssign(index: number): void {
    if (index >= 0 && index < this._assigns.length) {
      this._assigns.splice(index, 1);
    }
  }
  
  removeReassign(index: number): void {
    if (index >= 0 && index < this._reassigns.length) {
      this._reassigns.splice(index, 1);
    }
  }
  
  clearAssigns(): void {
    this._assigns = [];
  }
  
  clearReassigns(): void {
    this._reassigns = [];
  }
  
  clearAll(): void {
    this.clearAssigns();
    this.clearReassigns();
  }
}

// Create and export a singleton instance
export const assignmentService = new AssignmentService();
