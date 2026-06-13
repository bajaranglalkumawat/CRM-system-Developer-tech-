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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { name: true, company: true, email: true, phone: true, address: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

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
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 38);
    doc.text(`Date: ${formatDate(invoice.date)}`, 14, 44);
    if (invoice.dueDate) doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 14, 50);
    doc.text(`Status: ${invoice.status}`, 14, 56);

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

    // Items table
    const hasItems = invoice.items && invoice.items.length > 0;

    if (hasItems) {
      autoTable(doc, {
        startY: 80,
        head: [["#", "Service", "Category", "Qty", "Rate", "Disc%", "GST%", "Amount"]],
        body: invoice.items.map((item, idx) => [
          (idx + 1).toString(),
          item.serviceName,
          item.categoryName || "-",
          item.quantity.toString(),
          formatCurrency(item.unitPrice),
          `${item.discount}%`,
          `${item.taxPercent}%`,
          formatCurrency(item.amount),
        ]),
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 10 },
          3: { cellWidth: 12 },
          4: { cellWidth: 22 },
          5: { cellWidth: 16 },
          6: { cellWidth: 16 },
          7: { cellWidth: 25, halign: "right" },
        },
      });

      // Totals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      const totalsX = 130;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", totalsX, finalY + 10);
      doc.text(formatCurrency(invoice.subtotal), 195, finalY + 10, { align: "right" });

      if (invoice.discount > 0) {
        doc.text("Discount:", totalsX, finalY + 17);
        doc.text(`-${formatCurrency(invoice.discount)}`, 195, finalY + 17, { align: "right" });
      }

      doc.text("GST:", totalsX, finalY + 24);
      doc.text(formatCurrency(invoice.taxAmount), 195, finalY + 24, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Total:", totalsX, finalY + 34);
      doc.text(formatCurrency(invoice.totalAmount), 195, finalY + 34, { align: "right" });
    } else {
      // Legacy single-service invoice
      autoTable(doc, {
        startY: 80,
        head: [["Service", "Amount"]],
        body: [[invoice.serviceName || "N/A", formatCurrency(invoice.amount || 0)]],
        foot: [["Total", formatCurrency(invoice.totalAmount || invoice.amount || 0)]],
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
      });
    }

    // Notes
    if (invoice.notes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notesY = ((doc as any).lastAutoTable?.finalY || 120) + (hasItems ? 50 : 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, notesY);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.notes, 14, notesY + 6);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text("Thank you for your business!", 14, pageHeight - 20);
    doc.text("Developer Tech LLP | admin@developertech.in", 14, pageHeight - 14);

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
