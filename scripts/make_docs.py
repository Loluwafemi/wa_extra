from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)

W, H = A4
MARGIN = 1.8*cm
BODY_W = W - 2*MARGIN

GREEN     = HexColor("#128C7E")
GREEN_LT  = HexColor("#25D366")
GREEN_BG  = HexColor("#E8F5E9")
NAVY      = HexColor("#0D1B2A")
SLATE     = HexColor("#4A5568")
SLATE_LT  = HexColor("#F7FAFC")
AMBER     = HexColor("#D69E2E")
AMBER_BG  = HexColor("#FFFBEB")
CODE_BG   = HexColor("#1A202C")
CODE_FG   = HexColor("#68D391")
RED       = HexColor("#C53030")
WHITE     = colors.white
BORDER    = HexColor("#E2E8F0")

def PS(name, **kw):
    styles = getSampleStyleSheet()
    base = kw.pop("base", "Normal")
    return ParagraphStyle(name, parent=styles[base], **kw)

h1_s    = PS("H1", fontSize=22, leading=28, textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_CENTER)
h2_s    = PS("H2", fontSize=13, leading=18, textColor=GREEN, fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=5)
h3_s    = PS("H3", fontSize=10.5, leading=14, textColor=NAVY, fontName="Helvetica-Bold", spaceBefore=6)
body_s  = PS("B",  fontSize=9.5, leading=15, textColor=NAVY, alignment=TA_JUSTIFY)
mono_s  = PS("M",  fontSize=9, leading=14, textColor=CODE_FG, fontName="Courier")
label_s = PS("LB", fontSize=7.5, leading=10, textColor=SLATE, fontName="Helvetica-Bold")
note_s  = PS("NT", fontSize=8.5, leading=13, textColor=SLATE, fontName="Helvetica-Oblique")
step_n  = PS("SN", fontSize=16, leading=20, textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_CENTER)
step_t  = PS("ST", fontSize=10.5, leading=14, textColor=NAVY, fontName="Helvetica-Bold")
step_b  = PS("SB", fontSize=9.5, leading=14, textColor=SLATE, alignment=TA_JUSTIFY)
bullet_s= PS("BL", fontSize=9.5, leading=14, textColor=NAVY, leftIndent=14, firstLineIndent=-10, spaceAfter=3)
warn_s  = PS("WN", fontSize=9, leading=13, textColor=HexColor("#744210"), alignment=TA_JUSTIFY)
ok_s    = PS("OK", fontSize=9, leading=13, textColor=HexColor("#1A4731"), alignment=TA_JUSTIFY)
footer_s= PS("FT", fontSize=7.5, leading=10, textColor=SLATE, alignment=TA_CENTER)
toc_s   = PS("TC", fontSize=9.5, leading=16, textColor=NAVY)

doc = SimpleDocTemplate(
    "/home/claude/output/WA_Extractor_Setup_Guide.pdf",
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=MARGIN,
    title="WhatsApp Group Extractor — Setup Guide"
)

story = []

# ── COVER ─────────────────────────────────────────────────────────────────────
cover_rows = [
    [Paragraph("📋", PS("em", fontSize=36, alignment=TA_CENTER))],
    [Paragraph("WhatsApp Group Extractor", h1_s)],
    [Paragraph("Chrome Extension — Complete Setup Guide", PS("sub", fontSize=12, textColor=HexColor("#A7F3D0"), alignment=TA_CENTER))],
    [Spacer(1, 10)],
    [Paragraph("Extract names &amp; phone numbers from WhatsApp groups → Save to Excel", PS("tag", fontSize=10, textColor=HexColor("#6EE7B7"), alignment=TA_CENTER))],
]
ct = Table(cover_rows, colWidths=[BODY_W])
ct.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,-1), NAVY),
    ("TOPPADDING",    (0,0), (-1,-1), 12),
    ("BOTTOMPADDING", (0,0), (-1,-1), 12),
    ("LEFTPADDING",   (0,0), (-1,-1), 20),
    ("RIGHTPADDING",  (0,0), (-1,-1), 20),
]))
story.append(ct)
story.append(Spacer(1, 16))

