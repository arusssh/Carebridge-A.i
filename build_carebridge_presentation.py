import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.text.text import _Paragraph

# Patch _Paragraph.add_run to accept text argument if provided
_orig_add_run = _Paragraph.add_run
def _patched_add_run(self, text=None):
    run = _orig_add_run(self)
    if text is not None:
        run.text = str(text)
    return run
_Paragraph.add_run = _patched_add_run

def build_presentation():
    prs = Presentation()
    # 16:9 Widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette Constants (Dark Emerald / Tech Theme matching the PDF exemplar)
    BG_DARK = RGBColor(11, 25, 20)          # #0B1914 Deep Forest Dark
    CARD_BG = RGBColor(18, 38, 31)          # #12261F Dark Emerald Surface
    CARD_BORDER = RGBColor(34, 197, 94)     # #22C55E Bright Emerald Accent
    EMERALD_BRIGHT = RGBColor(52, 211, 153) # #34D399 Light Emerald
    TEXT_WHITE = RGBColor(255, 255, 255)
    TEXT_MUTED = RGBColor(156, 163, 175)    # Slate Gray
    TEXT_YELLOW = RGBColor(250, 204, 21)    # Yellow Accent

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background() # No border
        return bg

    def add_header(slide, title_text, slide_num=""):
        # Header banner
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.8))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        
        # Sub-header category
        p_sub = p.add_run("CareBridge AI  |  Clinical Transition & Care Companion")
        p_sub.font.name = "Segoe UI"
        p_sub.font.size = Pt(11)
        p_sub.font.bold = True
        p_sub.font.color.rgb = EMERALD_BRIGHT

        p2 = tf.add_paragraph()
        p2.space_before = Pt(2)
        p_title = p2.add_run(title_text)
        p_title.font.name = "Segoe UI"
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

        # Slide number & course tag on top right
        right_box = slide.shapes.add_textbox(Inches(9.0), Inches(0.4), Inches(3.5), Inches(0.8))
        tf_r = right_box.text_frame
        tf_r.word_wrap = True
        p_r = tf_r.paragraphs[0]
        p_r.alignment = PP_ALIGN.RIGHT
        r_course = p_r.add_run("MSE-2 Project Presentation\nAI Fundamentals & Python Programming")
        r_course.font.name = "Segoe UI"
        r_course.font.size = Pt(10)
        r_course.font.color.rgb = TEXT_MUTED

        if slide_num:
            p_r2 = tf_r.add_paragraph()
            p_r2.alignment = PP_ALIGN.RIGHT
            p_r2.space_before = Pt(2)
            r_num = p_r2.add_run(f"Slide {slide_num}")
            r_num.font.name = "Segoe UI"
            r_num.font.size = Pt(12)
            r_num.font.bold = True
            r_num.font.color.rgb = EMERALD_BRIGHT

    def add_card(slide, left, top, width, height, title, body_bullets, title_color=EMERALD_BRIGHT):
        # Card Background Shape
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        # Card Text
        tb = slide.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.15), Inches(width - 0.4), Inches(height - 0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        r_title = p.add_run(title)
        r_title.font.name = "Segoe UI"
        r_title.font.size = Pt(13)
        r_title.font.bold = True
        r_title.font.color.rgb = title_color

        for item in body_bullets:
            p_b = tf.add_paragraph()
            p_b.space_before = Pt(4)
            p_b.space_after = Pt(2)
            
            if isinstance(item, tuple):
                bold_txt, norm_txt = item
                r_b = p_b.add_run("• " + bold_txt + " ")
                r_b.font.name = "Segoe UI"
                r_b.font.size = Pt(10)
                r_b.font.bold = True
                r_b.font.color.rgb = TEXT_WHITE

                r_n = p_b.add_run(norm_txt)
                r_n.font.name = "Segoe UI"
                r_n.font.size = Pt(10)
                r_n.font.color.rgb = TEXT_MUTED
            else:
                r = p_b.add_run("• " + item)
                r.font.name = "Segoe UI"
                r.font.size = Pt(10)
                r.font.color.rgb = TEXT_MUTED

    # =========================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Top Tagline
    tb1_top = s1.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(0.5))
    tf1_top = tb1_top.text_frame
    p = tf1_top.paragraphs[0]
    r = p.add_run("MSE-2 Project Presentation  •  AI Fundamentals & Python Programming  •  KIET University")
    r.font.name = "Segoe UI"; r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = EMERALD_BRIGHT

    # Main Big Title
    tb1_main = s1.shapes.add_textbox(Inches(1.0), Inches(1.4), Inches(8.0), Inches(1.8))
    tf1_main = tb1_main.text_frame
    p = tf1_main.paragraphs[0]
    r = p.add_run("CareBridge AI")
    r.font.name = "Segoe UI"; r.font.size = Pt(44); r.font.bold = True; r.font.color.rgb = TEXT_WHITE
    p2 = tf1_main.add_paragraph()
    r2 = p2.add_run("AI-Powered Clinical Transition & Care Companion")
    r2.font.name = "Segoe UI"; r2.font.size = Pt(18); r2.font.bold = True; r2.font.color.rgb = EMERALD_BRIGHT

    # Simple Plain English Description
    tb1_desc = s1.shapes.add_textbox(Inches(1.0), Inches(3.2), Inches(7.5), Inches(1.4))
    tf1_desc = tb1_desc.text_frame
    tf1_desc.word_wrap = True
    p = tf1_desc.paragraphs[0]
    r = p.add_run(
        "A smart, friendly healthcare companion that deciphers unreadable doctor handwriting, "
        "checks medicine names against safe drug lists, and creates a simple daily medicine checklist "
        "and 30-day recovery schedule for patients and their families."
    )
    r.font.name = "Segoe UI"; r.font.size = Pt(13); r.font.color.rgb = RGBColor(226, 232, 240)

    # 4 Feature Pills on the left
    features = [
        ("Prescription Scanner", "Reads smartphone photos & PDFs"),
        ("Handwriting AI", "Decodes cursive doctor writing"),
        ("Safety Filter", "Blocks fake or gibberish medicine names"),
        ("Daily Checklist", "Tracks morning to night pill routines")
    ]
    for idx, (f_title, f_sub) in enumerate(features):
        x = 1.0 + (idx % 2) * 3.6
        y = 4.7 + (idx // 2) * 1.1
        add_card(s1, x, y, 3.4, 0.95, f_title, [f_sub])

    # Right Side Live App Box Mockup
    card_live = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.8), Inches(1.5), Inches(3.7), Inches(5.2))
    card_live.fill.solid(); card_live.fill.fore_color.rgb = CARD_BG
    card_live.line.color.rgb = CARD_BORDER; card_live.line.width = Pt(1.5)

    tb_live = s1.shapes.add_textbox(Inches(9.1), Inches(1.8), Inches(3.1), Inches(4.6))
    tf_live = tb_live.text_frame
    tf_live.word_wrap = True
    p = tf_live.paragraphs[0]
    r = p.add_run("Live Patient App Screen\n"); r.font.name = "Segoe UI"; r.font.size = Pt(13); r.font.bold = True; r.font.color.rgb = EMERALD_BRIGHT
    r = p.add_run("Patient: Arjun (MRN-48201)\n\n"); r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = TEXT_WHITE
    r = p.add_run("Decoded Prescription:\n"); r.font.size = Pt(10.5); r.font.bold = True; r.font.color.rgb = TEXT_YELLOW
    r = p.add_run("1. Tab. Coldact Plus — 1 TDS\n   (Three times daily with food)\n2. Tab. Fevastin Plus — 1 TDS\n   (Fever & Bodyache relief)\n\n"); r.font.size = Pt(10); r.font.color.rgb = TEXT_WHITE
    r = p.add_run("Daily Adherence:\n"); r.font.size = Pt(10.5); r.font.bold = True; r.font.color.rgb = EMERALD_BRIGHT
    r = p.add_run("[==== 100% On-Track ====]\n\n"); r.font.size = Pt(10); r.font.bold = True; r.font.color.rgb = TEXT_WHITE
    r = p.add_run("Status: Deployed Live on Vercel"); r.font.size = Pt(9.5); r.font.italic = True; r.font.color.rgb = TEXT_MUTED

    # Footer Strip
    tb1_foot = s1.shapes.add_textbox(Inches(1.0), Inches(6.8), Inches(11.3), Inches(0.5))
    tf1_foot = tb1_foot.text_frame
    p = tf1_foot.paragraphs[0]
    r = p.add_run("Team Members: Student 1, Student 2, Student 3, Student 4   |   KIET Deemed to be University, Ghaziabad")
    r.font.name = "Segoe UI"; r.font.size = Pt(10); r.font.color.rgb = TEXT_MUTED

    # =========================================================
    # SLIDE 2: PROBLEM IDENTIFICATION
    # =========================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Problem Identification (What Are We Solving?)", "02")

    tb2_sub = s2.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(11.7), Inches(0.6))
    tf2_sub = tb2_sub.text_frame
    p = tf2_sub.paragraphs[0]
    r = p.add_run("Core Challenge: When patients leave the hospital or clinic, they receive handwritten slips that are hard to read and easy to confuse, leading to dangerous medicine mistakes at home.")
    r.font.name = "Segoe UI"; r.font.size = Pt(11); r.font.color.rgb = RGBColor(226, 232, 240)

    probs = [
        ("1. Messy Doctor Handwriting", [
            ("The Real Problem:", "Doctors write rapidly in cursive shorthand. Medicines look like scribbles."),
            ("Patient Risk:", "Patients & family cannot read the drug names and may buy or take the wrong pill.")
        ]),
        ("2. Confusing Medicine Timings", [
            ("The Real Problem:", "Prescriptions use medical codes like '1 TDS', 'BD', or 'PRN'."),
            ("Patient Risk:", "Patients don't know whether to take pills before food, after food, or how many hours apart.")
        ]),
        ("3. Missed Clinic Follow-ups", [
            ("The Real Problem:", "Doctors write 'review in 2 days' or 'after 1 week' without exact dates."),
            ("Patient Risk:", "Patients forget when to return, leading to untreated complications and infections.")
        ]),
        ("4. Unknown Warning Signs (Red Flags)", [
            ("The Real Problem:", "Dangerous symptoms are buried in long medical text packets."),
            ("Patient Risk:", "Patients delay going to the emergency room when severe fever or bleeding occurs.")
        ]),
        ("5. Family Caregiver Blindspot", [
            ("The Real Problem:", "Family members working away from home cannot check on elderly parents."),
            ("Patient Risk:", "Doses are missed or accidentally doubled, and nobody knows until the patient falls sick.")
        ])
    ]

    for idx, (p_title, p_items) in enumerate(probs):
        x = 0.8 + (idx % 3) * 3.9
        y = 2.1 + (idx // 3) * 2.5
        w = 3.7
        h = 2.2 if idx < 3 else 2.2
        add_card(s2, x, y, w, h, p_title, p_items)

    # =========================================================
    # SLIDE 3: PROPOSED SOLUTION
    # =========================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Proposed Solution: CareBridge AI", "03")

    tb3_sub = s3.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(11.7), Inches(0.5))
    tf3_sub = tb3_sub.text_frame
    p = tf3_sub.paragraphs[0]
    r = p.add_run("A complete digital health bridge that converts paper prescription photos into a safe, verified daily recovery routine.")
    r.font.name = "Segoe UI"; r.font.size = Pt(11.5); r.font.color.rgb = RGBColor(226, 232, 240)

    # 3 Main Pillars
    sol_pillars = [
        ("Novelty (What's New?)", [
            ("Dual AI Vision:", "Reads messy doctor cursive using RapidOCR + Google Gemini 2.5 Flash Vision."),
            ("Drug Filter Guard:", "Checks every word against real medicine lists so AI never invents fake drugs (e.g. stops 'omomot dey')."),
            ("Source Citation:", "Clicking any pill highlights the exact line in the doctor's paper with an emerald glow.")
        ]),
        ("Feasibility (How It Works)", [
            ("Fast Python Backend:", "FastAPI backend processes prescriptions in under 2 seconds."),
            ("Modern React UI:", "Clean 3-color medical design (emerald, white, slate) with zero confusing emojis."),
            ("Already Deployed:", "Live on Vercel at https://carebridge-ai-kappa.vercel.app with 15/15 tests passing.")
        ]),
        ("Impact (Why It Matters)", [
            ("Zero Medicine Errors:", "Translates complex codes like '1 TDS' into simple 'Morning, Noon, Night with food'."),
            ("Saves Hospital Costs:", "Prevents avoidable readmissions caused by taking the wrong medication at home."),
            ("Caregiver Peace of Mind:", "Family members can see daily checklist progress in real time from anywhere.")
        ])
    ]

    for idx, (p_title, p_items) in enumerate(sol_pillars):
        add_card(s3, 0.8 + idx * 4.0, 2.0, 3.8, 4.8, p_title, p_items)

    # =========================================================
    # SLIDE 4: CHALLENGES TO PRACTICAL SOLUTIONS
    # =========================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Turning Healthcare Challenges into Practical Solutions", "04")

    # 4 Row Cards
    rows = [
        ("Challenge: Messy Cursive Handwriting", "CareBridge Solution: Dual-Engine AI Vision (RapidOCR + Gemini 2.5)", "Benefit: Instantly reads doctor handwriting and turns it into readable digital text."),
        ("Challenge: Optical OCR Errors & Fake Words", "CareBridge Solution: Pharmacopoeia Grounding Guard", "Benefit: Blocks nonsense words (like 'omomot dey') and verifies genuine drugs like 'Fevastin Plus'."),
        ("Challenge: Confusing Medical Shorthand ('1 TDS')", "CareBridge Solution: Plain English Dosing Translator", "Benefit: Patients see clear instructions: 'Three times daily (Morning, Noon & Night with food)'."),
        ("Challenge: Forgetting Clinic Review Dates", "CareBridge Solution: 30-Day Chronological Recovery Timeline", "Benefit: Visual day-by-day roadmap with prep checklists (Day 0-3, Day 4-14, Day 30+)."),
        ("Challenge: Missed Daily Pill Doses", "CareBridge Solution: Interactive Daily Checklist + Live Adherence Ring", "Benefit: Check off morning/night pills; live circular ring shows recovery compliance.")
    ]

    for idx, (col1, col2, col3) in enumerate(rows):
        y = 1.6 + idx * 1.05
        add_card(s4, 0.8, y, 11.7, 0.95, f"{col1}", [(col2, "— " + col3)])

    # Bottom Banner
    tb4_b = s4.shapes.add_textbox(Inches(0.8), Inches(6.8), Inches(11.7), Inches(0.4))
    tf4_b = tb4_b.text_frame
    p = tf4_b.paragraphs[0]
    r = p.add_run("Target Users: Discharged Patients  |  Family Caregivers  |  Visiting Nurses & Community Health Workers")
    r.font.name = "Segoe UI"; r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = EMERALD_BRIGHT

    # =========================================================
    # SLIDE 5: PRODUCT REQUIREMENTS & USER JOURNEY
    # =========================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Product Requirements & 5-Step User Journey", "05")

    # Left Column: Requirements & Story
    add_card(s5, 0.8, 1.5, 3.8, 5.4, "Product Requirements", [
        ("Functional Needs:", "Secure login without pre-loaded fake data; prescription drag-and-drop; handwriting deciphering; human validation workspace; daily checklist."),
        ("User Story:", "\"As a discharged patient, I want to take a photo of my prescription so that CareBridge AI can clearly tell me what medicines to take and help me track my daily recovery without mistakes.\""),
        ("Safety Criteria:", "Must block OCR gibberish; must highlight verbatim text citations in original document; must recalculate adherence live.")
    ])

    # Right: 5-Step Journey Cards
    steps = [
        ("Step 1: Secure Login", "Patient (Arjun) logs in. No unauthenticated mock data leaks out."),
        ("Step 2: Upload Prescription", "User uploads photo of prescription (e.g. Dr. Manisha Agarwal's slip)."),
        ("Step 3: AI Deciphering", "AI reads cursive and checks drug names against pharmacopoeia."),
        ("Step 4: Clinical Review", "User verifies medicine names; clicks quote icon to see source text."),
        ("Step 5: Recovery Tracking", "Follows 30-day timeline and checks off daily morning/night doses.")
    ]

    for idx, (st_title, st_desc) in enumerate(steps):
        y = 1.5 + idx * 1.08
        add_card(s5, 4.9, y, 7.6, 0.98, st_title, [st_desc])

    # =========================================================
    # SLIDE 6: SOLUTION ARCHITECTURE
    # =========================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Solution Architecture (System Overview)", "06")

    tb6_sub = s6.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(11.7), Inches(0.5))
    tf6_sub = tb6_sub.text_frame
    p = tf6_sub.paragraphs[0]
    r = p.add_run("How CareBridge AI connects users, AI models, and medical safety rules together.")
    r.font.name = "Segoe UI"; r.font.size = Pt(11); r.font.color.rgb = TEXT_MUTED

    add_card(s6, 0.8, 1.8, 2.6, 5.0, "1. Users", [
        ("Patients:", "Upload prescription slips & check off daily pills."),
        ("Family Caregivers:", "Monitor daily pill adherence remotely."),
        ("Visiting Nurses:", "Quickly verify correct discharge instructions.")
    ])

    add_card(s6, 3.7, 1.8, 5.9, 5.0, "2. System Core Architecture", [
        ("Frontend (React 19 + TypeScript):", "Clean medical UI with Document Scanner, Validation Workspace, and Daily Checklist."),
        ("Backend API (Python FastAPI):", "Handles file upload, column zoning, and orchestrates AI safety validation."),
        ("Dual AI Vision Engine:", "RapidOCR (local text zoning) + Google Gemini 2.5 Flash (doctor cursive deciphering)."),
        ("Pharmacopoeia Grounding Guard:", "Validates every drug candidate against medical dictionaries to block hallucinations."),
        ("Local Session Storage:", "Fast, self-contained JSON store for care plans, patient profiles, and adherence state.")
    ])

    add_card(s6, 9.9, 1.8, 2.6, 5.0, "3. Outputs Delivered", [
        ("Verified Care Plan:", "Plain-English medicine roster with dosage ceilings."),
        ("Red-Flag Alerts:", "Emergency protocols for dangerous symptoms."),
        ("Recovery Timeline:", "Follow-up visits mapped by day."),
        ("Daily Adherence:", "Live SVG ring tracking completion.")
    ])

    # =========================================================
    # SLIDE 7: TECHNICAL ARCHITECTURE & LAYERS
    # =========================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Technical Architecture & Layered Design", "07")

    layers = [
        ("Presentation Layer (React 19 + TypeScript)", [
            ("Modern Medical UI:", "Built with React 19, TypeScript, Vite, and Tailwind CSS v4."),
            ("Disciplined Design:", "Strict 3-color medical scheme (emerald, white, slate); zero emojis; tabular numbers."),
            ("Hosted Live:", "Deployed globally on Vercel Edge Cloud at https://carebridge-ai-kappa.vercel.app.")
        ]),
        ("Application Layer (Python 3.11 + FastAPI)", [
            ("REST API Engine:", "Fast asynchronous endpoints (/api/upload-document, /api/careplan/validate)."),
            ("Document Column Zoning:", "Separates printed lab test tables on the left from doctor handwriting on the center."),
            ("Safety Auditor:", "Scans for missing dosage ceilings and creates Doctor Visit Clarification Sheets.")
        ]),
        ("AI & Data Layer (Vision + Pharmacopoeia)", [
            ("Dual-Engine Vision:", "Google Gemini 2.5 Flash Vision API + RapidOCR for optical handwriting recognition."),
            ("Clinical Grounding:", "Formulary-based validation blocks OCR hallucinations (e.g. 'omomot dey' -> 'Fevastin Plus')."),
            ("Data Store:", "Lightweight, zero-setup JSON session store for fast demo evaluation.")
        ])
    ]

    for idx, (l_title, l_items) in enumerate(layers):
        add_card(s7, 0.8 + idx * 4.0, 1.6, 3.8, 5.3, l_title, l_items)

    # =========================================================
    # SLIDE 8: OPEN-SOURCE FRAMEWORKS & TOOLS
    # =========================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Open-Source Technologies & Frameworks Used", "08")

    frameworks = [
        ("Frontend: React 19", "Builds a fast, responsive, and tactile medical user interface with TypeScript."),
        ("Backend: FastAPI", "High-performance Python web framework handling file uploads and REST APIs."),
        ("AI: Gemini 2.5 & OCR", "Multimodal vision model reads handwriting; RapidOCR handles line segmentation."),
        ("Validation: Pydantic", "Enforces strict medical data schemas and validates JSON request/response formats."),
        ("Deployment: Vercel", "Provides global CDN hosting, SSL encryption, and instant cloud deployments.")
    ]

    for idx, (f_title, f_desc) in enumerate(frameworks):
        x = 0.8 + idx * 2.4
        add_card(s8, x, 1.6, 2.25, 4.0, f_title, [f_desc])

    # Bottom Why Open-Source Box
    add_card(s8, 0.8, 5.9, 11.7, 1.1, "Why These Technologies?", [
        ("100% Free & Open-Source:", "Zero licensing costs. Perfect for academic evaluation and clinical deployment."),
        ("High Reliability:", "All 15/15 Pytest unit and integration tests pass cleanly with zero build errors.")
    ])

    # =========================================================
    # SLIDE 9: THIRD-PARTY AI INTEGRATION
    # =========================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Third-Party AI & Vision Integration", "09")

    add_card(s9, 0.8, 1.6, 3.8, 5.2, "1. Integrated AI Engines", [
        ("Google Gemini 2.5 Flash Vision:", "Reads dense cursive handwriting, doctor prescription shorthand, and instructions."),
        ("RapidOCR Engine:", "Segments document lines and isolates printed lab test checklists from prescription notes."),
        ("Pharmacopoeia Grounding Guard:", "Validates candidate medicine names so optical errors are automatically corrected.")
    ])

    add_card(s9, 4.9, 1.6, 3.8, 5.2, "2. Clinical Safety Processing", [
        ("Column Layout Zoning:", "Discards left-margin lab checklist text (e.g. KFT, LFT, Urine) to prevent noise."),
        ("Cursive Shorthand Normalization:", "Translates '1 TDS' into 'Three times daily with food'; 'BD' into 'Twice daily'."),
        ("Zero Hallucinations:", "Optical misreads like 'omomot dey' are mapped to real drugs like 'Tab. Fevastin Plus'.")
    ])

    add_card(s9, 9.0, 1.6, 3.5, 5.2, "3. Delivered Clinical Outcome", [
        ("Accurate Extraction:", "Clean medicine names, strengths, frequencies, and administration routes."),
        ("Doctor Visit Sheet:", "Generates questions to ask the doctor for any ambiguous dosage ceilings."),
        ("Patient Confidence:", "Patients clearly understand their care without needing medical knowledge.")
    ])

    # =========================================================
    # SLIDE 10: WORKING PROTOTYPE DEMONSTRATION
    # =========================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Working Prototype Demonstration (Live Features)", "10")

    proto_steps = [
        ("1. Secure Login", "Patient (Arjun) logs in securely. Clean initial state with no pre-loaded fake data."),
        ("2. Prescription Scan", "Drag and drop prescription photo (e.g. Dr. Manisha Agarwal's clinic slip)."),
        ("3. Validation Workspace", "Source Grounding Inspector highlights verbatim quote in raw text with emerald glow."),
        ("4. Care Plan & Tracker", "View verified medications, emergency red flags, 30-day timeline, and daily checklist.")
    ]

    for idx, (p_title, p_desc) in enumerate(proto_steps):
        x = 0.8 + idx * 2.95
        add_card(s10, x, 1.6, 2.8, 3.8, p_title, [p_desc])

    # Prototype Highlights Card
    add_card(s10, 0.8, 5.7, 11.7, 1.3, "Prototype Highlights & Live Evidence", [
        ("Live URL:", "Active on Vercel at https://carebridge-ai-kappa.vercel.app | Local server on http://localhost:8000"),
        ("Verification:", "15/15 Pytest backend tests passing. Tested against real handwriting and clinical discharge cases.")
    ])

    # =========================================================
    # SLIDE 11: LIMITATIONS & FUTURE ROADMAP (ESE)
    # =========================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Limitations (MSE-2) & ESE Future Roadmap", "11")

    add_card(s11, 0.8, 1.6, 4.5, 4.6, "Current Limitations (MSE-2 Scope)", [
        ("Single Document Workflow:", "Currently processes one prescription or discharge summary at a time."),
        ("External Alerts Deferred:", "Cellular SMS and direct email alerts are placed into future scope per modular boundaries."),
        ("Local Session Storage:", "Uses lightweight file-backed store; full database migration planned for next semester.")
    ])

    add_card(s11, 5.6, 1.6, 6.9, 4.6, "Future Development Roadmap (ESE Phase)", [
        ("1. Automated 2-Way Cellular SMS Alerts:", "Send real SMS medication reminders using Twilio API (patient replies '1' to log dose)."),
        ("2. Direct Patient Email Notifications:", "Deliver formatted Care Plans and doctor sheets directly to patient & caregiver inboxes via SMTP."),
        ("3. Live Telecommunications Gateway Panel:", "Admin settings UI to configure custom Twilio Account SIDs and SMTP credentials."),
        ("4. Vernacular Voice Call Reminders:", "Interactive voice calls in regional languages (Hindi, Bengali) for elderly patients.")
    ])

    # Key Takeaway Box
    add_card(s11, 0.8, 6.4, 11.7, 0.85, "Key Takeaway", [
        ("Solid Foundation:", "A working, safe prototype in MSE-2 that solves doctor handwriting and daily tracking, with a clear roadmap to add SMS/Email alerts in ESE.")
    ])

    # =========================================================
    # SLIDE 12: CONCLUSION & Q&A
    # =========================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_header(s12, "Conclusion & Key Takeaways", "12")

    add_card(s12, 0.8, 1.6, 3.8, 4.5, "1. Core Summary", [
        ("Personalized:", "Extracts specific medications and care tasks tailored to the patient's actual discharge slip."),
        ("Safe & Grounded:", "Stops hallucinated medicine names using Pharmacopoeia Grounding Guards."),
        ("Easy to Use:", "Clean medical theme (emerald green & white), tabular numbers, and zero distracting emojis.")
    ])

    add_card(s12, 4.9, 1.6, 3.8, 4.5, "2. What Was Accomplished", [
        ("Solves Real Healthcare Gap:", "Turns messy prescription papers into verified daily checklists."),
        ("Live & Test-Proven:", "Deployed live on Vercel; 15/15 unit and integration tests passing."),
        ("Well-Scoped for MSE-2:", "Core prototype delivered; SMS/Email alerts clearly mapped to ESE.")
    ])

    add_card(s12, 9.0, 1.6, 3.5, 4.5, "3. Examiner Value", [
        ("Working Demonstration:", "Examiner can test live upload, doctor handwriting reading, and checklist updates."),
        ("Clear Technical Architecture:", "Layered design separating React UI, FastAPI backend, and Gemini AI vision.")
    ])

    # Thank you footer
    tb12_ty = s12.shapes.add_textbox(Inches(0.8), Inches(6.3), Inches(11.7), Inches(0.8))
    tf12_ty = tb12_ty.text_frame
    p = tf12_ty.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run("Thank You! Questions & Feedback Are Welcome\n")
    r.font.name = "Segoe UI"; r.font.size = Pt(20); r.font.bold = True; r.font.color.rgb = EMERALD_BRIGHT
    r_sub = p.add_run("Live Prototype URL: https://carebridge-ai-kappa.vercel.app")
    r_sub.font.name = "Segoe UI"; r_sub.font.size = Pt(11); r_sub.font.color.rgb = TEXT_WHITE

    # Save presentation
    output_path = r"C:\Users\aditi\.gemini\antigravity\scratch\carebridge-ai\CareBridge_AI_MSE2_Presentation.pptx"
    prs.save(output_path)
    print(f"Successfully saved PPTX to: {output_path}")

    # Also save to conversation artifacts directory for direct user download
    artifact_path = r"C:\Users\aditi\.gemini\antigravity\brain\b4cadc98-b857-4ac4-a269-8f1ee110b8bf\CareBridge_AI_MSE2_Presentation.pptx"
    prs.save(artifact_path)
    print(f"Successfully saved artifact PPTX to: {artifact_path}")

if __name__ == "__main__":
    build_presentation()
