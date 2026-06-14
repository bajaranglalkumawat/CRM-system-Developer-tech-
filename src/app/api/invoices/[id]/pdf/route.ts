import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

// Company details
const COMPANY = {
  name: "Developer Tech LLP",
  address: "Rajasthan, Jaipur, India",
  email: "developertech31@gmail.com",
  services: "Web Development | SEO | Digital Marketing | IT Services",
};

// Format Indian Rupees (Rs. instead of Unicode ₹ for PDF compatibility)
function formatINR(amount: number): string {
  return "Rs. " + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

    // A4 size (default)
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.width;
    const marginL = 14;
    const marginR = 14;
    const contentWidth = pageWidth - marginL - marginR;

    // ============================================
    // HEADER SECTION
    // ============================================

    // Top accent bar
    doc.setFillColor(30, 64, 175); // Deep blue
    doc.rect(0, 0, pageWidth, 4, "F");

    // Company Name (left)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text(COMPANY.name, marginL, 18);

    // Company tagline
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(COMPANY.services, marginL, 24);

    // Company address & email
    doc.setFontSize(7.5);
    doc.text(COMPANY.address, marginL, 29);
    doc.text(`Email: ${COMPANY.email}`, marginL, 34);

    // TAX INVOICE title (right side)
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("TAX INVOICE", pageWidth - marginR, 18, { align: "right" });

    // Accent line under header
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.line(marginL, 38, pageWidth - marginR, 38);

    // ============================================
    // BILL TO (LEFT) & INVOICE DETAILS (RIGHT)
    // ============================================
    const sectionY = 46;
    const leftColX = marginL;
    const rightColX = pageWidth / 2 + 5;
    const halfWidth = contentWidth / 2 - 10;

    // --- LEFT: Bill To ---
    // Section header
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(leftColX, sectionY - 5, halfWidth, 7, 1, 1, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("BILL TO:", leftColX + 3, sectionY);

    // Client name
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(invoice.client.name, leftColX + 3, sectionY + 9);

    // Client details
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    let clientY = sectionY + 15;
    if (invoice.client.company) {
      doc.text(invoice.client.company, leftColX + 3, clientY);
      clientY += 5;
    }
    if (invoice.client.email) {
      doc.text(invoice.client.email, leftColX + 3, clientY);
      clientY += 5;
    }
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, leftColX + 3, clientY);
      clientY += 5;
    }
    if (invoice.client.address) {
      const addrLines = doc.splitTextToSize(invoice.client.address, halfWidth - 10);
      doc.text(addrLines, leftColX + 3, clientY);
    }

    // --- RIGHT: Invoice Details ---
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(rightColX, sectionY - 5, halfWidth, 7, 1, 1, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("INVOICE DETAILS:", rightColX + 3, sectionY);

    // Invoice number
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice No:", rightColX + 3, sectionY + 10);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoiceNumber, rightColX + 35, sectionY + 10);

    // Invoice date
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice Date:", rightColX + 3, sectionY + 17);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(invoice.date), rightColX + 35, sectionY + 17);

    // Due date (if exists)
    if (invoice.dueDate) {
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.text("Due Date:", rightColX + 3, sectionY + 24);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(invoice.dueDate), rightColX + 35, sectionY + 24);
    }

    // Payment Status with colored badge
    const statusY = invoice.dueDate ? sectionY + 31 : sectionY + 24;
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Status:", rightColX + 3, statusY);

    const statusColors: Record<string, [number, number, number]> = {
      PAID: [34, 197, 94],
      PENDING: [234, 179, 8],
      OVERDUE: [239, 68, 68],
    };
    const sColor = statusColors[invoice.status] || [100, 100, 100];
    // Status badge background
    const statusText = invoice.status;
    const statusWidth = doc.getTextWidth(statusText) + 8;
    doc.setFillColor(sColor[0], sColor[1], sColor[2]);
    doc.roundedRect(rightColX + 33, statusY - 4, statusWidth, 5, 1, 1, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, rightColX + 37, statusY - 1);

    // ============================================
    // SERVICE DETAILS TABLE
    // ============================================
    const tableStartY = Math.max(clientY, statusY + 8) + 8;
    const hasItems = invoice.items && invoice.items.length > 0;

    if (hasItems) {
      autoTable(doc, {
        startY: tableStartY,
        head: [["S.No", "Service Category", "Service Description", "Qty", "Rate", "Discount", "GST %", "Amount"]],
        body: invoice.items.map((item, idx) => {
          // Calculate per-item amounts for display
          const gross = item.unitPrice * item.quantity;
          const discAmt = (gross * item.discount) / 100;
          return [
            (idx + 1).toString(),
            item.categoryName || "-",
            item.serviceName,
            item.quantity.toString(),
            formatINR(item.unitPrice),
            item.discount > 0 ? `${item.discount}% (-${formatINR(discAmt)})` : "0%",
            `${item.taxPercent}%`,
            formatINR(item.amount),
          ];
        }),
        theme: "grid",
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: "bold",
          halign: "center",
          cellPadding: 3,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [40, 40, 40],
          cellPadding: 2.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 32 },
          2: { cellWidth: 40 },
          3: { cellWidth: 12, halign: "center" },
          4: { cellWidth: 24, halign: "right" },
          5: { cellWidth: 28, halign: "center" },
          6: { cellWidth: 16, halign: "center" },
          7: { cellWidth: 26, halign: "right", fontStyle: "bold" },
        },
        margin: { left: marginL, right: marginR },
        didParseCell: function(data) {
          // Add bottom border to header
          if (data.section === "head" && data.row.index === 0) {
            data.cell.styles.lineWidth = { bottom: 0.5, top: 0, left: 0, right: 0 };
            data.cell.styles.lineColor = [30, 64, 175];
          }
        },
      });

      // ============================================
      // AMOUNT SUMMARY SECTION
      // ============================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 160;

      // Summary box on right side
      const summaryWidth = 75;
      const summaryX = pageWidth - marginR - summaryWidth;
      const summaryY = finalY + 8;

      // Summary background
      doc.setFillColor(250, 251, 253);
      doc.setDrawColor(200, 210, 230);
      doc.setLineWidth(0.3);
      doc.roundedRect(summaryX, summaryY, summaryWidth, 42, 2, 2, "FD");

      let rowY = summaryY + 8;
      const lblX = summaryX + 5;
      const valX = summaryX + summaryWidth - 5;

      // Subtotal
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Subtotal:", lblX, rowY);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text(formatINR(invoice.subtotal), valX, rowY, { align: "right" });

      rowY += 8;

      // Discount Amount
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Discount Amount:", lblX, rowY);
      doc.setTextColor(invoice.discount > 0 ? 239 : 100, invoice.discount > 0 ? 68 : 100, invoice.discount > 0 ? 68 : 100);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.discount > 0 ? `- ${formatINR(invoice.discount)}` : formatINR(0), valX, rowY, { align: "right" });

      rowY += 8;

      // GST Amount
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("GST Amount:", lblX, rowY);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text(formatINR(invoice.taxAmount), valX, rowY, { align: "right" });

      rowY += 6;

      // Separator
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(lblX, rowY, valX, rowY);

      rowY += 8;

      // Grand Total
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text("GRAND TOTAL:", lblX, rowY);
      doc.text(formatINR(invoice.totalAmount), valX, rowY, { align: "right" });

      // Amount in Words (Indian numbering system)
      const totalInWords = convertToWords(Math.round(invoice.totalAmount));
      if (totalInWords) {
        const wordsY = summaryY + 50;
        doc.setFillColor(255, 255, 240);
        doc.setDrawColor(220, 200, 150);
        doc.roundedRect(marginL, wordsY - 5, contentWidth, 9, 1, 1, "FD");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 80, 30);
        doc.text(`Amount in Words: ${totalInWords}`, marginL + 4, wordsY + 1);
      }
    } else {
      // Legacy single-service invoice (backward compat)
      autoTable(doc, {
        startY: tableStartY,
        head: [["S.No", "Service Description", "Amount"]],
        body: [["1", invoice.serviceName || "N/A", formatINR(invoice.amount || 0)]],
        theme: "grid",
        headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 130;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text("GRAND TOTAL:", pageWidth - 90, finalY + 15);
      doc.text(formatINR(invoice.totalAmount || invoice.amount || 0), pageWidth - marginR, finalY + 15, { align: "right" });
    }

    // ============================================
    // NOTES SECTION
    // ============================================
    if (invoice.notes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notesY = ((doc as any).lastAutoTable?.finalY || 130) + (hasItems ? 65 : 30);
      
      // Check if we have space for notes on this page
      if (notesY < doc.internal.pageSize.height - 50) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text("Notes:", marginL, notesY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        const splitNotes = doc.splitTextToSize(invoice.notes, contentWidth - 10);
        doc.text(splitNotes, marginL, notesY + 5);
      }
    }

    // ============================================
    // FOOTER
    // ============================================
    const pageHeight = doc.internal.pageSize.height;

    // Footer accent line
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(marginL, pageHeight - 32, pageWidth - marginR, pageHeight - 32);

    // Thank you message
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 24, { align: "center" });

    // Company footer info
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(COMPANY.name, pageWidth / 2, pageHeight - 17, { align: "center" });
    doc.text(COMPANY.address, pageWidth / 2, pageHeight - 12, { align: "center" });
    doc.text(COMPANY.email, pageWidth / 2, pageHeight - 7, { align: "center" });

    // Bottom accent bar
    doc.setFillColor(30, 64, 175);
    doc.rect(0, pageHeight - 3, pageWidth, 3, "F");

    // ============================================
    // OUTPUT
    // ============================================
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tax-invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

// ============================================
// HELPER: Convert number to Indian words
// ============================================
function convertToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  if (num < 0) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " and " + convertLessThanThousand(n % 100) : "")
    );
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
