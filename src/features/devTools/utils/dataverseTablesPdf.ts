import type { jsPDF } from 'jspdf'
import {
  DATAVERSE_TABLES,
  PROCESS_STAGES,
  type DataverseTableDoc,
} from '../data/dataverseTables'

const NAVY: [number, number, number] = [30, 58, 71]
const GOLD: [number, number, number] = [201, 169, 110]
const MARGIN = 14

// jsPDF's built-in fonts only cover Latin-1/WinAnsi, so swap glyphs outside it.
function clean(text: string): string {
  return text.replace(/→/g, '->').replace(/`/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
}

function tableName(id: string): string {
  return DATAVERSE_TABLES.find((t) => t.id === id)?.displayName ?? id
}

/** Builds and downloads the Dataverse tables reference as a PDF. */
export async function downloadDataverseTablesPdf(
  tables: DataverseTableDoc[] = DATAVERSE_TABLES,
  includeProcessMap = true
): Promise<void> {
  // Loaded on demand so the PDF libraries stay out of the main bundle.
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc: jsPDF = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2

  const lastY = () =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? MARGIN
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage()
      y = MARGIN
    }
  }

  const heading = (text: string, size: number) => {
    ensureSpace(size)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(...NAVY)
    doc.text(clean(text), MARGIN, y)
    y += size * 0.5 + 1
  }

  const paragraph = (text: string) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    const lines = doc.splitTextToSize(clean(text), contentWidth) as string[]
    ensureSpace(lines.length * 4 + 2)
    doc.text(lines, MARGIN, y)
    y += lines.length * 4 + 2
  }

  const table = (
    head: string[],
    body: string[][],
    columnStyles: Record<number, { cellWidth: number }> = {}
  ) => {
    autoTable(doc, {
      startY: y,
      head: [head.map(clean)],
      body: body.map((row) => row.map(clean)),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 1.8, overflow: 'linebreak', textColor: [51, 65, 85] },
      headStyles: { fillColor: NAVY, textColor: [245, 242, 236] },
      alternateRowStyles: { fillColor: [248, 246, 241] },
      columnStyles,
    })
    y = lastY() + 5
  }

  // Cover block
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 26, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(245, 242, 236)
  doc.text('Dataverse Tables Reference', MARGIN, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text(
    `Closing Suite - Developer Mode - Generated ${new Date().toLocaleString()}`,
    MARGIN,
    21
  )
  y = 34

  paragraph(
    'What each table stores, who reads and writes it, and how it is used across the closing process. ' +
      'Use it to plan tests and process changes (TDD / PDD). Full detail: docs/DEVELOPER_GUIDE.md section 5.'
  )

  heading('Overview', 13)
  table(
    ['Table', 'Logical name', 'Group', 'Linked by', 'Audit'],
    tables.map((t) => [
      t.displayName,
      t.logicalName,
      t.group,
      t.linkedBy,
      t.auditLogged ? 'Yes' : 'No',
    ]),
    { 0: { cellWidth: 34 }, 2: { cellWidth: 26 }, 4: { cellWidth: 12 } }
  )

  if (includeProcessMap) {
    heading('Process map', 13)
    table(
      ['Stage', 'Table', 'What happens'],
      PROCESS_STAGES.flatMap((stage) =>
        stage.tablesTouched.map((touch, i) => [
          i === 0 ? `${stage.stage}\n${stage.trigger}` : '',
          tableName(touch.tableId),
          touch.effect,
        ])
      ),
      { 0: { cellWidth: 55 }, 1: { cellWidth: 38 } }
    )
  }

  for (const t of tables) {
    doc.addPage()
    y = MARGIN
    heading(`${t.displayName}  (${t.group})`, 14)
    paragraph(t.purpose)

    table(
      ['Property', 'Value'],
      [
        ['Logical name', t.logicalName],
        ['Entity set', t.entitySet],
        ['Service', t.generatedService],
        ['Wrapper file', t.serviceFile],
        ['Linked by', t.linkedBy],
        ['Audit logged', t.auditLogged ? 'Yes - writes call writeChangeLog()' : 'No'],
        ['App reads', t.access.appReads],
        ['App writes', t.access.appWrites],
        ['Automation', t.access.automationWrites],
      ],
      { 0: { cellWidth: 32 } }
    )

    heading('Key columns', 11)
    table(['Column', 'Notes'], t.keyColumns.map((c) => [c.name, c.note]), {
      0: { cellWidth: 62 },
    })

    heading('How it is used in the process', 11)
    table(['Where', 'What happens'], t.usage.map((u) => [u.where, u.how]), {
      0: { cellWidth: 62 },
    })

    heading('TDD / PDD notes', 11)
    table(['Note'], t.testingNotes.map((n) => [n]))
  }

  // Footer with page numbers on every page
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 8, {
      align: 'right',
    })
    doc.text('Dataverse Tables Reference', MARGIN, pageHeight - 8)
  }

  doc.save(`dataverse-tables-reference-${new Date().toISOString().slice(0, 10)}.pdf`)
}