# ── TOC ──────────────────────────────────────────────────────────────────────
story.append(Paragraph("Contents", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=8))
toc_items = [
    ("1.", "Requirements"),
    ("2.", "Installation — Step by Step"),
    ("3.", "How to Use the Extension"),
    ("4.", "Understanding the Excel Output"),
    ("5.", "Feature Reference"),
    ("6.", "Troubleshooting"),
    ("7.", "Important Notes &amp; Limitations"),
]
toc_data = [[Paragraph(n, PS(f"tn{i}", fontSize=9.5, textColor=GREEN, fontName="Helvetica-Bold")),
             Paragraph(t, toc_s)] for i, (n, t) in enumerate(toc_items)]
toc_t = Table(toc_data, colWidths=[1*cm, BODY_W-1*cm])
toc_t.setStyle(TableStyle([
    ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LINEBELOW", (0,0), (-1,-2), 0.3, BORDER),
]))
story.append(toc_t)
story.append(Spacer(1, 16))

# ── SECTION 1: REQUIREMENTS ──────────────────────────────────────────────────
story.append(Paragraph("1. Requirements", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=8))
reqs = [
    ("Google Chrome", "Version 88 or later (Manifest V3 support)", GREEN),
    ("WhatsApp Account", "Active account accessible on WhatsApp Web", GREEN),
    ("Internet Connection", "Required for WhatsApp Web to function", SLATE),
    ("Extension Files", "The whatsapp-extractor folder (provided as .zip)", SLATE),
]
req_rows = [[
    Paragraph(r[0], PS(f"rn{i}", fontSize=9.5, fontName="Helvetica-Bold", textColor=r[2])),
    Paragraph(r[1], body_s)
] for i, r in enumerate(reqs)]
req_t = Table(req_rows, colWidths=[BODY_W*0.32, BODY_W*0.68])
req_t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,-1), SLATE_LT),
    ("TOPPADDING",    (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ("LINEBELOW",     (0,0), (-1,-2), 0.3, BORDER),
    ("BOX",           (0,0), (-1,-1), 0.5, BORDER),
]))
story.append(req_t)
story.append(Spacer(1, 16))

# ── SECTION 2: INSTALLATION ──────────────────────────────────────────────────
story.append(Paragraph("2. Installation — Step by Step", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=10))

steps = [
    ("1", "Extract the ZIP File",
     "Right-click the downloaded whatsapp-extractor.zip file and select Extract All (Windows) "
     "or double-click (Mac). You should see a folder named whatsapp-extractor containing: "
     "manifest.json, popup.html, popup.js, content.js, background.js, lib/xlsx.min.js, and icons/.",
     None),
    ("2", "Open Chrome Extensions Page",
     "Open Google Chrome and navigate to the Extensions Manager. You can do this in two ways:",
     [
         "Type <b>chrome://extensions</b> in the address bar and press Enter",
         "Or click the three-dot menu (⋮) → More Tools → Extensions"
     ]),
    ("3", "Enable Developer Mode",
     "In the top-right corner of the Extensions page, toggle on the <b>Developer Mode</b> switch. "
     "This unlocks the ability to load unpacked extensions (extensions not from the Chrome Web Store).",
     None),
    ("4", "Load the Extension",
     "Click the <b>Load unpacked</b> button that appears after enabling Developer Mode. "
     "A file browser will open. Navigate to and select the whatsapp-extractor folder "
     "(the folder that contains manifest.json — not the zip file).",
     None),
    ("5", "Confirm Installation",
     "The WA Extractor card should now appear on the Extensions page with a green toggle. "
     "You will also see a clipboard icon (📋) appear in Chrome's toolbar area.",
     None),
    ("6", "Pin the Extension (Recommended)",
     "Click the puzzle piece icon (🧩) in Chrome's toolbar. Find WA Extractor in the list "
     "and click the pin icon (📌) next to it so the extension icon is always visible.",
     None),
]

