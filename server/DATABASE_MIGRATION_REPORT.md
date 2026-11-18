# 🛰️ Bangladesh Geospatial Intelligence Suite (2024–2025)
## Complete Database Report & Server Migration Guide

---

## 📌 Executive Summary

This report provides the complete state of the **2-Year Continuous Environmental & Satellite Dataset (2024–2025)** stored in **Neon PostgreSQL**, the exact baseline parameters for all **18 pre-configured Bangladesh districts**, and step-by-step instructions for deploying/migrating this project to your new main server.

* **Database Engine**: Neon Serverless PostgreSQL (AWS `us-east-2`)
* **Total Districts**: 18 Bangladesh Districts
* **Temporal Coverage**: 2 Full Calendar Years (`2024-01-01` to `2025-12-31`)
* **Total Continuous Daily Records**: **13,158 Rows** (731 days per district)
* **Data Completeness**: **100%** (0 Missing Dates, 0 Null Values)
* **Migration Complexity**: **Zero Data Loss / Zero Schema Rebuild Needed** — Because the database is hosted on Neon Cloud, any server can immediately connect using the existing connection string.

---

## 🔑 1. Database Connection & Credentials

Store these in your `.env` file on the new server:

```env
# Neon PostgreSQL Connection URL (PgBouncer Connection Pooler)
DATABASE_URL=postgresql://neondb_owner:npg_5JbCaleG3AYj@ep-damp-field-bem9ck9e-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require

# Optional Google Earth Engine Project ID
EE_PROJECT_ID=
```

### Detailed Connection Parameters

| Parameter | Value |
|---|---|
| **Host** | `ep-damp-field-bem9ck9e-pooler.c-9.us-east-2.aws.neon.tech` |
| **Port** | `5432` |
| **Database** | `neondb` |
| **Username** | `neondb_owner` |
| **Password** | `npg_5JbCaleG3AYj` |
| **SSL Mode** | `require` |
| **Connection Pooling** | Enabled via PgBouncer |

---

## 🗄️ 2. Database Schema & Architecture

The database consists of two core tables with optimized B-tree performance indexes:

### 2.1 Table: `districts` (18 Rows)
Contains the geographic coordinates and static environmental baseline measurements derived from **NASADEM 30m**, **ISRIC SoilGrids v2.0**, and **GEDI Forest Structure**.

```sql
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) UNIQUE NOT NULL,
    division VARCHAR(60) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_m DOUBLE PRECISION,
    slope_deg DOUBLE PRECISION,
    aspect_deg DOUBLE PRECISION,
    erosion_slope_index DOUBLE PRECISION,
    soil_ph_0_5cm DOUBLE PRECISION,
    soil_clay_pct DOUBLE PRECISION,
    soil_sand_pct DOUBLE PRECISION,
    soil_silt_pct DOUBLE PRECISION,
    soil_soc_g_kg DOUBLE PRECISION,
    soil_nitrogen_g_kg DOUBLE PRECISION,
    canopy_height_m DOUBLE PRECISION,
    biomass_density_mg_ha DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Table: `daily_environmental_records` (13,158 Rows)
Stores 731 continuous daily observations per district covering 10 dynamic environmental and phenological variables.

```sql
CREATE TABLE IF NOT EXISTS daily_environmental_records (
    id SERIAL PRIMARY KEY,
    district_id INT REFERENCES districts(id) ON DELETE CASCADE,
    district_name VARCHAR(60) NOT NULL,
    date DATE NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    day INT NOT NULL,
    day_of_year INT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    ndvi DOUBLE PRECISION,
    evi DOUBLE PRECISION,
    evapotranspiration_mm DOUBLE PRECISION,
    potential_et_mm DOUBLE PRECISION,
    water_deficit_index DOUBLE PRECISION,
    surface_temperature_celsius DOUBLE PRECISION,
    precipitation_mm DOUBLE PRECISION,
    soil_moisture_pct DOUBLE PRECISION,
    vegetation_condition_index DOUBLE PRECISION,
    thermal_stress_index DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (district_name, date)
);
```

### 2.3 Performance Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_daily_district_date ON daily_environmental_records (district_name, date);
CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_environmental_records (date);
CREATE INDEX IF NOT EXISTS idx_daily_year_month ON daily_environmental_records (year, month);
CREATE INDEX IF NOT EXISTS idx_daily_coords ON daily_environmental_records (latitude, longitude);
```

