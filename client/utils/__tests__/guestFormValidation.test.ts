import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateAllSteps,
  isValidEmail,
  isValidPhoneNumber,
  isValidComplaintType,
  isValidPriority,
} from "../guestFormValidation";

describe("Guest Form Validation", () => {
  describe("validateStep1", () => {
    it("should validate all required fields correctly", () => {
      const validData = {
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description:
          "This is a valid description that meets the minimum length requirement.",
      };

      const result = validateStep1(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should require full name", () => {
      const invalidData = {
        fullName: "",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description: "Valid description",
      };

      const result = validateStep1(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.fullName).toBe("Full name is required");
    });

    it("should validate full name length", () => {
      const shortName = {
        fullName: "A",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description: "Valid description",
      };

      const result1 = validateStep1(shortName);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.fullName).toBe(
        "Full name must be at least 2 characters",
      );

      const longName = {
        fullName: "A".repeat(101),
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description: "Valid description",
      };

      const result2 = validateStep1(longName);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.fullName).toBe(
        "Full name cannot exceed 100 characters",
      );
    });

    it("should validate email format", () => {
      const invalidEmails = [
        "",
        "invalid",
        "invalid@",
        "@example.com",
        "invalid@.com",
      ];

      invalidEmails.forEach((email) => {
        const data = {
          fullName: "John Doe",
          email,
          phoneNumber: "+1234567890",
          type: "WATER_SUPPLY",
          description: "Valid description",
        };

        const result = validateStep1(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBeDefined();
      });
    });

    it("should validate phone number format", () => {
      const invalidPhones = ["", "123", "12345", "abc123456789"];

      invalidPhones.forEach((phoneNumber) => {
        const data = {
          fullName: "John Doe",
          email: "john@example.com",
          phoneNumber,
          type: "WATER_SUPPLY",
          description: "Valid description",
        };

        const result = validateStep1(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.phoneNumber).toBeDefined();
      });

      // Valid phone numbers
      const validPhones = [
        "+1234567890",
        "1234567890",
        "+91 98765 43210",
        "(555) 123-4567",
      ];

      validPhones.forEach((phoneNumber) => {
        const data = {
          fullName: "John Doe",
          email: "john@example.com",
          phoneNumber,
          type: "WATER_SUPPLY",
          description: "Valid description",
        };

        const result = validateStep1(data);
        expect(result.errors.phoneNumber).toBeUndefined();
      });
    });

    it("should validate complaint type", () => {
      const invalidData = {
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "INVALID_TYPE",
        description: "Valid description",
      };

      const result = validateStep1(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.type).toBe("Invalid complaint type selected");
    });

    it("should validate description length", () => {
      const shortDescription = {
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description: "Short",
      };

      const result1 = validateStep1(shortDescription);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.description).toBe(
        "Description must be at least 10 characters",
      );

      const longDescription = {
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description: "A".repeat(2001),
      };

      const result2 = validateStep1(longDescription);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.description).toBe(
        "Description cannot exceed 2000 characters",
      );
    });
  });

  describe("validateStep2", () => {
    it("should validate all required location fields", () => {
      const validData = {
        wardId: "ward-1",
        subZoneId: "sz-1",
        area: "Downtown Area",
        landmark: "Near City Mall",
        address: "123 Main Street",
      };

      const result = validateStep2(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should require ward selection", () => {
      const invalidData = {
        wardId: "",
        subZoneId: "sz-1",
        area: "Downtown Area",
      };

      const result = validateStep2(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.wardId).toBe("Ward selection is required");
    });

    it("should require sub-zone selection", () => {
      const invalidData = {
        wardId: "ward-1",
        subZoneId: "",
        area: "Downtown Area",
      };

      const result = validateStep2(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.subZoneId).toBe("Sub-zone selection is required");
    });

    it("should validate area length", () => {
      const shortArea = {
        wardId: "ward-1",
        subZoneId: "sz-1",
        area: "A",
      };

      const result1 = validateStep2(shortArea);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.area).toBe("Area must be at least 2 characters");

      const longArea = {
        wardId: "ward-1",
        subZoneId: "sz-1",
        area: "A".repeat(201),
      };

      const result2 = validateStep2(longArea);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.area).toBe("Area cannot exceed 200 characters");
    });

    it("should validate optional fields length", () => {
      const longAddress = {
        wardId: "ward-1",
        subZoneId: "sz-1",
        area: "Valid Area",
        address: "A".repeat(501),
      };

      const result1 = validateStep2(longAddress);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.address).toBe(
        "Address cannot exceed 500 characters",
      );

      const longLandmark = {
        wardId: "ward-1",
        subZoneId: "sz-1",
        area: "Valid Area",
        landmark: "A".repeat(201),
      };

      const result2 = validateStep2(longLandmark);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.landmark).toBe(
        "Landmark cannot exceed 200 characters",
      );
    });
  });

  describe("validateStep3", () => {
    // Helper to create mock files
    const createMockFile = (name: string, size: number, type: string): File => {
      const blob = new Blob([""], { type });
      return new File([blob], name, { type, lastModified: Date.now() });
    };

    it("should allow valid image files", () => {
      const validFiles = [
        createMockFile("image1.jpg", 5 * 1024 * 1024, "image/jpeg"),
        createMockFile("image2.png", 3 * 1024 * 1024, "image/png"),
      ];

      const result = validateStep3(validFiles);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should reject too many files", () => {
      const tooManyFiles = Array.from({ length: 6 }, (_, i) =>
        createMockFile(`image${i}.jpg`, 1024 * 1024, "image/jpeg"),
      );

      const result = validateStep3(tooManyFiles);
      expect(result.isValid).toBe(false);
      expect(result.errors.attachments).toBe("Maximum 5 files allowed");
    });

    it("should reject files exceeding size limit", () => {
      const largeFile = createMockFile(
        "large.jpg",
        11 * 1024 * 1024,
        "image/jpeg",
      );

      const result = validateStep3([largeFile]);
      expect(result.isValid).toBe(false);
      expect(result.errors.attachments).toContain("exceeds 10MB limit");
    });

    it("should reject invalid file types", () => {
      const invalidFile = createMockFile(
        "document.pdf",
        1024 * 1024,
        "application/pdf",
      );

      const result = validateStep3([invalidFile]);
      expect(result.isValid).toBe(false);
      expect(result.errors.attachments).toContain("must be JPG or PNG format");
    });
  });

  describe("validateAllSteps", () => {
    it("should validate complete form data", () => {
      const validData = {
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description: "This is a valid description that meets requirements.",
        wardId: "ward-1",
        subZoneId: "sz-1",
        area: "Downtown Area",
      };

      const validFiles = [
        new File([""], "image.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        }),
      ];

      const result = validateAllSteps(validData, validFiles);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should combine errors from all steps", () => {
      const invalidData = {
        fullName: "", // Invalid
        email: "john@example.com",
        phoneNumber: "+1234567890",
        type: "WATER_SUPPLY",
        description: "Valid description",
        wardId: "", // Invalid
        subZoneId: "sz-1",
        area: "Valid Area",
      };

      const result = validateAllSteps(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.fullName).toBeDefined();
      expect(result.errors.wardId).toBeDefined();
    });
  });

  describe("Helper functions", () => {
    describe("isValidEmail", () => {
      it("should validate email formats correctly", () => {
        expect(isValidEmail("test@example.com")).toBe(true);
        expect(isValidEmail("user+tag@domain.co.uk")).toBe(true);
        expect(isValidEmail("invalid-email")).toBe(false);
        expect(isValidEmail("@example.com")).toBe(false);
        expect(isValidEmail("test@")).toBe(false);
      });
    });

    describe("isValidPhoneNumber", () => {
      it("should validate phone number formats correctly", () => {
        expect(isValidPhoneNumber("+1234567890")).toBe(true);
        expect(isValidPhoneNumber("1234567890")).toBe(true);
        expect(isValidPhoneNumber("+91 98765 43210")).toBe(true);
        expect(isValidPhoneNumber("(555) 123-4567")).toBe(true);
        expect(isValidPhoneNumber("123")).toBe(false);
        expect(isValidPhoneNumber("abc123")).toBe(false);
      });
    });

    describe("isValidComplaintType", () => {
      it("should validate complaint types correctly", () => {
        expect(isValidComplaintType("WATER_SUPPLY")).toBe(true);
        expect(isValidComplaintType("ELECTRICITY")).toBe(true);
        expect(isValidComplaintType("INVALID_TYPE")).toBe(false);
        expect(isValidComplaintType("")).toBe(false);
      });
    });

    describe("isValidPriority", () => {
      it("should validate priority levels correctly", () => {
        expect(isValidPriority("LOW")).toBe(true);
        expect(isValidPriority("MEDIUM")).toBe(true);
        expect(isValidPriority("HIGH")).toBe(true);
        expect(isValidPriority("CRITICAL")).toBe(true);
        expect(isValidPriority("INVALID")).toBe(false);
        expect(isValidPriority("")).toBe(false);
      });
    });
  });
});