for num, title, body_text, extras in steps:
    blk = [Paragraph(f"<bullet>&bull;</bullet> {e}", bullet_s) for e in (extras or [])]
    inner = [[Paragraph(title, step_t)], [Paragraph(body_text, step_b)]] + ([[b] for b in blk] if blk else [])
    inner_t = Table(inner, colWidths=[BODY_W - 1.5*cm])
    inner_t.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),2),("BOTTOMPADDING",(0,0),(-1,-1),2),("LEFTPADDING",(0,0),(-1,-1),0)]))

    row_data = [[
        Table([[Paragraph(num, step_n)]], colWidths=[1.2*cm],
              style=[("BACKGROUND",(0,0),(-1,-1),GREEN),("TOPPADDING",(0,0),(-1,-1),8),
                     ("BOTTOMPADDING",(0,0),(-1,-1),8),("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE")]),
        inner_t
    ]]
    row_t = Table(row_data, colWidths=[1.5*cm, BODY_W - 1.5*cm])
    row_t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),SLATE_LT),
        ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),8), ("RIGHTPADDING",(0,0),(-1,-1),10),
        ("BOX",(0,0),(-1,-1),0.5,BORDER), ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    story.append(row_t)
    story.append(Spacer(1, 6))

story.append(Spacer(1, 10))

# ── SECTION 3: HOW TO USE ─────────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("3. How to Use the Extension", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=10))

usage_steps = [
    ("Open WhatsApp Web", "Go to web.whatsapp.com in Chrome and scan the QR code to log in as normal."),
    ("Click the Extension Icon", "Click the 📋 clipboard icon in the Chrome toolbar to open the extension popup."),
    ("Turn ON the Toggle", "Flip the toggle switch to the ON position. The dot will turn green and pulse, and the label will change to MONITORING ON."),
    ("Open a Group Chat", "Click on any WhatsApp group in your chat list. The extension will automatically detect it is a group, open the group info panel, scroll through all members, extract names and phone numbers, and save them to browser storage."),
    ("Watch the Progress", "The popup shows real-time status: the group name being extracted, a progress bar, and log messages showing what's happening. You'll see how many new contacts were added and how many duplicates were skipped."),
    ("Open More Groups", "Simply click on another group chat. The extension detects the navigation and automatically extracts the new group's members, appending them to the existing data (no duplicates)."),
    ("Download the Excel File", "Click the ⬇ Download Excel button in the popup. A .xlsx file will be saved to your Downloads folder containing all extracted contacts across all groups."),
    ("Turn OFF when Done", "Toggle the switch OFF when you are finished. The monitoring stops completely and your data is preserved in storage for the next session."),
]
for i, (title, body_text) in enumerate(usage_steps):
    story.append(Paragraph(f"<b>Step {i+1}: {title}</b>", h3_s))
    story.append(Paragraph(body_text, body_s))
    story.append(Spacer(1, 5))

story.append(Spacer(1, 12))

# ── SECTION 4: EXCEL OUTPUT ───────────────────────────────────────────────────
story.append(Paragraph("4. Understanding the Excel Output", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=8))

story.append(Paragraph(
    "The downloaded .xlsx file contains multiple worksheets:", body_s))
story.append(Spacer(1, 6))

