import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock API routes for territory assignment

  // Get rep types
  app.get("/api/rep-types", (req, res) => {
    res.json([
      { typeId: 1, typeName: "Inside" },
      { typeId: 2, typeName: "Outside" },
      { typeId: 3, typeName: "Regional" }
    ]);
  });

  // Get sales reps by type
  app.get("/api/sales-reps", (req, res) => {
    const typeId = parseInt(req.query.typeId as string);
    
    const allReps = {
      1: [
        { SalesRepId: 101, SalesRepNo: "0123", SalesRepType: 1, Division: "C" },
        { SalesRepId: 102, SalesRepNo: "0347", SalesRepType: 1, Division: "C" }
      ],
      2: [
        { SalesRepId: 201, SalesRepNo: "2301", SalesRepType: 2, Division: "C" },
        { SalesRepId: 202, SalesRepNo: "2574", SalesRepType: 2, Division: "C" }
      ],
      3: [
        { SalesRepId: 301, SalesRepNo: "3120", SalesRepType: 3, Division: "C" },
        { SalesRepId: 302, SalesRepNo: "3462", SalesRepType: 3, Division: "C" }
      ]
    };
    
    const reps = allReps[typeId as keyof typeof allReps] || [];
    res.json(reps);
  });

  // Get counties
  app.get("/api/counties", (req, res) => {
    res.json([
      { CountyCode: "001", CountyName: "Adams", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
      { CountyCode: "013", CountyName: "Boulder", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
      { CountyCode: "004", CountyName: "Arapahoe", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
      { CountyCode: "016", CountyName: "Chaffee", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "CO" },
      { CountyCode: "003", CountyName: "Apache", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "AZ" },
      { CountyCode: "007", CountyName: "Bannock", CATCountyCode: null, SystemId: 512, BusinessEntityId: 1, StateProvinceCode: "ID" }
    ]);
  });

  // Get ZIP codes for a county
  app.get("/api/zipcodes", (req, res) => {
    const countyId = parseInt(req.query.countyId as string);
    
    const zipsByCounty = {
      1: [
        { ZipCodeId: 0, ZipCode: "80019", CountyId: 1, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.250" },
        { ZipCodeId: 1, ZipCode: "80022", CountyId: 1, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" },
        { ZipCodeId: 2, ZipCode: "80024", CountyId: 1, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" }
      ],
      13: [
        { ZipCodeId: 10, ZipCode: "80301", CountyId: 13, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.250" },
        { ZipCodeId: 11, ZipCode: "80302", CountyId: 13, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" },
        { ZipCodeId: 12, ZipCode: "80303", CountyId: 13, EnterXUId: 0, EnterDate: "2025-04-21T00:00:00.000", ChangeXUId: 2836, ChangeDate: "2025-04-21T13:52:26.267" }
      ]
    };
    
    res.json(zipsByCounty[countyId as keyof typeof zipsByCounty] || []);
  });

  // Validate assignment
  app.post("/api/assignments/validate", (req, res) => {
    const request = req.body;
    
    // Perform validation (mocked)
    if (request.zipFrom === "80019" || request.zipTo === "80019") {
      res.json({
        valid: false,
        errors: ["ZIP 80019 overlaps Rep 99"]
      });
    } else {
      res.json({
        valid: true,
        errors: []
      });
    }
  });

  // Batch update assignments
  app.post("/api/assignments/batch-update", (req, res) => {
    const request = req.body;
    
    // Check for invalid reassignments (mocked)
    const hasInvalidReassign = request.reassigns.some(
      (r: any) => r.fromRepId === 101 && r.toRepId === 201
    );
    
    if (hasInvalidReassign) {
      res.json({ success: false });
    } else {
      res.json({ success: true });
    }
  });

  // Get current assignments for a rep
  app.get("/api/assignments/current", (req, res) => {
    const repId = parseInt(req.query.repId as string);
    
    const assignmentsByRep = {
      101: [
        { ZipCodeId: 0, ZipCode: "80019" },
        { ZipCodeId: 1, ZipCode: "80022" },
        { ZipCodeId: 2, ZipCode: "80024" }
      ],
      102: [
        { ZipCodeId: 3, ZipCode: "80030" },
        { ZipCodeId: 4, ZipCode: "80031" },
        { ZipCodeId: 10, ZipCode: "80301" },
        { ZipCodeId: 11, ZipCode: "80302" }
      ],
      201: [
        { ZipCodeId: 5, ZipCode: "80037" },
        { ZipCodeId: 6, ZipCode: "80045" },
        { ZipCodeId: 12, ZipCode: "80303" }
      ]
    };
    
    res.json(assignmentsByRep[repId as keyof typeof assignmentsByRep] || []);
  });

  const httpServer = createServer(app);
  return httpServer;
}
