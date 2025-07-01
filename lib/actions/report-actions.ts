"use server";

import { generateReportData } from "@/lib/services/report-data-service";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";

export async function getReportData(organizationId: string) {
  try {
    // Verify user has permission to access this organization
    await verifyUserPermission();
    
    // Generate and return the report data
    const reportData = await generateReportData(organizationId);
    
    // Convert Date objects to strings for serialization
    return JSON.parse(JSON.stringify(reportData));
  } catch (error) {
    console.error("Error generating report data:", error);
    throw new Error("Failed to generate report data");
  }
}