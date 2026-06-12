import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            name: true,
            company: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Dynamic import for jsPDF (client-side library used server-side)
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Developer Tech LLP", 14, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE", 170, 20);

    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 38);
    doc.text(`Date: ${formatDate(invoice.date)}`, 14, 44);
    doc.text(`Status: ${invoice.status}`, 14, 50);

    // Client info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 120, 38);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.client.name, 120, 44);
    if (invoice.client.company) doc.text(invoice.client.company, 120, 50);
    if (invoice.client.email) doc.text(invoice.client.email, 120, 56);
    if (invoice.client.phone) doc.text(invoice.client.phone, 120, 62);
    if (invoice.client.address) doc.text(invoice.client.address, 120, 68);

    // Table
    autoTable(doc, {
      startY: 80,
      head: [["Service", "Amount"]],
      body: [[invoice.serviceName, formatCurrency(invoice.amount)]],
      foot: [["Total", formatCurrency(invoice.amount)]],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text("Thank you for your business!", 14, pageHeight - 20);
    doc.text("Developer Tech LLP | admin@developertech.in", 14, pageHeight - 14);

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
