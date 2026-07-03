import os
import json
import psycopg2
from psycopg2 import pool
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LetzRyd Fleet Maintenance API - Workshop Portal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────
# Connection Pool
# ─────────────────────────────────────────────────────────
try:
    postgreSQL_pool = psycopg2.pool.SimpleConnectionPool(
        1, 20,
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASS", r"8S5]U3@L^Xz)\FH}"),
        host=os.environ.get("DB_HOST", "35.200.196.113"),
        port=os.environ.get("DB_PORT", "5432"),
        database=os.environ.get("DB_NAME", "postgres")
    )
    if postgreSQL_pool:
        print("[OK] Connection pool created successfully")
except (Exception, psycopg2.DatabaseError) as error:
    print("[ERROR] Error connecting to PostgreSQL:", error)

# ─────────────────────────────────────────────────────────
# Startup — Tables + Seed Data
# ─────────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    conn = postgreSQL_pool.getconn()
    try:
        cur = conn.cursor()
        
        # ── cities ──────────────────────────────────────
        cur.execute("CREATE TABLE IF NOT EXISTS cities (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE);")
        cur.execute("SELECT COUNT(*) FROM cities;")
        if cur.fetchone()[0] == 0:
            cur.execute("INSERT INTO cities (name) VALUES ('Hyderabad'), ('Bangalore'), ('Mumbai'), ('Chennai'), ('Delhi') ON CONFLICT (name) DO NOTHING;")
            print("[OK] Cities seeded")

        # ── maintenance_registry ───────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS maintenance_registry (
                id SERIAL PRIMARY KEY,
                
                -- Panel 1: Vehicle Intake & Diagnostics
                vehicle_number VARCHAR(100),
                city_name VARCHAR(100),
                model VARCHAR(100),
                vehicle_k_m_s VARCHAR(50),
                repair_type VARCHAR(100),
                vehicle_location TEXT,
                vehicle_in_date VARCHAR(50),
                initial_remarks TEXT,
                vehicle_damage_photos TEXT,
                general_inspections TEXT,
                
                -- Panel 2: Workshop Allocation & Estimates
                workshop_name VARCHAR(255),
                allocation_date VARCHAR(50),
                estimated_delivery_date VARCHAR(50),
                estimated_amount VARCHAR(50),
                insurance_claimed VARCHAR(50),
                claim_number VARCHAR(100),
                insurance_brokerage VARCHAR(255),
                approved_by VARCHAR(100),
                approval_date VARCHAR(50),
                approval_file TEXT,
                
                -- Panel 3: Job Lifecycle & Status Tracking
                maintenance_status VARCHAR(100),
                vehicle_status_date VARCHAR(50),
                daily_vehicle_remarks TEXT,
                rfd_date VARCHAR(50),
                delivered_date VARCHAR(50),
                final_status VARCHAR(50),
                tat VARCHAR(50),
                pdi_status VARCHAR(50),
                job_updates TEXT,
                
                -- Panel 4: Invoicing & Financial Settlement
                invoice_no VARCHAR(100),
                invoice_date VARCHAR(50),
                invoice_amount VARCHAR(50),
                insurance_liability_discounts VARCHAR(50),
                letzryd_payable VARCHAR(50),
                payment_status VARCHAR(50),
                type_of_payment VARCHAR(50),
                utr_no VARCHAR(100),
                entry_remarks TEXT,
                invoice_file TEXT,
                maintenance_invoices TEXT,
                
                -- Panel 5: Post-Delivery Inspection (PDI)
                pdi_front_photo TEXT,
                pdi_back_photo TEXT,
                pdi_lh_photo TEXT,
                pdi_rh_photo TEXT,
                pdi_engine_photo TEXT,
                engine_chassis_no VARCHAR(100),
                battery_sl_no VARCHAR(100),
                fast_tag VARCHAR(100),
                pdi_jack VARCHAR(50),
                pdi_jack_rod VARCHAR(50),
                pdi_spanner VARCHAR(50),
                pdi_parking_triangle VARCHAR(50),
                pdi_fire_extinguisher VARCHAR(50),
                pdi_seat_cover VARCHAR(50),
                pdi_floor_carpet VARCHAR(50),
                pdi_music_system VARCHAR(50),
                pdi_spare_wheel VARCHAR(50),
                pdi_key_quantity VARCHAR(50),
                pdi_rh_front_tyre VARCHAR(50),
                pdi_lh_front_tyre VARCHAR(50),
                pdi_rh_rear_tyre VARCHAR(50),
                pdi_lh_rear_tyre VARCHAR(50),
                
                is_migrated BOOLEAN NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        conn.commit()
        cur.close()
        print("[OK] Database setup complete - maintenance_registry table ready")
    except Exception as e:
        print(f"[ERROR] Startup error: {e}")
        conn.rollback()
    finally:
        postgreSQL_pool.putconn(conn)

