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
    const pageWidth = doc.internal.pageSize.width;

    // === HEADER SECTION ===
    // Company name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Blue
    doc.text("Developer Tech LLP", 14, 22);

    // Company tagline/contact
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Web Development | SEO | Digital Marketing | IT Services", 14, 28);
    doc.text("Email: admin@developertech.in", 14, 33);

    // INVOICE title (right side)
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("INVOICE", pageWidth - 14, 22, { align: "right" });

    // Invoice number
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`# ${invoice.invoiceNumber}`, pageWidth - 14, 30, { align: "right" });

    // Horizontal line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 37, pageWidth - 14, 37);

    // === INVOICE DETAILS ===
    let yPos = 47;

    // Left side - Invoice info
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Invoice Date:", 14, yPos);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(invoice.date), 50, yPos);

    yPos += 6;
    if (invoice.dueDate) {
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Due Date:", 14, yPos);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(invoice.dueDate), 50, yPos);
      yPos += 6;
    }

    // Status badge
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Status:", 14, yPos);
    
    // Status color based on payment status
    const statusColors: Record<string, [number, number, number]> = {
      PAID: [34, 197, 94],     // Green
      PENDING: [234, 179, 8],  // Yellow/Orange
      OVERDUE: [239, 68, 68],  // Red
    };
    const statusColor = statusColors[invoice.status] || [100, 100, 100];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.status, 50, yPos);

    // Right side - Bill To
    yPos = 47;
    const billToX = pageWidth / 2 + 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("BILL TO:", billToX, yPos);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.client.name, billToX, yPos + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    let clientY = yPos + 13;
    if (invoice.client.company) {
      doc.text(invoice.client.company, billToX, clientY);
      clientY += 5;
    }
    if (invoice.client.email) {
      doc.text(invoice.client.email, billToX, clientY);
      clientY += 5;
    }
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, billToX, clientY);
      clientY += 5;
    }
    if (invoice.client.address) {
      doc.text(invoice.client.address, billToX, clientY);
    }

    // === ITEMS TABLE ===
    const tableStartY = 80;
    const hasItems = invoice.items && invoice.items.length > 0;

    if (hasItems) {
      autoTable(doc, {
        startY: tableStartY,
        head: [["#", "Service / Description", "Category", "Qty", "Rate (₹)", "Disc %", "GST %", "Amount (₹)"]],
        body: invoice.items.map((item, idx) => [
          (idx + 1).toString(),
          item.serviceName,
          item.categoryName || "-",
          item.quantity.toString(),
          item.unitPrice.toFixed(2),
          `${item.discount}%`,
          `${item.taxPercent}%`,
          item.amount.toFixed(2),
        ]),
        theme: "striped",
        headStyles: { 
          fillColor: [37, 99, 235], 
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: { 
          fontSize: 8,
          textColor: [40, 40, 40],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 45 },
          2: { cellWidth: 30 },
          3: { cellWidth: 12, halign: "center" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 16, halign: "center" },
          6: { cellWidth: 16, halign: "center" },
          7: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
      });

      // === TOTALS SECTION ===
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 130;
      
      // Draw a box for totals on the right side
      const totalsBoxX = pageWidth - 80;
      const totalsBoxWidth = 66;
      const totalsBoxY = finalY + 8;
      
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxWidth, 38, 2, 2, "FD");

      let totalsY = totalsBoxY + 8;
      const labelX = totalsBoxX + 5;
      const valueX = totalsBoxX + totalsBoxWidth - 5;

      // Subtotal
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("Subtotal:", labelX, totalsY);
      doc.setTextColor(30, 30, 30);
      doc.text(formatCurrency(invoice.subtotal), valueX, totalsY, { align: "right" });

      totalsY += 7;

      // Discount (if any)
      if (invoice.discount > 0) {
        doc.setTextColor(239, 68, 68);
        doc.text("Discount:", labelX, totalsY);
        doc.text(`-${formatCurrency(invoice.discount)}`, valueX, totalsY, { align: "right" });
        totalsY += 7;
      }

      // GST
      doc.setTextColor(80, 80, 80);
      doc.text("GST:", labelX, totalsY);
      doc.setTextColor(30, 30, 30);
      doc.text(formatCurrency(invoice.taxAmount), valueX, totalsY, { align: "right" });

      totalsY += 8;

      // Separator line
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.3);
      doc.line(labelX, totalsY - 3, valueX, totalsY - 3);

      // Grand Total
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("TOTAL:", labelX, totalsY);
      doc.text(formatCurrency(invoice.totalAmount), valueX, totalsY, { align: "right" });

      // Amount in words (optional - Indian format)
      const totalInWords = convertToWords(Math.round(invoice.totalAmount));
      if (totalInWords) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wordsY = ((doc as any).lastAutoTable?.finalY || 130) + 55;
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(`Amount in words: ${totalInWords}`, 14, wordsY);
      }
    } else {
      // Legacy single-service invoice
      autoTable(doc, {
        startY: tableStartY,
        head: [["Service / Description", "Amount (₹)"]],
        body: [[invoice.serviceName || "N/A", (invoice.amount || 0).toFixed(2)]],
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 130;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("TOTAL:", pageWidth - 80, finalY + 15);
      doc.text(formatCurrency(invoice.totalAmount || invoice.amount || 0), pageWidth - 14, finalY + 15, { align: "right" });
    }

    // === NOTES SECTION ===
    if (invoice.notes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notesY = ((doc as any).lastAutoTable?.finalY || 130) + (hasItems ? 65 : 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Notes:", 14, notesY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const splitNotes = doc.splitTextToSize(invoice.notes, 160);
      doc.text(splitNotes, 14, notesY + 6);
    }

    // === FOOTER ===
    const pageHeight = doc.internal.pageSize.height;
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 30, pageWidth - 14, pageHeight - 30);

    // Thank you message
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 22, { align: "center" });

    // Company footer
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text("Developer Tech LLP | admin@developertech.in | www.developertech.in", pageWidth / 2, pageHeight - 14, { align: "center" });

    // Payment terms
    doc.setFontSize(7);
    doc.text("Payment Terms: Due within 15 days of invoice date", 14, pageHeight - 8);

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

// Helper function to convert number to words (Indian system)
function convertToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  if (num < 0) return "";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertLessThanThousand(n % 100) : "");
  }

  let result = "";
  if (num >= 10000000) {
    result += convertLessThanThousand(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (num > 0) {
    result += convertLessThanThousand(num);
  }

  return result.trim() + " Rupees Only";
}