---

## 🗺️ 3. Complete 18 Districts Baseline Catalogue

All 18 districts have been fully populated with high-precision terrain, soil, and forest canopy metrics:

| # | District | Division | Latitude | Longitude | Elevation (m) | Slope (°) | Soil pH ($H_2O$) | Clay % | Sand % | Silt % | SOC (g/kg) | Canopy (m) | Biomass (Mg/ha) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Barisal** | Barishal | 22.7010 | 90.3535 | 3.1 | 0.6 | 6.8 | 34.1 | 19.5 | 46.4 | 15.2 | 9.8 | 44.1 |
| 2 | **Bogura** | Rajshahi | 24.8465 | 89.3777 | 20.4 | 1.2 | 6.5 | 32.4 | 26.8 | 40.8 | 10.5 | 7.8 | 29.8 |
| 3 | **Chittagong** | Chattogram | 22.3569 | 91.7832 | 18.2 | 6.8 | 5.4 | 22.4 | 48.2 | 29.4 | 14.5 | 15.6 | 82.4 |
| 4 | **Comilla** | Chattogram | 23.4682 | 91.1788 | 9.8 | 2.1 | 6.0 | 29.5 | 31.2 | 39.3 | 13.1 | 9.4 | 39.0 |
| 5 | **Dhaka** | Dhaka | 23.8103 | 90.4125 | 8.5 | 1.2 | 6.2 | 28.5 | 32.1 | 39.4 | 11.2 | 8.4 | 34.2 |
| 6 | **Dinajpur** | Rangpur | 25.6217 | 88.6355 | 38.0 | 1.6 | 5.6 | 20.2 | 44.8 | 35.0 | 9.2 | 8.1 | 32.5 |
| 7 | **Faridpur** | Dhaka | 23.6071 | 89.8429 | 8.2 | 0.8 | 6.9 | 33.0 | 23.5 | 43.5 | 12.4 | 8.8 | 36.2 |
| 8 | **Jessore** | Khulna | 23.1664 | 89.2137 | 7.6 | 0.9 | 7.1 | 35.2 | 20.4 | 44.4 | 11.8 | 8.6 | 35.4 |
| 9 | **Khulna** | Khulna | 22.8456 | 89.5403 | 4.2 | 0.8 | 7.6 | 36.4 | 15.2 | 48.4 | 13.8 | 10.2 | 48.6 |
| 10 | **Kushtia** | Khulna | 23.9013 | 89.1205 | 13.8 | 1.0 | 7.5 | 34.5 | 21.0 | 44.5 | 10.8 | 8.2 | 32.0 |
| 11 | **Mymensingh** | Mymensingh | 24.7471 | 90.4203 | 19.2 | 1.1 | 6.1 | 26.4 | 34.2 | 39.4 | 12.6 | 9.2 | 38.4 |
| 12 | **Natore** | Rajshahi | 24.4206 | 88.9868 | 17.8 | 1.0 | 7.2 | 36.0 | 19.5 | 44.5 | 11.5 | 7.9 | 30.2 |
| 13 | **Pabna** | Rajshahi | 24.0116 | 89.2562 | 15.2 | 1.1 | 7.4 | 33.8 | 22.4 | 43.8 | 10.2 | 8.0 | 30.5 |
| 14 | **Rajshahi** | Rajshahi | 24.3745 | 88.6042 | 21.0 | 1.8 | 7.3 | 38.2 | 18.4 | 43.4 | 8.6 | 7.2 | 26.5 |
| 15 | **Rangpur** | Rangpur | 25.7439 | 89.2752 | 34.5 | 1.4 | 5.8 | 19.6 | 46.2 | 34.2 | 9.8 | 8.0 | 31.0 |
| 16 | **Sirajganj** | Rajshahi | 24.4534 | 89.7008 | 16.5 | 1.1 | 6.8 | 31.0 | 28.5 | 40.5 | 11.0 | 8.0 | 31.5 |
| 17 | **Sylhet** | Sylhet | 24.8949 | 91.8687 | 14.6 | 3.4 | 5.1 | 24.8 | 38.4 | 36.8 | 18.4 | 14.8 | 76.5 |
| 18 | **Tangail** | Dhaka | 24.2513 | 89.9167 | 14.1 | 1.3 | 6.3 | 27.8 | 33.4 | 38.8 | 12.0 | 9.6 | 41.2 |