# ─────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────
class MaintenanceData(BaseModel):
    # Panel 1
    vehicle_number: str
    city_name: str
    model: str
    vehicle_k_m_s: str
    repair_type: str
    vehicle_location: Optional[str] = None
    vehicle_in_date: str
    initial_remarks: Optional[str] = None
    vehicle_damage_photos: Optional[Any] = None
    general_inspections: Optional[list] = None
    
    # Panel 2
    workshop_name: str
    allocation_date: Optional[str] = None
    estimated_delivery_date: Optional[str] = None
    estimated_amount: Optional[str] = None
    insurance_claimed: str
    claim_number: Optional[str] = None
    insurance_brokerage: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[str] = None
    approval_file: Optional[Any] = None
    
    # Panel 3
    maintenance_status: str
    vehicle_status_date: Optional[str] = None
    daily_vehicle_remarks: Optional[str] = None
    rfd_date: Optional[str] = None
    delivered_date: Optional[str] = None
    final_status: Optional[str] = None
    tat: Optional[str] = None
    pdi_status: str
    job_updates: Optional[list] = None
    
    # Panel 4
    invoice_no: Optional[str] = None
    invoice_date: Optional[str] = None
    invoice_amount: Optional[str] = None
    insurance_liability_discounts: Optional[str] = None
    letzryd_payable: Optional[str] = None
    payment_status: Optional[str] = None
    type_of_payment: Optional[str] = None
    utr_no: Optional[str] = None
    entry_remarks: Optional[str] = None
    invoice_file: Optional[Any] = None
    maintenance_invoices: Optional[list] = None
    
    # Panel 5 (PDI)
    pdi_front_photo: Optional[Any] = None
    pdi_back_photo: Optional[Any] = None
    pdi_lh_photo: Optional[Any] = None
    pdi_rh_photo: Optional[Any] = None
    pdi_engine_photo: Optional[Any] = None
    engine_chassis_no: Optional[str] = None
    battery_sl_no: Optional[str] = None
    fast_tag: Optional[str] = None
    pdi_jack: Optional[str] = None
    pdi_jack_rod: Optional[str] = None
    pdi_spanner: Optional[str] = None
    pdi_parking_triangle: Optional[str] = None
    pdi_fire_extinguisher: Optional[str] = None
    pdi_seat_cover: Optional[str] = None
    pdi_floor_carpet: Optional[str] = None
    pdi_music_system: Optional[str] = None
    pdi_spare_wheel: Optional[str] = None
    pdi_key_quantity: Optional[str] = None
    pdi_rh_front_tyre: Optional[str] = None
    pdi_lh_front_tyre: Optional[str] = None
    pdi_rh_rear_tyre: Optional[str] = None
    pdi_lh_rear_tyre: Optional[str] = None

def extract_image(val: Any) -> Optional[str]:
    if val is None: return None
    if isinstance(val, list) and len(val) > 0:
        first = val[0]
        return first.get("content") if isinstance(first, dict) else str(first)
    return val if isinstance(val, str) and val.startswith("data:") else None

# ─────────────────────────────────────────────────────────
# Cities API
# ─────────────────────────────────────────────────────────
@app.get("/api/cities")
def get_all_cities():
    conn = postgreSQL_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM cities ORDER BY id;")
        return [{"value": r[1], "text": r[1]} for r in cur.fetchall()]
    except Exception as e:
        logger.error(f"Error fetching cities: {e}")
        return [] 
    finally:
        postgreSQL_pool.putconn(conn)

# ─────────────────────────────────────────────────────────
# Maintenance API: List (For the Registry Dashboard)
# ─────────────────────────────────────────────────────────
@app.get("/api/maintenance")
def get_all_maintenance_jobs():
    conn = postgreSQL_pool.getconn()
    try:
        cur = conn.cursor()
        # EXCLUDE ALL HEAVY BASE64 IMAGE COLUMNS to keep the dashboard lightning fast
        cur.execute("""
            SELECT id, vehicle_in_date, vehicle_number, workshop_name, repair_type, 
                   city_name, estimated_amount, maintenance_status, created_at 
            FROM maintenance_registry ORDER BY id DESC;
        """)
        cols = [d[0] for d in cur.description]
        result = [dict(zip(cols, row)) for row in cur.fetchall()]
        return result
    finally:
        postgreSQL_pool.putconn(conn)