sheet_rows = [
    [Paragraph("Sheet", label_s), Paragraph("Contents", label_s), Paragraph("Columns", label_s)],
    [Paragraph("All Contacts", PS("sc1", fontSize=9.5, fontName="Helvetica-Bold", textColor=GREEN)),
     Paragraph("Every unique contact from all groups combined", body_s),
     Paragraph("Name, Phone Number, Group, Added At", PS("c1", fontSize=8.5, textColor=SLATE))],
    [Paragraph("[Group Name]", PS("sc2", fontSize=9.5, fontName="Helvetica-Bold", textColor=AMBER)),
     Paragraph("One sheet per group — only that group's members", body_s),
     Paragraph("Name, Phone Number, Added At", PS("c2", fontSize=8.5, textColor=SLATE))],
]
sh_t = Table(sheet_rows, colWidths=[BODY_W*0.22, BODY_W*0.44, BODY_W*0.34])
sh_t.setStyle(TableStyle([
    ("BACKGROUND",  (0,0), (-1,0),  NAVY), ("TEXTCOLOR", (0,0),(-1,0), WHITE),
    ("BACKGROUND",  (0,1), (-1,1),  GREEN_BG),
    ("BACKGROUND",  (0,2), (-1,2),  AMBER_BG),
    ("TOPPADDING",  (0,0), (-1,-1), 7), ("BOTTOMPADDING",(0,0),(-1,-1),7),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
    ("BOX",         (0,0), (-1,-1), 0.5, BORDER),
    ("LINEBELOW",   (0,0), (-1,-2), 0.3, BORDER),
]))
story.append(sh_t)
story.append(Spacer(1, 8))

story.append(Paragraph(
    "<b>Duplicate handling:</b> Contacts are deduplicated using the phone number as the unique key. "
    "If a contact appears in multiple groups, only the first occurrence is kept. The popup shows how many "
    "duplicates were skipped in the Dupes Skipped counter.", body_s))
story.append(Spacer(1, 16))

# ── SECTION 5: FEATURE REFERENCE ─────────────────────────────────────────────
story.append(Paragraph("5. Feature Reference", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=8))

features = [
    ("ON/OFF Toggle", "Starts or stops monitoring. State is saved — if you close and reopen the popup, it remembers your last setting."),
    ("Group Auto-Detection", "The extension monitors URL changes and DOM mutations to detect when you switch to a new group — no manual trigger needed."),
    ("Progress Bar", "Shows real-time extraction progress: Opening → Scrolling → Parsing → Saving → Done."),
    ("Activity Log", "Rolling log of the last 50 events with timestamps. Color-coded: green = success, amber = warning, red = error."),
    ("Contacts Counter", "Total unique contacts across all groups extracted in this session."),
    ("Groups Counter", "Number of unique groups processed."),
    ("Dupes Skipped Counter", "Number of contacts that were already in the data and not re-added."),
    ("Download Excel", "Exports a .xlsx with one 'All Contacts' sheet plus individual sheets per group."),
    ("Clear Data", "Wipes all stored contacts and resets all counters. Requires confirmation."),
    ("Persistent Storage", "Data is stored in Chrome's local extension storage — it survives browser restarts until you click Clear Data or uninstall the extension."),
]
feat_rows = [[Paragraph(f[0], PS(f"fn{i}", fontSize=9.5, fontName="Helvetica-Bold", textColor=GREEN)),
              Paragraph(f[1], body_s)] for i, f in enumerate(features)]
feat_t = Table(feat_rows, colWidths=[BODY_W*0.30, BODY_W*0.70])
feat_t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,-1), SLATE_LT),
    ("TOPPADDING",    (0,0), (-1,-1), 6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
    ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ("LINEBELOW",     (0,0), (-1,-2), 0.3, BORDER),
    ("BOX",           (0,0), (-1,-1), 0.5, BORDER),
]))
story.append(feat_t)
story.append(Spacer(1, 16))

# ── SECTION 6: TROUBLESHOOTING ────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("6. Troubleshooting", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=10))