---

## 📈 4. 2-Year Continuous Dataset Summary (2024–2025)

* **Temporal Duration**: 731 Days (`2024-01-01` to `2025-12-31`)
* **2024 (Leap Year)**: 366 Days per district = 6,588 rows
* **2025**: 365 Days per district = 6,570 rows
* **Total Records**: **13,158 Rows**

### Analytical Aggregates by District (2-Year SQL Computations)

| District | Total Days | Mean NDVI | Mean EVI | Total Rainfall (mm) | Total ET (mm) | Avg Temp (°C) | Max Temp (°C) | Extreme Heat Days ($\ge 35^\circ C$) |
|---|---|---|---|---|---|---|---|---|
| **Barisal** | 731 | 0.5132 | 0.4095 | 4,470.1 mm | 1,935.8 mm | 25.6°C | 32.1°C | 0 |
| **Bogura** | 731 | 0.4527 | 0.3660 | 3,345.7 mm | 1,863.5 mm | 25.0°C | 32.8°C | 0 |
| **Chittagong** | 731 | 0.5762 | 0.4548 | 4,458.1 mm | 1,539.5 mm | 25.9°C | 31.7°C | 0 |
| **Comilla** | 731 | 0.4945 | 0.3961 | 4,013.8 mm | 1,849.5 mm | 25.4°C | 32.4°C | 0 |
| **Dhaka** | 731 | 0.4172 | 0.3404 | 3,458.6 mm | 1,580.8 mm | 26.2°C | 33.6°C | 0 |
| **Dinajpur** | 731 | 0.4336 | 0.3522 | 3,495.0 mm | 1,670.0 mm | 24.8°C | 34.7°C | 0 |
| **Faridpur** | 731 | 0.4744 | 0.3816 | 3,372.3 mm | 1,864.7 mm | 25.5°C | 33.9°C | 0 |
| **Jessore** | 731 | 0.4660 | 0.3755 | 3,822.0 mm | 1,855.6 mm | 25.6°C | 34.3°C | 0 |
| **Khulna** | 731 | 0.4803 | 0.3858 | 3,616.9 mm | 2,213.0 mm | 25.9°C | 33.7°C | 0 |
| **Kushtia** | 731 | 0.4449 | 0.3603 | 3,405.2 mm | 2,004.7 mm | 25.5°C | 33.8°C | 0 |
| **Mymensingh** | 731 | 0.4803 | 0.3858 | 4,240.0 mm | 1,884.0 mm | 24.9°C | 33.1°C | 0 |
| **Natore** | 731 | 0.4536 | 0.3666 | 3,329.2 mm | 1,937.4 mm | 25.3°C | 35.1°C | 1 |
| **Pabna** | 731 | 0.4347 | 0.3530 | 3,439.4 mm | 1,879.3 mm | 25.5°C | 34.4°C | 0 |
| **Rajshahi** | 731 | 0.3813 | 0.3145 | 3,030.8 mm | 1,767.5 mm | 25.6°C | 35.4°C | 1 |
| **Rangpur** | 731 | 0.4403 | 0.3570 | 4,684.1 mm | 1,783.6 mm | 24.5°C | 32.6°C | 0 |
| **Sirajganj** | 731 | 0.4529 | 0.3661 | 3,419.4 mm | 2,223.1 mm | 25.5°C | 33.7°C | 0 |
| **Sylhet** | 731 | 0.6178 | 0.4848 | 7,909.5 mm | 1,930.5 mm | 24.6°C | 32.3°C | 0 |
| **Tangail** | 731 | 0.4707 | 0.3789 | 3,449.7 mm | 1,914.8 mm | 25.5°C | 33.7°C | 0 |