# ─────────────────────────────────────────────────────────
# Maintenance API: Single Fetch (For Editing Form)
# ─────────────────────────────────────────────────────────
@app.get("/api/maintenance/{id}")
def get_maintenance_job(id: int):
    conn = postgreSQL_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM maintenance_registry WHERE id = %s;", (id,))
        r = cur.fetchone()
        if not r: raise HTTPException(status_code=404, detail="Record not found")
        cols = [d[0] for d in cur.description]
        data = dict(zip(cols, r))
        
        # Deserialize JSON arrays for the frontend SurveyJS to display
        if data.get('general_inspections'): data['general_inspections'] = json.loads(data['general_inspections'])
        if data.get('job_updates'): data['job_updates'] = json.loads(data['job_updates'])
        if data.get('maintenance_invoices'): data['maintenance_invoices'] = json.loads(data['maintenance_invoices'])
        
        return data
    finally:
        postgreSQL_pool.putconn(conn)

# ─────────────────────────────────────────────────────────
# Maintenance API: Create
# ─────────────────────────────────────────────────────────
@app.post("/api/maintenance")
def create_maintenance_job(data: MaintenanceData):
    conn = postgreSQL_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO maintenance_registry (
                vehicle_number, city_name, model, vehicle_k_m_s, repair_type, vehicle_location, vehicle_in_date, initial_remarks, vehicle_damage_photos, general_inspections,
                workshop_name, allocation_date, estimated_delivery_date, estimated_amount, insurance_claimed, claim_number, insurance_brokerage, approved_by, approval_date, approval_file,
                maintenance_status, vehicle_status_date, daily_vehicle_remarks, rfd_date, delivered_date, final_status, tat, pdi_status, job_updates,
                invoice_no, invoice_date, invoice_amount, insurance_liability_discounts, letzryd_payable, payment_status, type_of_payment, utr_no, entry_remarks, invoice_file, maintenance_invoices,
                pdi_front_photo, pdi_back_photo, pdi_lh_photo, pdi_rh_photo, pdi_engine_photo, engine_chassis_no, battery_sl_no, fast_tag, pdi_jack, pdi_jack_rod, pdi_spanner, pdi_parking_triangle, pdi_fire_extinguisher, pdi_seat_cover, pdi_floor_carpet, pdi_music_system, pdi_spare_wheel, pdi_key_quantity, pdi_rh_front_tyre, pdi_lh_front_tyre, pdi_rh_rear_tyre, pdi_lh_rear_tyre
            ) VALUES (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            ) RETURNING id;
        """, (
            # Panel 1
            data.vehicle_number, data.city_name, data.model, data.vehicle_k_m_s, data.repair_type, data.vehicle_location, data.vehicle_in_date, data.initial_remarks, extract_image(data.vehicle_damage_photos), json.dumps(data.general_inspections) if data.general_inspections else None,
            # Panel 2
            data.workshop_name, data.allocation_date, data.estimated_delivery_date, data.estimated_amount, data.insurance_claimed, data.claim_number, data.insurance_brokerage, data.approved_by, data.approval_date, extract_image(data.approval_file),
            # Panel 3
            data.maintenance_status, data.vehicle_status_date, data.daily_vehicle_remarks, data.rfd_date, data.delivered_date, data.final_status, data.tat, data.pdi_status, json.dumps(data.job_updates) if data.job_updates else None,
            # Panel 4
            data.invoice_no, data.invoice_date, data.invoice_amount, data.insurance_liability_discounts, data.letzryd_payable, data.payment_status, data.type_of_payment, data.utr_no, data.entry_remarks, extract_image(data.invoice_file), json.dumps(data.maintenance_invoices) if data.maintenance_invoices else None,
            # Panel 5
            extract_image(data.pdi_front_photo), extract_image(data.pdi_back_photo), extract_image(data.pdi_lh_photo), extract_image(data.pdi_rh_photo), extract_image(data.pdi_engine_photo), data.engine_chassis_no, data.battery_sl_no, data.fast_tag, data.pdi_jack, data.pdi_jack_rod, data.pdi_spanner, data.pdi_parking_triangle, data.pdi_fire_extinguisher, data.pdi_seat_cover, data.pdi_floor_carpet, data.pdi_music_system, data.pdi_spare_wheel, data.pdi_key_quantity, data.pdi_rh_front_tyre, data.pdi_lh_front_tyre, data.pdi_rh_rear_tyre, data.pdi_lh_rear_tyre
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "id": new_id}
    except Exception as e:
        logger.error(f"DB Insert Error: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        postgreSQL_pool.putconn(conn)

# ─────────────────────────────────────────────────────────
# Maintenance API: Update (PUT)
# ─────────────────────────────────────────────────────────
@app.put("/api/maintenance/{id}")
def update_maintenance_job(id: int, data: MaintenanceData):
    conn = postgreSQL_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE maintenance_registry SET 
                vehicle_number=%s, city_name=%s, model=%s, vehicle_k_m_s=%s, repair_type=%s, vehicle_location=%s, vehicle_in_date=%s, initial_remarks=%s, vehicle_damage_photos=%s, general_inspections=%s,
                workshop_name=%s, allocation_date=%s, estimated_delivery_date=%s, estimated_amount=%s, insurance_claimed=%s, claim_number=%s, insurance_brokerage=%s, approved_by=%s, approval_date=%s, approval_file=%s,
                maintenance_status=%s, vehicle_status_date=%s, daily_vehicle_remarks=%s, rfd_date=%s, delivered_date=%s, final_status=%s, tat=%s, pdi_status=%s, job_updates=%s,
                invoice_no=%s, invoice_date=%s, invoice_amount=%s, insurance_liability_discounts=%s, letzryd_payable=%s, payment_status=%s, type_of_payment=%s, utr_no=%s, entry_remarks=%s, invoice_file=%s, maintenance_invoices=%s,
                pdi_front_photo=%s, pdi_back_photo=%s, pdi_lh_photo=%s, pdi_rh_photo=%s, pdi_engine_photo=%s, engine_chassis_no=%s, battery_sl_no=%s, fast_tag=%s, pdi_jack=%s, pdi_jack_rod=%s, pdi_spanner=%s, pdi_parking_triangle=%s, pdi_fire_extinguisher=%s, pdi_seat_cover=%s, pdi_floor_carpet=%s, pdi_music_system=%s, pdi_spare_wheel=%s, pdi_key_quantity=%s, pdi_rh_front_tyre=%s, pdi_lh_front_tyre=%s, pdi_rh_rear_tyre=%s, pdi_lh_rear_tyre=%s
            WHERE id = %s;
        """, (
            # Panel 1
            data.vehicle_number, data.city_name, data.model, data.vehicle_k_m_s, data.repair_type, data.vehicle_location, data.vehicle_in_date, data.initial_remarks, extract_image(data.vehicle_damage_photos), json.dumps(data.general_inspections) if data.general_inspections else None,
            # Panel 2
            data.workshop_name, data.allocation_date, data.estimated_delivery_date, data.estimated_amount, data.insurance_claimed, data.claim_number, data.insurance_brokerage, data.approved_by, data.approval_date, extract_image(data.approval_file),
            # Panel 3
            data.maintenance_status, data.vehicle_status_date, data.daily_vehicle_remarks, data.rfd_date, data.delivered_date, data.final_status, data.tat, data.pdi_status, json.dumps(data.job_updates) if data.job_updates else None,
            # Panel 4
            data.invoice_no, data.invoice_date, data.invoice_amount, data.insurance_liability_discounts, data.letzryd_payable, data.payment_status, data.type_of_payment, data.utr_no, data.entry_remarks, extract_image(data.invoice_file), json.dumps(data.maintenance_invoices) if data.maintenance_invoices else None,
            # Panel 5
            extract_image(data.pdi_front_photo), extract_image(data.pdi_back_photo), extract_image(data.pdi_lh_photo), extract_image(data.pdi_rh_photo), extract_image(data.pdi_engine_photo), data.engine_chassis_no, data.battery_sl_no, data.fast_tag, data.pdi_jack, data.pdi_jack_rod, data.pdi_spanner, data.pdi_parking_triangle, data.pdi_fire_extinguisher, data.pdi_seat_cover, data.pdi_floor_carpet, data.pdi_music_system, data.pdi_spare_wheel, data.pdi_key_quantity, data.pdi_rh_front_tyre, data.pdi_lh_front_tyre, data.pdi_rh_rear_tyre, data.pdi_lh_rear_tyre,
            # ID condition
            id
        ))
        conn.commit()
        return {"success": True}
    except Exception as e:
        logger.error(f"DB Update Error: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        postgreSQL_pool.putconn(conn)

# ─────────────────────────────────────────────────────────
# Static files
# ─────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory=".", html=True), name="static")