import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getComplaintSummary = async (req, res) => {
  try {
    const { wardId, assignToTeam } = req.query;
    const whereClause = {};
    
    if (wardId) {
      whereClause.wardId = wardId;
    }
    
    if (assignToTeam === "true") {
      whereClause.assignToTeam = true;
    }

    // Get total complaints
    const totalComplaints = await prisma.complaint.count({
      where: whereClause,
    });

    // Get complaints by status
    const complaintsByStatus = await prisma.complaint.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    res.json({
      success: true,
      data: {
        totalComplaints,
        complaintsByStatus
      }
    });
  } catch (error) {
    console.error('Error in getComplaintSummary:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
