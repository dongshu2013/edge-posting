import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(body);

    return NextResponse.json(
      {
        success: true,
        message: "Payment callback processed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process payment callback",
      },
      { status: 500 }
    );
  }
}
