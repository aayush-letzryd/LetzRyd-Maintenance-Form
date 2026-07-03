/* ═══════════════════════════════════════════════════════════
   LetzRyd Partner Maintenance Portal — script.js
   Full Production Framework: SurveyJS + Dual-Tab Registry + API
   Uncompromised Standard for LetzRyd Fleet Maintenance Operations
═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// SurveyJS Form Definition (Strict Mapping to Maintenance Schema)
// ─────────────────────────────────────────────────────────
const surveyJson = {
    showQuestionNumbers: "off",
    widthMode: "responsive",
    checkErrorsMode: "onValueChanged",

    completedHtml: `
        <div style="text-align:center;padding:48px 24px;">
            <svg style="width:64px;height:64px;color:#1ab394;margin:0 auto 20px;display:block;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h2 style="font-size:22px;font-weight:700;color:#0a1650;margin-bottom:8px;font-family:'Poppins',sans-serif;">Maintenance Job Recorded Successfully</h2>
            <p style="color:#64748b;font-size:14px;margin-bottom:28px;font-family:'DM Sans',sans-serif;">The vehicle intake, workshop estimates, job lifecycle, and PDI have been securely logged.</p>
            <div style="display:flex; justify-content:center; gap: 12px;">
                <button onclick="showTab('registry')" style="background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
                    View Registry
                </button>
                <button onclick="startNewMaintenance()" style="background:#1ab394;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 6px rgba(26,179,148,0.2);">
                    + Log New Job
                </button>
            </div>
        </div>
    `,
    elements: [
        // PANEL 1: VEHICLE INTAKE & DIAGNOSTICS
        {
            type: "panel",
            name: "vehicle_intake_panel",
            title: "1. VEHICLE INTAKE & DIAGNOSTICS",
            width: "48%",
            elements: [
                { type: "text", name: "vehicle_number", title: "🔢 VEHICLE NUMBER", placeholder: "e.g., TS09 EA 1111...", isRequired: true, maxLength: 20 },
                { type: "dropdown", name: "city_name", title: "🏙️ CITY", placeholder: "Select city...", isRequired: true, choicesByUrl: { url: "/api/cities", valueName: "value", titleName: "text" } },
                { type: "text", name: "model", title: "🚘 VEHICLE MODEL", placeholder: "e.g., Tata Tigor EV...", isRequired: true },
                { type: "text", name: "vehicle_k_m_s", title: "⏱️ VEHICLE KMs (ODOMETER)", inputType: "number", isRequired: true, min: 0 },
                { type: "radiogroup", name: "repair_type", title: "🔧 REPAIR TYPE", choices: ["General Service", "Running Repair", "Accidental", "Breakdown", "Warranty"], colCount: 2, isRequired: true },
                { type: "text", name: "vehicle_location", title: "📍 VEHICLE LOCATION", placeholder: "Current location/breakdown spot..." },
                { type: "text", name: "vehicle_in_date", title: "📥 VEHICLE IN DATE & TIME", inputType: "datetime-local", isRequired: true },
                { type: "comment", name: "initial_remarks", title: "📝 INITIAL REMARKS (SYMPTOMS)", placeholder: "Describe driver complaints or visible issues...", rows: 2 },
                { type: "file", name: "vehicle_damage_photos", title: "📸 INWARD VEHICLE PHOTOS", allowCameraAccess: true, capture: "environment", storeDataAsText: true, maxSize: 5242880 }
            ]
        },
        // NEW: GENERAL INSPECTIONS (Multiple records allowed)
        {
            type: "paneldynamic",
            name: "general_inspections",
            title: "GENERAL INSPECTION LOGS",
            description: "Log any vehicle inspections carried out OUTSIDE of the pre-delivery process.",
            panelAddText: "+ Add Inspection Record",
            panelRemoveText: "Remove Record",
            width: "48%",
            startWithNewLine: false,
            templateElements: [
                { type: "text", name: "insp_date", title: "📅 DATE", inputType: "date" },
                { type: "comment", name: "insp_remarks", title: "📋 REMARKS", rows: 2 },
                { type: "file", name: "insp_photo", title: "📸 INSPECTION PHOTO", storeDataAsText: true, allowCameraAccess: true }
            ]
        },
        // PANEL 2: WORKSHOP ALLOCATION & ESTIMATIONS
        {
            type: "panel",
            name: "workshop_allocation_panel",
            title: "2. WORKSHOP ALLOCATION & ESTIMATES",
            width: "48%",
            elements: [
                { type: "text", name: "workshop_name", title: "🏢 WORKSHOP NAME", placeholder: "Enter Authorized Workshop...", isRequired: true },
                { type: "text", name: "allocation_date", title: "📅 ALLOCATION DATE", inputType: "date" },
                { type: "text", name: "estimated_delivery_date", title: "⏳ ESTIMATED DELIVERY DATE", inputType: "date" },
                { type: "text", name: "estimated_amount", title: "💸 ESTIMATED AMOUNT (₹)", inputType: "number", placeholder: "0", min: 0 },
                { type: "radiogroup", name: "insurance_claimed", title: "🛡️ INSURANCE CLAIMED?", choices: ["Yes", "No"], colCount: 2, isRequired: true },
                { type: "text", name: "claim_number", title: "📜 CLAIM NUMBER", placeholder: "Enter claim ID...", visibleIf: "{insurance_claimed} = 'Yes'" },
                { type: "text", name: "insurance_brokerage", title: "🏦 INSURANCE BROKERAGE", placeholder: "Broker name...", visibleIf: "{insurance_claimed} = 'Yes'" },
                { type: "text", name: "approved_by", title: "👤 APPROVED BY", placeholder: "Manager name..." },
                { type: "text", name: "approval_date", title: "✅ APPROVAL DATE", inputType: "date" },
                { type: "file", name: "approval_file", title: "📄 UPLOAD ESTIMATE/APPROVAL FILE", allowCameraAccess: true, capture: "environment", storeDataAsText: true, maxSize: 5242880 }
            ]
        },
        // PANEL 3: JOB LIFECYCLE (Now with multiple jobs functionality)
        {
            type: "panel",
            name: "job_lifecycle_panel",
            title: "3. JOB LIFECYCLE & STATUS TRACKING",
            width: "48%",
            startWithNewLine: false,
            elements: [
                { type: "radiogroup", name: "maintenance_status", title: "🔄 CURRENT JOB STATUS", choices: ["Inward", "Estimation", "Approval", "Repairing", "QC", "Ready", "Delivered", "Hold"], colCount: 2, isRequired: true },
                { type: "text", name: "vehicle_status_date", title: "📅 STATUS UPDATE DATE", inputType: "date" },
                { type: "text", name: "rfd_date", title: "🚀 RFD DATE (READY FOR DELIVERY)", inputType: "date" },
                { type: "text", name: "delivered_date", title: "🏁 DELIVERED DATE", inputType: "date" },
                { type: "radiogroup", name: "final_status", title: "🏁 FINAL STATUS", choices: ["Completed", "Total Loss", "Scrapped"], colCount: 3 },
                { type: "text", name: "tat", title: "⏱️ TAT (DAYS)", inputType: "number" },
                { type: "radiogroup", name: "pdi_status", title: "🟢 PDI STATUS (POST DELIVERY INSPECTION)", choices: ["Completed", "Pending"], colCount: 2, isRequired: true },
                // NEW: DYNAMIC JOB UPDATES
                {
                    type: "paneldynamic",
                    name: "job_updates",
                    title: "DAILY JOB UPDATES",
                    description: "Add details at every stage (Job 1, Job 2, etc.)",
                    panelAddText: "+ Add Job Update",
                    panelRemoveText: "Remove Update",
                    templateElements: [
                        { type: "text", name: "update_date", title: "📅 DATE", inputType: "date" },
                        { type: "comment", name: "update_remarks", title: "📋 STAGE REMARKS", rows: 2 },
                        { type: "file", name: "update_photo", title: "📸 STAGE PHOTO", storeDataAsText: true, allowCameraAccess: true }
                    ]
                }
            ]
        },
        // PANEL 4: INVOICING
        {
            type: "panel",
            name: "invoicing_panel",
            title: "4. INVOICING & FINANCIAL SETTLEMENT",
            width: "48%",
            elements: [
                { type: "text", name: "insurance_liability_discounts", title: "📉 INSURANCE LIABILITY / DISCOUNTS (₹)", inputType: "number", placeholder: "0", min: 0 },
                { type: "text", name: "letzryd_payable", title: "💳 LETZRYD PAYABLE (₹)", inputType: "number", placeholder: "0", min: 0 },
                { type: "radiogroup", name: "payment_status", title: "🚥 PAYMENT STATUS", choices: ["Pending", "Partial", "Paid"], colCount: 3 },
                { type: "radiogroup", name: "type_of_payment", title: "💵 TYPE OF PAYMENT", choices: ["UPI", "NEFT/RTGS", "Credit/Ledger", "Cash"], colCount: 2 },
                { type: "text", name: "utr_no", title: "🏦 UTR / TRANSACTION NO.", placeholder: "Bank reference id..." },
                { type: "comment", name: "entry_remarks", title: "📝 FINANCIAL/ENTRY REMARKS", placeholder: "Closing notes for the ledger...", rows: 2 },
                // NEW: MULTIPLE INVOICES
                {
                    type: "paneldynamic",
                    name: "maintenance_invoices",
                    title: "INVOICE RECORDS",
                    description: "Add all invoices associated with this job.",
                    panelAddText: "+ Add Invoice",
                    panelRemoveText: "Remove Invoice",
                    templateElements: [
                        { type: "text", name: "inv_no", title: "🧾 INVOICE #" },
                        { type: "text", name: "inv_date", title: "📅 INVOICE DATE", inputType: "date" },
                        { type: "text", name: "inv_amount", title: "💰 AMOUNT", inputType: "number" },
                        { type: "file", name: "inv_file", title: "📄 UPLOAD FILE", storeDataAsText: true, allowCameraAccess: true }
                    ]
                }
            ]
        },
        // PANEL 5: POST-DELIVERY INSPECTION (PDI)
        {
            type: "panel",
            name: "pdi_panel",
            title: "5. POST-DELIVERY INSPECTION (PDI) & INVENTORY",
            description: "Mandatory visual and inventory verification during the delivery of the vehicle.",
            width: "48%",
            startWithNewLine: false,
            visibleIf: "{pdi_status} = 'Pending'",
            elements: [
                {
                    type: "panel",
                    name: "pdi_photos",
                    title: "A. EXTERIOR & ENGINE VISUALS",
                    elements: [
                        { type: "file", name: "pdi_front_photo", title: "📸 FRONT", storeDataAsText: true, allowCameraAccess: true },
                        { type: "file", name: "pdi_back_photo", title: "📸 BACK", storeDataAsText: true, allowCameraAccess: true },
                        { type: "file", name: "pdi_lh_photo", title: "📸 LH SIDE", storeDataAsText: true, allowCameraAccess: true },
                        { type: "file", name: "pdi_rh_photo", title: "📸 RH SIDE", storeDataAsText: true, allowCameraAccess: true },
                        { type: "file", name: "pdi_engine_photo", title: "📸 ENGINE COMPARTMENT", storeDataAsText: true, allowCameraAccess: true }
                    ]
                },
                {
                    type: "panel",
                    name: "pdi_identifiers",
                    title: "B. CRITICAL IDENTIFIERS",
                    startWithNewLine: false,
                    elements: [
                        { type: "text", name: "engine_chassis_no", title: "🔢 ENGINE & CHASSIS NO." },
                        { type: "text", name: "battery_sl_no", title: "🔋 BATTERY SL NO. (ANTI-SWAP)" },
                        { type: "text", name: "fast_tag", title: "🏷️ FAST TAG (INSIDE)" }
                    ]
                },
                {
                    type: "panel",
                    name: "pdi_toolkit",
                    title: "C. TOOLKIT & ACCESSORIES",
                    elements: [
                        { type: "radiogroup", name: "pdi_jack", title: " JACK", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_jack_rod", title: " JACK ROD", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_spanner", title: " SPANNER", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_parking_triangle", title: " PARKING TRIANGLE", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_fire_extinguisher", title: " FIRE EXTINGUISHER", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_seat_cover", title: " SEAT COVER", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_floor_carpet", title: " FLOOR CARPET", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_music_system", title: " MUSIC SYSTEM", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "radiogroup", name: "pdi_spare_wheel", title: " SPARE WHEEL (STEPNEY)", choices: ["Intact", "Missing", "Damaged"], colCount: 3 },
                        { type: "text", name: "pdi_key_quantity", title: "🔑 KEY QUANTITY", inputType: "number", min: 0 }
                    ]
                },
                {
                    type: "panel",
                    name: "pdi_tyres",
                    title: "D. TYRE CONDITIONS",
                    startWithNewLine: false,
                    elements: [
                        { type: "dropdown", name: "pdi_rh_front_tyre", title: "🛞 RH FRONT TYRE", choices: ["Good", "Worn", "Replaced"] },
                        { type: "dropdown", name: "pdi_lh_front_tyre", title: "🛞 LH FRONT TYRE", choices: ["Good", "Worn", "Replaced"] },
                        { type: "dropdown", name: "pdi_rh_rear_tyre", title: "🛞 RH REAR TYRE", choices: ["Good", "Worn", "Replaced"] },
                        { type: "dropdown", name: "pdi_lh_rear_tyre", title: "🛞 LH REAR TYRE", choices: ["Good", "Worn", "Replaced"] }
                    ]
                }
            ]
        }
    ]
};

// ─────────────────────────────────────────────────────────
// Global SurveyJS State & Initialization
// ─────────────────────────────────────────────────────────
const survey = new Survey.Model(surveyJson);
let maintenanceRecordId = null; 

$(function () { 
    $("#surveyElement").Survey({ model: survey }); 
    loadRegistryData(); // Load real data into the table on page load
});

// ─────────────────────────────────────────────────────────
// Dual-Tab Dashboard Framework
// ─────────────────────────────────────────────────────────
window.showTab = function(tab) {
    var formTab = document.getElementById("tab-form");
    var registryTab = document.getElementById("tab-registry");
    var navForm = document.getElementById("nav-form");
    var navRegistry = document.getElementById("nav-registry");

    if (tab === 'form') {
        if(formTab) formTab.style.display = 'block';
        if(registryTab) registryTab.style.display = 'none';
        if(navForm) navForm.classList.add('lr-tab--active');
        if(navRegistry) navRegistry.classList.remove('lr-tab--active');
    } else if (tab === 'registry') {
        if(formTab) formTab.style.display = 'none';
        if(registryTab) registryTab.style.display = 'block';
        if(navForm) navForm.classList.remove('lr-tab--active');
        if(navRegistry) navRegistry.classList.add('lr-tab--active');
        loadRegistryData(); // Refresh data whenever registry tab is opened
    }
};

function updateClock() {
    var el = document.getElementById("liveClock");
    if (el) {
        el.textContent = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
    }
}
setInterval(updateClock, 1000);
updateClock();

// ─────────────────────────────────────────────────────────
// Live Registry Table Fetch & Population
// ─────────────────────────────────────────────────────────
function loadRegistryData() {
    fetch("/api/maintenance")
        .then(function(res) {
            if (!res.ok) throw new Error("Failed to fetch registry data");
            return res.json();
        })
        .then(function(data) {
            var tbody = document.getElementById("registryTableBody");
            if (!tbody) return;

            // FIX: If the database is empty, DO NOT clear the table. 
            // This leaves your 5 hardcoded sample records visible for the presentation!
            if (data.length === 0) {
                return; 
            }

            // If there IS real data in the database, clear the samples and show real data
            tbody.innerHTML = ""; 

            data.forEach(function(item) {
                var statusClass = "lr-status-green";
                if(item.maintenance_status === "Inward" || item.maintenance_status === "Estimation" || item.maintenance_status === "Approval") statusClass = "lr-status-yellow";
                if(item.maintenance_status === "Hold" || item.maintenance_status === "Repairing") statusClass = "lr-status-red";

                var tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="font-bold text-gray-900">#${item.id}</td>
                    <td><div class="text-gray-900 font-bold">${item.vehicle_in_date || '-'}</div></td>
                    <td><div class="text-brand-blue font-bold">${item.vehicle_number || '-'}</div><div class="text-xs text-gray-500">Workshop: ${item.workshop_name || '-'}</div></td>
                    <td><div class="text-gray-900">${item.repair_type || '-'}</div><div class="text-xs text-gray-500">${item.city_name || '-'}</div></td>
                    <td><div class="text-red font-bold">₹ ${item.estimated_amount || '0'}</div><div class="text-xs text-gray-500">Estimate</div></td>
                    <td><span class="lr-status ${statusClass}">${item.maintenance_status || '-'}</span></td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(function(err) {
            console.error("Registry Load Error:", err);
        });
}
// ─────────────────────────────────────────────────────────
// CSV Export Functionality
// ─────────────────────────────────────────────────────────
window.exportTableToCSV = function() {
    var csv = [];
    var rows = document.querySelectorAll("#registryTableBody tr");
    
    if (rows.length === 0 || (rows.length === 1 && rows[0].innerText.includes("No maintenance jobs"))) {
        alert("No data to export!");
        return;
    }

    csv.push("Job ID,Vehicle IN Date,Vehicle & Workshop,Repair Type & City,Estimated Cost,Lifecycle Status");

    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll("td");
        for (var j = 0; j < cols.length; j++) {
            var text = cols[j].innerText.replace(/,/g, "").replace(/\n/g, " ");
            row.push(text);
        }
        csv.push(row.join(","));
    }

    var csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
    var downloadLink = document.createElement("a");
    downloadLink.download = "Maintenance_Registry_Export.csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
};

// ─────────────────────────────────────────────────────────
// Form Management & Record Retrieval
// ─────────────────────────────────────────────────────────
window.startNewMaintenance = function() {
    maintenanceRecordId = null;
    survey.clear(true, true);
    updateFormBanner(false, null);
    showTab('form');
    scrollToForm();
};

function scrollToForm() {
    var el = document.getElementById("surveyElement");
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
}

function updateFormBanner(editing, identifier) {
    var el = document.querySelector(".lr-fch-desc");
    if (el) {
        el.textContent = editing 
            ? ("Editing existing Maintenance Job: " + identifier) 
            : "Log vehicle inwards, workshop allocations, job lifecycles, PDI, and final invoices.";
    }
}

window.retrieveMaintenanceRecord = function() {
    var idInput = document.getElementById("maintenanceIdInput");
    if (!idInput || !idInput.value.trim()) { alert("Please enter a valid Job ID."); return; }
    
    var recordId = parseInt(idInput.value.trim(), 10);
    if (isNaN(recordId)) { alert("Job ID must be a valid number."); return; }
    loadMaintenanceIntoForm(recordId);
};

// ─────────────────────────────────────────────────────────
// Backend Communication API Framework
// ─────────────────────────────────────────────────────────
function loadMaintenanceIntoForm(id) {
    fetch("/api/maintenance/" + id)
        .then(function (r) {
            if (!r.ok) {
                if(r.status === 404) throw new Error("Maintenance Record not found.");
                throw new Error("Server error occurred.");
            }
            return r.json();
        })
        .then(function (data) {
            maintenanceRecordId = data.id; 
            survey.data = data;
            updateFormBanner(true, "#" + maintenanceRecordId);
            showTab("form");
            scrollToForm();
        })
        .catch(function (err) {
            alert("Record search failed: " + err.message);
            maintenanceRecordId = null;
            updateFormBanner(false, null);
        });
}

function extractImage(val) {
    if (!val) return null;
    if (Array.isArray(val) && val.length > 0) {
        var first = val[0];
        return (typeof first === "object" && first.content) ? first.content : String(first);
    }
    if (typeof val === "string" && val.startsWith("data:")) return val;
    return null;
}

// ─────────────────────────────────────────────────────────
// Submit Handler (API POST/PUT Payload Builder)
// ─────────────────────────────────────────────────────────
survey.onComplete.add(function (sender) {
    var payload = JSON.parse(JSON.stringify(sender.data)); 
    
    function extractBase64(val) {
        if (!val) return null;
        if (Array.isArray(val) && val.length > 0) {
            return (typeof val[0] === "object" && val[0].content) ? val[0].content : String(val[0]);
        }
        if (typeof val === "string" && val.startsWith("data:")) return val;
        return null;
    }

    // Safely extract static file fields
    const staticPhotoFields = [
        "vehicle_damage_photos", "approval_file", "pdi_front_photo", 
        "pdi_back_photo", "pdi_lh_photo", "pdi_rh_photo", "pdi_engine_photo"
    ];
    staticPhotoFields.forEach(field => {
        if(payload[field]) payload[field] = extractBase64(payload[field]);
    });

    // Safely extract dynamic panel file fields
    if (payload.general_inspections) {
        payload.general_inspections.forEach(item => { if (item.insp_photo) item.insp_photo = extractBase64(item.insp_photo); });
    }
    if (payload.job_updates) {
        payload.job_updates.forEach(item => { if (item.update_photo) item.update_photo = extractBase64(item.update_photo); });
    }
    if (payload.maintenance_invoices) {
        payload.maintenance_invoices.forEach(item => { if (item.inv_file) item.inv_file = extractBase64(item.inv_file); });
    }

    var url = maintenanceRecordId ? ("/api/maintenance/" + maintenanceRecordId) : "/api/maintenance";
    var method = maintenanceRecordId ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
        return r.json();
    })
    .then(function (result) {
        if (result.success) {
            maintenanceRecordId = null;
            updateFormBanner(false, null);
            loadRegistryData(); 
        } else {
            throw new Error("Server returned success=false.");
        }
    })
    .catch(function (err) {
        console.error("Submission Error Details:", err);
        alert("Failed to securely save maintenance record: " + err.message);
        survey.clear(true, true);
    });
});