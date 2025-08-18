import { getPrisma } from "../db/connection.js";

const prisma = getPrisma();

async function migrateComplaintIds() {
  try {
    console.log("Starting complaint ID migration...");

    // Get system configuration or use defaults
    let prefix = "KSC";
    let startNumber = 1;
    let idLength = 4;

    try {
      const config = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              "COMPLAINT_ID_PREFIX",
              "COMPLAINT_ID_START_NUMBER",
              "COMPLAINT_ID_LENGTH",
            ],
          },
        },
      });

      const settings = config.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      prefix = settings.COMPLAINT_ID_PREFIX || "KSC";
      startNumber = parseInt(settings.COMPLAINT_ID_START_NUMBER || "1");
      idLength = parseInt(settings.COMPLAINT_ID_LENGTH || "4");
    } catch (error) {
      console.warn(
        "Could not load configuration, using defaults:",
        error.message,
      );
    }

    // Get all complaints without complaintId, ordered by creation date
    const complaints = await prisma.complaint.findMany({
      where: {
        complaintId: null,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    console.log(`Found ${complaints.length} complaints without complaintId`);

    if (complaints.length === 0) {
      console.log("No complaints to migrate");
      return;
    }

    // Update each complaint with a sequential ID
    for (let i = 0; i < complaints.length; i++) {
      const complaint = complaints[i];
      const sequentialNumber = startNumber + i;
      const formattedNumber = sequentialNumber
        .toString()
        .padStart(idLength, "0");
      const complaintId = `${prefix}${formattedNumber}`;

      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { complaintId },
      });

      console.log(`Updated complaint ${complaint.id} with ID: ${complaintId}`);
    }

    console.log("Complaint ID migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateComplaintIds().catch(console.error);
}

export default migrateComplaintIds;