issues = [
    ("Extension shows 'Open WhatsApp Web'",
     "The active browser tab is not web.whatsapp.com. Switch to the tab where WhatsApp Web is open, then click the extension icon again.",
     "ok"),
    ("No contacts found after extraction",
     "WhatsApp Web may have updated its UI selectors. The extension uses multiple fallback selectors, but a major WhatsApp update can break extraction. "
     "Try: (1) Reload the WhatsApp Web tab, (2) Reopen the popup and toggle OFF then ON, (3) Manually open the group info panel before switching groups.",
     "warn"),
    ("'Could not open group info panel' error",
     "WhatsApp Web did not open the info drawer automatically. Try clicking the group header manually once, then let the extension detect it.",
     "warn"),
    ("Download button produces a CSV instead of .xlsx",
     "This happens if the download was triggered from the background script (fallback mode). To get Excel format, make sure you are on the WhatsApp Web tab when clicking Download.",
     "ok"),
    ("Extension icon is not visible in toolbar",
     "Click the puzzle piece icon (🧩) in Chrome's toolbar and pin the WA Extractor extension.",
     "ok"),
    ("Extension disappeared from Chrome",
     "Chrome may have disabled it after a crash. Go to chrome://extensions and re-enable it, or click Load unpacked again.",
     "warn"),
    ("Partial member list extracted",
     "Some groups have many members that require more scroll time. The extension scrolls 30 times × 300ms. For very large groups (500+ members), this may not capture everyone. Large groups may also restrict member visibility.",
     "warn"),
]
for prob, sol, kind in issues:
    color = HexColor("#1A4731") if kind == "ok" else HexColor("#744210")
    bg    = GREEN_BG if kind == "ok" else AMBER_BG
    icon  = "✅" if kind == "ok" else "⚠"
    box_data = [[
        Paragraph(f"{icon} <b>{prob}</b><br/><br/>{sol}",
                  PS(f"ts{prob[:4]}", fontSize=9, leading=14, textColor=color, alignment=TA_JUSTIFY))
    ]]
    box_t = Table(box_data, colWidths=[BODY_W])
    box_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), bg),
        ("TOPPADDING",    (0,0), (-1,-1), 9), ("BOTTOMPADDING",(0,0),(-1,-1),9),
        ("LEFTPADDING",   (0,0), (-1,-1), 12), ("RIGHTPADDING",(0,0),(-1,-1),12),
        ("BOX",           (0,0), (-1,-1), 0.5, BORDER),
        ("LINEBEFORE",    (0,0), (0,-1),  4, HexColor("#25D366") if kind=="ok" else HexColor("#D69E2E")),
    ]))
    story.append(box_t)
    story.append(Spacer(1, 6))

story.append(Spacer(1, 14))

# ── SECTION 7: IMPORTANT NOTES ────────────────────────────────────────────────
story.append(Paragraph("7. Important Notes &amp; Limitations", h2_s))
story.append(HRFlowable(width=BODY_W, thickness=1.5, color=GREEN, spaceAfter=8))

notes = [
    "This extension operates entirely locally in your browser. No data is sent to any external server.",
    "You must be a member of a group to see its member list. WhatsApp only shows numbers/names based on your contact list and group privacy settings.",
    "If a member's number is not in your contacts, WhatsApp may only show their number (not name) — the extension captures whatever WhatsApp displays.",
    "Group admins can restrict member visibility — in such groups, only admin-visible members will be extracted.",
    "WhatsApp Web's HTML structure can change without notice. If extraction stops working after a WhatsApp update, the extension may need selector updates.",
    "The extension requires Developer Mode in Chrome. This is normal for self-installed extensions and does not pose a security risk for extensions you build yourself.",
    "Data is stored in Chrome's extension local storage (not synced across devices). Clearing Chrome's extension data will erase stored contacts.",
    "Always ensure you have the right to collect and store contact information. Use this tool responsibly and in compliance with applicable privacy laws.",
]
for n in notes:
    story.append(Paragraph(f"<bullet>&bull;</bullet> {n}", bullet_s))

story.append(Spacer(1, 14))

# Footer
story.append(HRFlowable(width=BODY_W, thickness=0.5, color=BORDER, spaceAfter=6))
story.append(Paragraph(
    "WhatsApp Group Extractor v1.0  |  Chrome Extension  |  Self-Hosted / Developer Use",
    footer_s
))

doc.build(story)
print("Documentation PDF created.")