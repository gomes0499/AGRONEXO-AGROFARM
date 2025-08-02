import { NextResponse } from "next/server";
import { exportReportDataAsJSONPublic } from "@/lib/actions/export-report-data-actions-public";

export async function GET() {
  try {
    const organizationId = "41ee5785-2d48-4f68-a307-d4636d114ab1";
    const data = await exportReportDataAsJSONPublic(organizationId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}