describe("Citizen Complaint Flow", () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: "citizen-1",
            fullName: "Test Citizen",
            email: "citizen@example.com",
            role: "CITIZEN",
            wardId: "ward-1",
            isActive: true,
            joinedOn: new Date().toISOString(),
          },
          token: "mock-jwt-token",
        },
      },
    }).as("login");

    cy.intercept("GET", "/api/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: "citizen-1",
            fullName: "Test Citizen",
            email: "citizen@example.com",
            role: "CITIZEN",
            wardId: "ward-1",
            isActive: true,
          },
        },
      },
    }).as("getCurrentUser");

    cy.intercept("GET", "/api/complaints*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          complaints: [
            {
              id: "complaint-1",
              title: "Water Supply Issue",
              description: "No water supply since morning",
              type: "WATER_SUPPLY",
              status: "REGISTERED",
              priority: "HIGH",
              area: "Fort Kochi",
              submittedOn: new Date().toISOString(),
              submittedById: "citizen-1",
              contactPhone: "+91 9876543210",
            },
            {
              id: "complaint-2",
              title: "Street Light Issue",
              description: "Street light not working",
              type: "STREET_LIGHTING",
              status: "ASSIGNED",
              priority: "MEDIUM",
              area: "Mattancherry",
              submittedOn: new Date(Date.now() - 86400000).toISOString(),
              submittedById: "citizen-1",
              contactPhone: "+91 9876543210",
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    }).as("getComplaints");

    cy.intercept("GET", "/api/complaints/stats*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          stats: {
            total: 2,
            byStatus: {
              REGISTERED: 1,
              ASSIGNED: 1,
              IN_PROGRESS: 0,
              RESOLVED: 0,
              CLOSED: 0,
            },
            byPriority: {
              LOW: 0,
              MEDIUM: 1,
              HIGH: 1,
              CRITICAL: 0,
            },
            byType: {
              WATER_SUPPLY: 1,
              STREET_LIGHTING: 1,
            },
            avgResolutionTime: 0,
          },
        },
      },
    }).as("getComplaintStats");

    cy.intercept("GET", "/api/complaint-types", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: "WATER_SUPPLY",
            name: "Water Supply",
            description: "Issues related to water supply",
            slaHours: 24,
          },
          {
            id: "ELECTRICITY",
            name: "Electricity",
            description: "Power and electrical issues",
            slaHours: 12,
          },
          {
            id: "ROAD_REPAIR",
            name: "Road Repair",
            description: "Road maintenance and repair issues",
            slaHours: 72,
          },
          {
            id: "STREET_LIGHTING",
            name: "Street Lighting",
            description: "Street light maintenance",
            slaHours: 48,
          },
        ],
      },
    }).as("getComplaintTypes");
  });

  it("should allow citizen to log in and view dashboard", () => {
    cy.visit("/login");

    // Fill in login form
    cy.get('input[type="email"]').type("citizen@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.get('button[type="submit"]').click();

    cy.wait("@login");

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");

    // Wait for API calls
    cy.wait("@getCurrentUser");
    cy.wait("@getComplaints");
    cy.wait("@getComplaintStats");

    // Should display user name
    cy.contains("Welcome back, Test Citizen").should("be.visible");

    // Should display complaint statistics
    cy.contains("Total Complaints").should("be.visible");
    cy.contains("2").should("be.visible"); // Total count

    // Should display pending and in progress counts
    cy.contains("Pending").should("be.visible");
    cy.contains("In Progress").should("be.visible");
    cy.contains("Resolved").should("be.visible");

    // Should display recent complaints
    cy.contains("Recent Complaints").should("be.visible");
    cy.contains("Water Supply Issue").should("be.visible");
    cy.contains("Street Light Issue").should("be.visible");

    // Should have Register New Complaint button
    cy.contains("Register New Complaint").should("be.visible");
  });

  it("should allow citizen to create a new complaint", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[type="email"]').type("citizen@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");

    // Intercept complaint creation
    cy.intercept("POST", "/api/complaints", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          complaint: {
            id: "new-complaint-123",
            title: "Pothole on Main Road",
            description: "Large pothole causing traffic issues",
            type: "ROAD_REPAIR",
            status: "REGISTERED",
            priority: "HIGH",
            area: "Marine Drive",
            submittedOn: new Date().toISOString(),
            submittedById: "citizen-1",
          },
        },
      },
    }).as("createComplaint");

    // Navigate to create complaint page
    cy.contains("Register New Complaint").click();
    cy.url().should("include", "/complaints/new");

    cy.wait("@getComplaintTypes");

    // Fill out the complaint form
    cy.get('select[name="type"]').select("ROAD_REPAIR");
    cy.get('select[name="priority"]').select("HIGH");
    cy.get('input[name="title"]').type("Pothole on Main Road");
    cy.get('textarea[name="description"]').type(
      "There is a large pothole on Marine Drive near the junction that is causing traffic issues and potential damage to vehicles. This needs immediate attention.",
    );

    // Location details
    cy.get('input[name="area"]').type("Marine Drive");
    cy.get('input[name="landmark"]').type("Near Traffic Junction");
    cy.get('textarea[name="address"]').type(
      "Marine Drive, Fort Kochi, Near Traffic Junction",
    );

    // Contact information (should be pre-filled)
    cy.get('input[name="contactPhone"]').should("have.value", "+91 9876543210");

    // Submit the complaint
    cy.get('button[type="submit"]').click();

    cy.wait("@createComplaint");

    // Should redirect to complaint details or show success message
    cy.contains("Complaint Submitted").should("be.visible");
  });

  it("should allow citizen to view their complaints list", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[type="email"]').type("citizen@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");

    // Navigate to complaints list
    cy.visit("/complaints");
    cy.wait("@getComplaints");

    // Should display complaints table
    cy.contains("Complaints (2)").should("be.visible");

    // Should display complaint details
    cy.contains("Water Supply Issue").should("be.visible");
    cy.contains("Street Light Issue").should("be.visible");
    cy.contains("WATER_SUPPLY").should("be.visible");
    cy.contains("STREET_LIGHTING").should("be.visible");

    // Should display status badges
    cy.contains("REGISTERED").should("be.visible");
    cy.contains("ASSIGNED").should("be.visible");

    // Should display priority badges
    cy.contains("HIGH").should("be.visible");
    cy.contains("MEDIUM").should("be.visible");

    // Should have filter options
    cy.contains("Filter by status").should("be.visible");
    cy.contains("Filter by priority").should("be.visible");

    // Should have search functionality
    cy.get('input[placeholder="Search complaints..."]').should("be.visible");
  });

  it("should allow citizen to view complaint details", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[type="email"]').type("citizen@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");

    // Mock complaint details API
    cy.intercept("GET", "/api/complaints/complaint-1", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          complaint: {
            id: "complaint-1",
            title: "Water Supply Issue",
            description: "No water supply since morning in our area",
            type: "WATER_SUPPLY",
            status: "REGISTERED",
            priority: "HIGH",
            area: "Fort Kochi",
            landmark: "Near Post Office",
            address: "123 Main Street, Fort Kochi",
            submittedOn: new Date().toISOString(),
            submittedById: "citizen-1",
            contactName: "Test Citizen",
            contactPhone: "+91 9876543210",
            contactEmail: "citizen@example.com",
            statusLogs: [
              {
                id: "log-1",
                fromStatus: null,
                toStatus: "REGISTERED",
                comment: "Complaint registered",
                timestamp: new Date().toISOString(),
                user: {
                  fullName: "Test Citizen",
                  role: "CITIZEN",
                },
              },
            ],
            attachments: [],
          },
        },
      },
    }).as("getComplaintDetails");

    // Navigate to complaint details
    cy.visit("/complaints/complaint-1");
    cy.wait("@getComplaintDetails");

    // Should display complaint details
    cy.contains("Complaint #complaint-1").should("be.visible");
    cy.contains("Water Supply Issue").should("be.visible");
    cy.contains("No water supply since morning").should("be.visible");

    // Should display status and priority badges
    cy.contains("REGISTERED").should("be.visible");
    cy.contains("HIGH Priority").should("be.visible");

    // Should display location information
    cy.contains("Fort Kochi").should("be.visible");
    cy.contains("Near Post Office").should("be.visible");

    // Should display contact information
    cy.contains("Test Citizen").should("be.visible");
    cy.contains("+91 9876543210").should("be.visible");

    // Should display status updates
    cy.contains("Status Updates & Comments").should("be.visible");
    cy.contains("Complaint Registered").should("be.visible");
  });

  it("should allow citizen to provide feedback on resolved complaint", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[type="email"]').type("citizen@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");

    // Mock resolved complaint details
    cy.intercept("GET", "/api/complaints/resolved-complaint", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          complaint: {
            id: "resolved-complaint",
            title: "Resolved Water Issue",
            description: "Water supply was restored",
            type: "WATER_SUPPLY",
            status: "RESOLVED",
            priority: "HIGH",
            area: "Fort Kochi",
            submittedOn: new Date(Date.now() - 86400000).toISOString(),
            resolvedOn: new Date().toISOString(),
            submittedById: "citizen-1",
            rating: null,
            citizenFeedback: null,
          },
        },
      },
    }).as("getResolvedComplaint");

    // Mock feedback submission
    cy.intercept("POST", "/api/complaints/resolved-complaint/feedback", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          complaint: {
            id: "resolved-complaint",
            rating: 4,
            citizenFeedback: "Great service, resolved quickly",
          },
        },
      },
    }).as("submitFeedback");

    // Navigate to resolved complaint
    cy.visit("/complaints/resolved-complaint");
    cy.wait("@getResolvedComplaint");

    // Should show feedback button
    cy.contains("Provide Feedback").should("be.visible").click();

    // Should open feedback dialog
    cy.contains("Please rate our service").should("be.visible");

    // Provide rating
    cy.get('[data-testid="star-4"]').click(); // Click 4th star

    // Provide feedback text
    cy.get('textarea[placeholder*="Please share your experience"]').type(
      "Great service, resolved quickly",
    );

    // Submit feedback
    cy.contains("Submit Feedback").click();

    cy.wait("@submitFeedback");

    // Should show success message
    cy.contains("Feedback Submitted").should("be.visible");
  });

  it("should handle API errors gracefully", () => {
    // Intercept with error response
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 401,
      body: {
        success: false,
        message: "Invalid credentials",
      },
    }).as("loginError");

    cy.visit("/login");

    // Fill in login form
    cy.get('input[type="email"]').type("citizen@example.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginError");

    // Should display error message
    cy.contains("Invalid credentials").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("should handle unauthorized access", () => {
    // Intercept with 401 response
    cy.intercept("GET", "/api/complaints*", {
      statusCode: 401,
      body: {
        success: false,
        message: "Not authorized to access this route",
      },
    }).as("unauthorizedAccess");

    // Try to access complaints without login
    cy.visit("/complaints");

    cy.wait("@unauthorizedAccess");

    // Should show authentication error
    cy.contains("Authentication Error").should("be.visible");
    cy.contains("Please log in again").should("be.visible");
  });

  it("should filter complaints correctly", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[type="email"]').type("citizen@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");

    // Navigate to complaints list
    cy.visit("/complaints");
    cy.wait("@getComplaints");

    // Test search functionality
    cy.get('input[placeholder="Search complaints..."]').type("Water");

    // Should filter results (client-side filtering)
    cy.contains("Water Supply Issue").should("be.visible");
    cy.contains("Street Light Issue").should("not.exist");

    // Clear search
    cy.get('input[placeholder="Search complaints..."]').clear();

    // Test status filter
    cy.get("select").first().select("REGISTERED");

    // Should show only registered complaints
    cy.contains("Water Supply Issue").should("be.visible");

    // Test clear filters
    cy.contains("Clear Filters").click();

    // Should show all complaints again
    cy.contains("Water Supply Issue").should("be.visible");
    cy.contains("Street Light Issue").should("be.visible");
  });
});
