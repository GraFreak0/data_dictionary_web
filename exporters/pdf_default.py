"""
exporters/pdf_default.py
========================
Modern PDF exporter with proper text wrapping and clean styling.
Uses Paragraph objects in all table cells so long descriptions never overflow.
"""

import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

from exporters.base import BaseExporter


# ── Palette ───────────────────────────────────────────────────────────────────
PRIMARY    = "#1e40af"   # deep blue
PRIMARY_LT = "#dbeafe"  # light blue header bg
ACCENT     = "#3b82f6"  # mid blue
MUTED      = "#64748b"  # slate
BORDER     = "#cbd5e1"  # light border
ROW_ALT    = "#f8fafc"  # very light alt row
HEADER_TXT = "#1e293b"  # dark text for headers
WHITE      = "#ffffff"


class DefaultPDFExporter(BaseExporter):
    name      = "pdf"
    label     = "PDF Document"
    mime_type = "application/pdf"
    extension = ".pdf"

    # Usable width on A4 with 18mm margins each side
    PAGE_W = A4[0] - 36 * mm   # ≈ 159 mm  ≈ 6.26 inch

    # Column proportions  (name | type | description)
    COL_NAME  = 1.3 * inch
    COL_TYPE  = 1.1 * inch
    COL_DESC  = PAGE_W - 1.3 * inch - 1.1 * inch   # remainder

    def export(self, data: dict, user, export_type: str, resources: list) -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
        )

        styles = getSampleStyleSheet()

        # ── Custom styles ─────────────────────────────────────────────────────
        s_title = ParagraphStyle(
            "DDTitle",
            parent=styles["Normal"],
            fontSize=26, leading=32,
            textColor=colors.HexColor(PRIMARY),
            alignment=TA_CENTER, spaceAfter=4,
        )
        s_subtitle = ParagraphStyle(
            "DDSubtitle",
            parent=styles["Normal"],
            fontSize=11, leading=16,
            textColor=colors.HexColor(MUTED),
            alignment=TA_CENTER, spaceAfter=14,
        )
        s_schema = ParagraphStyle(
            "DDSchema",
            parent=styles["Normal"],
            fontSize=13, leading=18, fontName="Helvetica-Bold",
            textColor=colors.HexColor(PRIMARY),
            spaceBefore=14, spaceAfter=4,
        )
        s_table_h = ParagraphStyle(
            "DDTable",
            parent=styles["Normal"],
            fontSize=10, leading=14, fontName="Helvetica-Bold",
            textColor=colors.HexColor(HEADER_TXT),
            spaceBefore=10, spaceAfter=2,
        )
        s_table_desc = ParagraphStyle(
            "DDTableDesc",
            parent=styles["Normal"],
            fontSize=9, leading=13,
            textColor=colors.HexColor(MUTED),
            spaceAfter=4, leftIndent=6,
        )
        # Cell styles (used inside table cells)
        s_cell_hdr = ParagraphStyle(
            "DDCellHdr",
            parent=styles["Normal"],
            fontSize=8, leading=11, fontName="Helvetica-Bold",
            textColor=colors.HexColor(WHITE),
        )
        s_cell_name = ParagraphStyle(
            "DDCellName",
            parent=styles["Normal"],
            fontSize=8, leading=11, fontName="Helvetica-Bold",
            textColor=colors.HexColor(HEADER_TXT),
        )
        s_cell = ParagraphStyle(
            "DDCell",
            parent=styles["Normal"],
            fontSize=8, leading=12,
            textColor=colors.HexColor(HEADER_TXT),
            wordWrap="CJK",
        )
        s_cell_muted = ParagraphStyle(
            "DDCellMuted",
            parent=styles["Normal"],
            fontSize=8, leading=12,
            textColor=colors.HexColor(MUTED),
            fontName="Helvetica-Oblique",
            wordWrap="CJK",
        )
        s_meta_label = ParagraphStyle(
            "DDMetaLabel",
            parent=styles["Normal"],
            fontSize=8, leading=12, fontName="Helvetica-Bold",
            textColor=colors.HexColor(MUTED),
        )
        s_meta_val = ParagraphStyle(
            "DDMetaVal",
            parent=styles["Normal"],
            fontSize=8, leading=12,
            textColor=colors.HexColor(HEADER_TXT),
        )

        elements = []
        meta = data.get("meta", {})

        # ── Cover block ───────────────────────────────────────────────────────
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("Data Dictionary", s_title))
        elements.append(Paragraph("Schema Documentation Export", s_subtitle))
        elements.append(HRFlowable(
            width="100%", thickness=1.5,
            color=colors.HexColor(ACCENT), spaceAfter=10,
        ))

        # Metadata row
        meta_rows = [
            [Paragraph("Generated by", s_meta_label), Paragraph(meta.get("generated_by", "—"), s_meta_val),
             Paragraph("Generated at", s_meta_label), Paragraph(meta.get("generated_at", "—"), s_meta_val)],
        ]
        meta_tbl = Table(meta_rows, colWidths=[1.1*inch, 2.2*inch, 1.1*inch, 2.2*inch])
        meta_tbl.setStyle(TableStyle([
            ("ALIGN",     (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",    (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(meta_tbl)
        elements.append(Spacer(1, 0.3 * inch))

        # ── Schemas / Tables / Columns ────────────────────────────────────────
        primary_c    = colors.HexColor(PRIMARY)
        primary_lt_c = colors.HexColor(PRIMARY_LT)
        border_c     = colors.HexColor(BORDER)
        row_alt_c    = colors.HexColor(ROW_ALT)
        white_c      = colors.HexColor(WHITE)
        muted_c      = colors.HexColor(MUTED)

        col_widths = [self.COL_NAME, self.COL_TYPE, self.COL_DESC]

        for schema in data.get("schemas", []):
            elements.append(Paragraph(f"● {schema['name']}", s_schema))
            elements.append(HRFlowable(
                width="100%", thickness=0.5,
                color=colors.HexColor(BORDER), spaceAfter=6,
            ))

            for tbl in schema.get("tables", []):
                elements.append(Paragraph(f"⟶  {tbl['name']}", s_table_h))
                desc_text = (tbl.get("description") or "").strip() or "No description provided."
                elements.append(Paragraph(desc_text, s_table_desc))

                columns = tbl.get("columns", [])
                if not columns:
                    elements.append(Spacer(1, 0.1 * inch))
                    continue

                # Header row
                header = [
                    Paragraph("Column", s_cell_hdr),
                    Paragraph("Data Type", s_cell_hdr),
                    Paragraph("Description", s_cell_hdr),
                ]
                rows = [header]
                for col in columns:
                    raw_desc = (col.get("description") or "").strip()
                    rows.append([
                        Paragraph(col.get("name", ""), s_cell_name),
                        Paragraph(col.get("data_type", ""), s_cell),
                        Paragraph(raw_desc, s_cell) if raw_desc else Paragraph("—", s_cell_muted),
                    ])

                col_tbl = Table(rows, colWidths=col_widths, repeatRows=1)

                tbl_style = [
                    # Header
                    ("BACKGROUND",     (0, 0), (-1, 0),  primary_c),
                    ("TOPPADDING",     (0, 0), (-1, 0),  6),
                    ("BOTTOMPADDING",  (0, 0), (-1, 0),  6),
                    ("LEFTPADDING",    (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING",   (0, 0), (-1, -1), 6),
                    # Body
                    ("VALIGN",         (0, 0), (-1, -1), "TOP"),
                    ("ALIGN",          (0, 0), (-1, -1), "LEFT"),
                    ("TOPPADDING",     (0, 1), (-1, -1), 5),
                    ("BOTTOMPADDING",  (0, 1), (-1, -1), 5),
                    # Grid
                    ("LINEBELOW",      (0, 0), (-1, 0),  0.5, border_c),
                    ("LINEBELOW",      (0, 1), (-1, -2), 0.3, border_c),
                    ("BOX",            (0, 0), (-1, -1), 0.5, border_c),
                ]
                # Alternating rows
                for i in range(2, len(rows), 2):
                    tbl_style.append(("BACKGROUND", (0, i), (-1, i), row_alt_c))

                col_tbl.setStyle(TableStyle(tbl_style))
                elements.append(col_tbl)
                elements.append(Spacer(1, 0.2 * inch))

            elements.append(PageBreak())

        doc.build(elements)
        buf.seek(0)
        return buf.getvalue()