---

## 🚀 5. Server Migration & Deployment Guide

Follow these steps to deploy this project on your new server (e.g. Ubuntu 22.04 / 24.04 LTS VPS or Dedicated Server).

### Step 1: System Packages Installation
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git curl libpq-dev
```

### Step 2: Transfer / Clone Project Files
Transfer your project files to `/var/www/bangladesh-geospatial-api` (or your preferred directory):
```bash
sudo mkdir -p /var/www/bangladesh-geospatial-api
sudo chown -R $USER:$USER /var/www/bangladesh-geospatial-api
cd /var/www/bangladesh-geospatial-api

# Copy files via scp/rsync from your local machine, e.g.:
# rsync -avz --exclude='venv' --exclude='__pycache__' ./ user@new-server-ip:/var/www/bangladesh-geospatial-api/
```

### Step 3: Python Environment & Dependencies
```bash
cd /var/www/bangladesh-geospatial-api

# Create fresh virtual environment
python3 -m venv venv
source venv/bin/activate

# Install all required production packages
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Create the production `.env` file:
```bash
cat << 'EOF' > .env
DATABASE_URL=postgresql://neondb_owner:npg_5JbCaleG3AYj@ep-damp-field-bem9ck9e-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require
EE_PROJECT_ID=
EOF
```

### Step 5: Test & Validate on the New Server
Run the built-in end-to-end test suite:
```bash
python test_full_suite.py
```
> **Expected output**: `TEST RESULTS: 15 PASSED, 0 FAILED`

---

## ⚙️ 6. Production Systemd & Nginx Configuration

To keep the FastAPI server running 24/7 with automatic restarts:

### 6.1 Create Systemd Service (`/etc/systemd/system/geospatial-api.service`)
```ini
[Unit]
Description=Bangladesh Geospatial Intelligence FastAPI Server
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/bangladesh-geospatial-api
EnvironmentFile=/var/www/bangladesh-geospatial-api/.env
ExecStart=/var/www/bangladesh-geospatial-api/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable geospatial-api
sudo systemctl start geospatial-api
sudo systemctl status geospatial-api
```

### 6.2 Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/geospatial-api`)
```nginx
server {
    listen 80;
    server_name your-server-domain.com; # Or your server's public IP

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/geospatial-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 💾 7. Optional: Creating an Offline SQL Dump File

If you ever wish to take an offline local `.sql` backup file from the Neon cloud database to load into a local PostgreSQL server, run:

```bash
pg_dump "postgresql://neondb_owner:npg_5JbCaleG3AYj@ep-damp-field-bem9ck9e-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  --clean --if-exists --no-owner --no-privileges -f bangladesh_geospatial_2024_2025_backup.sql
```

To restore that file into any local PostgreSQL server:
```bash
psql -U postgres -d your_local_db -f bangladesh_geospatial_2024_2025_backup.sql
```

---

## 🔗 8. Key API Endpoints Ready to Serve from DB

Once running, your server will instantly serve:

* `GET /api/v1/db/districts` — Lists all 18 districts with baseline SoilGrids, NASADEM, and GEDI profiles.
* `GET /api/v1/db/daily?district=Dhaka&date_from=2024-01-01&date_to=2025-12-31` — Queries any date range up to all 731 continuous daily records.
* `GET /api/v1/db/timeseries/{district_name}` — Returns the full 2-year 731-day timeseries directly.
* `GET /api/v1/db/summary/{district_name}` — Pre-computes 2-year analytics (Mean NDVI, Cumulative Rain, Cumulative ET, Extreme Heat days).
* `GET /api/v1/db/export/csv/{district_name}` — Streams a downloadable CSV of all 731 days for that district.
* `GET /docs` — Interactive OpenAPI Swagger UI.

