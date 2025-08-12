import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
} from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { getPrisma } from "../../db/connection.js";
import jwt from "jsonwebtoken";

const prisma = getPrisma();
let app;

// Test data
const testUsers = {
  citizen: {
    id: "test-citizen-1",
    email: "citizen@test.com",
    fullName: "Test Citizen",
    role: "CITIZEN",
    phoneNumber: "+91 9876543210",
    isActive: true,
    joinedOn: new Date(),
    wardId: "test-ward-1",
  },
  wardOfficer: {
    id: "test-ward-officer-1",
    email: "wardofficer@test.com",
    fullName: "Test Ward Officer",
    role: "WARD_OFFICER",
    phoneNumber: "+91 9876543211",
    isActive: true,
    joinedOn: new Date(),
    wardId: "test-ward-1",
  },
  admin: {
    id: "test-admin-1",
    email: "admin@test.com",
    fullName: "Test Admin",
    role: "ADMINISTRATOR",
    phoneNumber: "+91 9876543212",
    isActive: true,
    joinedOn: new Date(),
  },
  maintenanceTeam: {
    id: "test-maintenance-1",
    email: "maintenance@test.com",
    fullName: "Test Maintenance",
    role: "MAINTENANCE_TEAM",
    phoneNumber: "+91 9876543213",
    isActive: true,
    joinedOn: new Date(),
    department: "Electrical",
  },
};

const testWard = {
  id: "test-ward-1",
  name: "Test Ward",
  description: "Test Ward for integration tests",
  isActive: true,
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      wardId: user.wardId,
    },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" },
  );
};

describe("Complaints API Integration Tests", () => {
  beforeAll(async () => {
    app = createApp();

    // Create test ward
    await prisma.ward.create({ data: testWard });

    // Create test users
    for (const user of Object.values(testUsers)) {
      await prisma.user.create({ data: user });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.complaint.deleteMany({
      where: { ward: { name: "Test Ward" } },
    });
    await prisma.user.deleteMany({
      where: { email: { endsWith: "@test.com" } },
    });
    await prisma.ward.deleteMany({
      where: { name: "Test Ward" },
    });
  });

  let citizenToken, wardOfficerToken, adminToken, maintenanceToken;

  beforeEach(() => {
    citizenToken = generateToken(testUsers.citizen);
    wardOfficerToken = generateToken(testUsers.wardOfficer);
    adminToken = generateToken(testUsers.admin);
    maintenanceToken = generateToken(testUsers.maintenanceTeam);
  });

  describe("POST /api/complaints", () => {
    it("should create a complaint for authenticated citizen", async () => {
      const complaintData = {
        description: "Water supply is not working in my area",
        type: "WATER_SUPPLY",
        priority: "HIGH",
        wardId: testWard.id,
        area: "Test Area",
        contactPhone: "+91 9876543210",
      };

      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(complaintData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complaint).toBeDefined();
      expect(response.body.data.complaint.description).toBe(
        complaintData.description,
      );
      expect(response.body.data.complaint.submittedById).toBe(
        testUsers.citizen.id,
      );
      expect(response.body.data.complaint.status).toBe("REGISTERED");
    });

    it("should reject complaint creation without authentication", async () => {
      const complaintData = {
        description: "Test complaint",
        type: "WATER_SUPPLY",
        wardId: testWard.id,
        area: "Test Area",
        contactPhone: "+91 9876543210",
      };

      await request(app)
        .post("/api/complaints")
        .send(complaintData)
        .expect(401);
    });

    it("should validate required fields", async () => {
      const incompleteData = {
        description: "Too short", // Less than 10 characters
        type: "INVALID_TYPE",
      };

      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject creation by maintenance team members", async () => {
      const complaintData = {
        description: "This should not be allowed",
        type: "WATER_SUPPLY",
        wardId: testWard.id,
        area: "Test Area",
        contactPhone: "+91 9876543210",
      };

      await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${maintenanceToken}`)
        .send(complaintData)
        .expect(403);
    });
  });

  describe("GET /api/complaints", () => {
    let citizenComplaintId, otherComplaintId;

    beforeEach(async () => {
      // Create a complaint by the test citizen
      const citizenComplaint = await prisma.complaint.create({
        data: {
          description: "Citizen's water supply issue",
          type: "WATER_SUPPLY",
          status: "REGISTERED",
          priority: "MEDIUM",
          wardId: testWard.id,
          area: "Citizen Area",
          contactPhone: "+91 9876543210",
          submittedById: testUsers.citizen.id,
        },
      });
      citizenComplaintId = citizenComplaint.id;

      // Create a complaint by another user
      const otherComplaint = await prisma.complaint.create({
        data: {
          description: "Another user's complaint",
          type: "ELECTRICITY",
          status: "ASSIGNED",
          priority: "LOW",
          wardId: testWard.id,
          area: "Other Area",
          contactPhone: "+91 9876543211",
          submittedById: testUsers.wardOfficer.id,
        },
      });
      otherComplaintId = otherComplaint.id;
    });

    afterEach(async () => {
      await prisma.complaint.deleteMany({
        where: {
          OR: [{ id: citizenComplaintId }, { id: otherComplaintId }],
        },
      });
    });

    it("should return only citizen's own complaints for CITIZEN role", async () => {
      const response = await request(app)
        .get("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complaints).toBeDefined();

      // Should only see their own complaint
      const complaints = response.body.data.complaints;
      expect(complaints.length).toBe(1);
      expect(complaints[0].id).toBe(citizenComplaintId);
      expect(complaints[0].submittedById).toBe(testUsers.citizen.id);
    });

    it("should return ward complaints for WARD_OFFICER role", async () => {
      const response = await request(app)
        .get("/api/complaints")
        .set("Authorization", `Bearer ${wardOfficerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const complaints = response.body.data.complaints;

      // Should see all complaints in their ward
      expect(complaints.length).toBe(2);
      complaints.forEach((complaint) => {
        expect(complaint.wardId).toBe(testWard.id);
      });
    });

    it("should return all complaints for ADMINISTRATOR role", async () => {
      const response = await request(app)
        .get("/api/complaints")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const complaints = response.body.data.complaints;

      // Should see all complaints
      expect(complaints.length).toBeGreaterThanOrEqual(2);
    });

    it("should reject access without authentication", async () => {
      await request(app).get("/api/complaints").expect(401);
    });

    it("should apply pagination correctly", async () => {
      const response = await request(app)
        .get("/api/complaints?page=1&limit=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalItems).toBeGreaterThan(0);
    });

    it("should apply status filter", async () => {
      const response = await request(app)
        .get("/api/complaints?status=REGISTERED")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const complaints = response.body.data.complaints;
      complaints.forEach((complaint) => {
        expect(complaint.status).toBe("REGISTERED");
      });
    });

    it("should prevent citizens from accessing other citizens' complaints via query params", async () => {
      // Citizen tries to access another user's complaints by passing submittedById
      const response = await request(app)
        .get(`/api/complaints?submittedById=${testUsers.wardOfficer.id}`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .expect(200);

      // Should still only see their own complaints, ignoring the submittedById param
      const complaints = response.body.data.complaints;
      expect(complaints.length).toBe(1);
      expect(complaints[0].submittedById).toBe(testUsers.citizen.id);
    });
  });

  describe("GET /api/complaints/:id", () => {
    let citizenComplaintId, otherComplaintId;

    beforeEach(async () => {
      const citizenComplaint = await prisma.complaint.create({
        data: {
          description: "Citizen's specific complaint",
          type: "WATER_SUPPLY",
          status: "REGISTERED",
          priority: "MEDIUM",
          wardId: testWard.id,
          area: "Citizen Area",
          contactPhone: "+91 9876543210",
          submittedById: testUsers.citizen.id,
        },
      });
      citizenComplaintId = citizenComplaint.id;

      const otherComplaint = await prisma.complaint.create({
        data: {
          description: "Another user's specific complaint",
          type: "ELECTRICITY",
          status: "ASSIGNED",
          priority: "LOW",
          wardId: testWard.id,
          area: "Other Area",
          contactPhone: "+91 9876543211",
          submittedById: testUsers.admin.id, // Different ward to test access
        },
      });
      otherComplaintId = otherComplaint.id;
    });

    afterEach(async () => {
      await prisma.complaint.deleteMany({
        where: {
          OR: [{ id: citizenComplaintId }, { id: otherComplaintId }],
        },
      });
    });

    it("should allow citizen to access their own complaint", async () => {
      const response = await request(app)
        .get(`/api/complaints/${citizenComplaintId}`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complaint.id).toBe(citizenComplaintId);
      expect(response.body.data.complaint.submittedById).toBe(
        testUsers.citizen.id,
      );
    });

    it("should prevent citizen from accessing other user's complaint", async () => {
      await request(app)
        .get(`/api/complaints/${otherComplaintId}`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .expect(403);
    });

    it("should allow ward officer to access complaints in their ward", async () => {
      const response = await request(app)
        .get(`/api/complaints/${citizenComplaintId}`)
        .set("Authorization", `Bearer ${wardOfficerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complaint.wardId).toBe(testWard.id);
    });

    it("should allow administrator to access any complaint", async () => {
      const response = await request(app)
        .get(`/api/complaints/${citizenComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should return 404 for non-existent complaint", async () => {
      await request(app)
        .get("/api/complaints/non-existent-id")
        .set("Authorization", `Bearer ${citizenToken}`)
        .expect(404);
    });
  });

  describe("PUT /api/complaints/:id/status", () => {
    let complaintId;

    beforeEach(async () => {
      const complaint = await prisma.complaint.create({
        data: {
          description: "Status update test complaint",
          type: "WATER_SUPPLY",
          status: "REGISTERED",
          priority: "MEDIUM",
          wardId: testWard.id,
          area: "Test Area",
          contactPhone: "+91 9876543210",
          submittedById: testUsers.citizen.id,
        },
      });
      complaintId = complaint.id;
    });

    afterEach(async () => {
      await prisma.complaint.deleteMany({
        where: { id: complaintId },
      });
    });

    it("should allow ward officer to update complaint status", async () => {
      const response = await request(app)
        .put(`/api/complaints/${complaintId}/status`)
        .set("Authorization", `Bearer ${wardOfficerToken}`)
        .send({
          status: "ASSIGNED",
          comment: "Assigned to maintenance team",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complaint.status).toBe("ASSIGNED");
    });

    it("should prevent citizen from updating complaint status", async () => {
      await request(app)
        .put(`/api/complaints/${complaintId}/status`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({
          status: "ASSIGNED",
        })
        .expect(403);
    });

    it("should create status log entry", async () => {
      await request(app)
        .put(`/api/complaints/${complaintId}/status`)
        .set("Authorization", `Bearer ${wardOfficerToken}`)
        .send({
          status: "ASSIGNED",
          comment: "Test status update",
        })
        .expect(200);

      // Check if status log was created
      const statusLogs = await prisma.statusLog.findMany({
        where: { complaintId },
      });

      expect(statusLogs.length).toBeGreaterThan(0);
      expect(statusLogs.some((log) => log.toStatus === "ASSIGNED")).toBe(true);
    });
  });

  describe("POST /api/complaints/:id/feedback", () => {
    let resolvedComplaintId, registeredComplaintId;

    beforeEach(async () => {
      const resolvedComplaint = await prisma.complaint.create({
        data: {
          description: "Resolved complaint for feedback",
          type: "WATER_SUPPLY",
          status: "RESOLVED",
          priority: "MEDIUM",
          wardId: testWard.id,
          area: "Test Area",
          contactPhone: "+91 9876543210",
          submittedById: testUsers.citizen.id,
          resolvedOn: new Date(),
        },
      });
      resolvedComplaintId = resolvedComplaint.id;

      const registeredComplaint = await prisma.complaint.create({
        data: {
          description: "Registered complaint (no feedback allowed)",
          type: "ELECTRICITY",
          status: "REGISTERED",
          priority: "LOW",
          wardId: testWard.id,
          area: "Test Area",
          contactPhone: "+91 9876543210",
          submittedById: testUsers.citizen.id,
        },
      });
      registeredComplaintId = registeredComplaint.id;
    });

    afterEach(async () => {
      await prisma.complaint.deleteMany({
        where: {
          OR: [{ id: resolvedComplaintId }, { id: registeredComplaintId }],
        },
      });
    });

    it("should allow citizen to add feedback to their resolved complaint", async () => {
      const feedbackData = {
        rating: 4,
        citizenFeedback: "Good service, resolved quickly",
      };

      const response = await request(app)
        .post(`/api/complaints/${resolvedComplaintId}/feedback`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(feedbackData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complaint.rating).toBe(4);
      expect(response.body.data.complaint.citizenFeedback).toBe(
        feedbackData.citizenFeedback,
      );
    });

    it("should prevent feedback on non-resolved complaints", async () => {
      const feedbackData = {
        rating: 3,
        citizenFeedback: "This should not be allowed",
      };

      await request(app)
        .post(`/api/complaints/${registeredComplaintId}/feedback`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(feedbackData)
        .expect(400);
    });

    it("should prevent other users from adding feedback", async () => {
      const feedbackData = {
        rating: 3,
        citizenFeedback: "Unauthorized feedback",
      };

      await request(app)
        .post(`/api/complaints/${resolvedComplaintId}/feedback`)
        .set("Authorization", `Bearer ${wardOfficerToken}`)
        .send(feedbackData)
        .expect(403);
    });
  });

  describe("GET /api/complaints/stats", () => {
    beforeEach(async () => {
      // Create some test complaints for stats
      await prisma.complaint.createMany({
        data: [
          {
            description: "Stats test 1",
            type: "WATER_SUPPLY",
            status: "REGISTERED",
            priority: "HIGH",
            wardId: testWard.id,
            area: "Stats Area 1",
            contactPhone: "+91 9876543210",
            submittedById: testUsers.citizen.id,
          },
          {
            description: "Stats test 2",
            type: "ELECTRICITY",
            status: "RESOLVED",
            priority: "MEDIUM",
            wardId: testWard.id,
            area: "Stats Area 2",
            contactPhone: "+91 9876543211",
            submittedById: testUsers.citizen.id,
          },
        ],
      });
    });

    afterEach(async () => {
      await prisma.complaint.deleteMany({
        where: { description: { startsWith: "Stats test" } },
      });
    });

    it("should return citizen's complaint statistics", async () => {
      const response = await request(app)
        .get("/api/complaints/stats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.total).toBeGreaterThan(0);
      expect(response.body.data.stats.byStatus).toBeDefined();
      expect(response.body.data.stats.byPriority).toBeDefined();
      expect(response.body.data.stats.byType).toBeDefined();
    });

    it("should return ward statistics for ward officer", async () => {
      const response = await request(app)
        .get("/api/complaints/stats")
        .set("Authorization", `Bearer ${wardOfficerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.total).toBeGreaterThanOrEqual(2);
    });

    it("should apply date range filters", async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await request(app)
        .get(`/api/complaints/stats?dateFrom=${today}&dateTo=${today}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("Role-based access control", () => {
    it("should enforce proper role hierarchy", async () => {
      // Test that each role can only access what they're supposed to
      const testEndpoints = [
        {
          method: "GET",
          path: "/api/complaints",
          allowedRoles: [
            "CITIZEN",
            "WARD_OFFICER",
            "MAINTENANCE_TEAM",
            "ADMINISTRATOR",
          ],
        },
        {
          method: "POST",
          path: "/api/complaints",
          allowedRoles: ["CITIZEN", "ADMINISTRATOR"],
        },
        {
          method: "GET",
          path: "/api/complaints/stats",
          allowedRoles: [
            "CITIZEN",
            "WARD_OFFICER",
            "MAINTENANCE_TEAM",
            "ADMINISTRATOR",
          ],
        },
      ];

      for (const endpoint of testEndpoints) {
        for (const [roleName, user] of Object.entries(testUsers)) {
          const token = generateToken(user);
          const role = user.role;

          if (endpoint.allowedRoles.includes(role)) {
            // Should succeed (or at least not be forbidden)
            const response = await request(app)
              [endpoint.method.toLowerCase()](`${endpoint.path}`)
              .set("Authorization", `Bearer ${token}`);

            expect(response.status).not.toBe(403); // Should not be forbidden
          } else {
            // Should be forbidden
            await request(app)
              [endpoint.method.toLowerCase()](`${endpoint.path}`)
              .set("Authorization", `Bearer ${token}`)
              .expect(403);
          }
        }
      }
    });
  });

  describe("Data consistency and validation", () => {
    it("should maintain referential integrity", async () => {
      // Create complaint
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({
          description: "Referential integrity test",
          type: "WATER_SUPPLY",
          priority: "MEDIUM",
          wardId: testWard.id,
          area: "Test Area",
          contactPhone: "+91 9876543210",
        })
        .expect(201);

      const complaintId = response.body.data.complaint.id;

      // Verify all required relationships exist
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          ward: true,
          submittedBy: true,
          statusLogs: true,
        },
      });

      expect(complaint.ward).toBeDefined();
      expect(complaint.ward.id).toBe(testWard.id);
      expect(complaint.submittedBy).toBeDefined();
      expect(complaint.submittedBy.id).toBe(testUsers.citizen.id);
      expect(complaint.statusLogs.length).toBeGreaterThan(0); // Should have initial status log

      // Clean up
      await prisma.complaint.delete({ where: { id: complaintId } });
    });

    it("should validate business rules", async () => {
      // Test that status transitions follow business logic
      const complaint = await prisma.complaint.create({
        data: {
          description: "Business rules test",
          type: "WATER_SUPPLY",
          status: "CLOSED",
          priority: "MEDIUM",
          wardId: testWard.id,
          area: "Test Area",
          contactPhone: "+91 9876543210",
          submittedById: testUsers.citizen.id,
          closedOn: new Date(),
        },
      });

      // Try to add feedback to closed complaint (should work)
      await request(app)
        .post(`/api/complaints/${complaint.id}/feedback`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({
          rating: 4,
          citizenFeedback: "Good service",
        })
        .expect(200);

      // Clean up
      await prisma.complaint.delete({ where: { id: complaint.id } });
    });
  });
});
