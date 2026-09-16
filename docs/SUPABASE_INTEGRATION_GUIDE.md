# StrideSense - Supabase Backend Integration Guide ⚡

This guide explains how to connect your Supabase project (`sgooptohhldguitvhbrl`) to the StrideSense Web & Mobile application and your ESP32 microcontroller.

---

## 1. Where to Put the `.env` Configuration

In Vite and Capacitor applications, environment variables accessed on the frontend must be placed in:
📁 **`dashboard/.env`**

Open `dashboard/.env` (or copy from `dashboard/.env.example`) and insert your credentials:

```env
# Supabase Project URL (already configured for project sgooptohhldguitvhbrl)
VITE_SUPABASE_URL=https://sgooptohhldguitvhbrl.supabase.co

# Paste your publishable/anon key from your Supabase Dashboard
VITE_SUPABASE_ANON_KEY=sb_publishable_X0wUeG...

# Device Identifier
VITE_DEVICE_ID=insole_left_01
```

> [!IMPORTANT]
> **Why `VITE_`?**
> Vite only exposes environment variables prefixed with `VITE_` to the client-side code (`import.meta.env.VITE_...`). Never expose your `service_role` / `SUPABASE_SECRET_KEY` on the client. The publishable/anon key is designed for safe public client usage with Row Level Security (RLS).

---

## 2. Setting Up the Database Schema (1-Click)

1. Open your Supabase project's **SQL Editor**:
   🔗 [https://supabase.com/dashboard/project/sgooptohhldguitvhbrl/sql](https://supabase.com/dashboard/project/sgooptohhldguitvhbrl/sql)
2. Open the prepared SQL migration file:
   📄 [docs/SUPABASE_SCHEMA.sql](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/docs/SUPABASE_SCHEMA.sql)
3. Copy and paste the entire script into the SQL Editor and click **RUN**.
4. This will automatically create:
   - `devices`: Insole hardware profiles, battery voltage, and firmware version.
   - `telemetry`: 50 Hz time-series table tracking $P_1 \dots P_6$, IMU kinematics, activity, steps, and cadence.
   - `fall_incidents`: Emergency audit log for fall anomalies.
   - **Realtime CDC Replication**: Enables instant WebSocket broadcasts when the ESP32 pushes new rows.

---

## 3. How ESP32 Pushes Data to Supabase (PostgREST API)

The ESP32 communicates with Supabase over standard HTTPS using Supabase's built-in PostgREST endpoint. No heavy client library is needed on the microcontroller!

### Endpoint & Headers
- **HTTP Method**: `POST`
- **URL**: `https://sgooptohhldguitvhbrl.supabase.co/rest/v1/telemetry`
- **Headers**:
  ```http
  apikey: <YOUR_SUPABASE_ANON_KEY>
  Authorization: Bearer <YOUR_SUPABASE_ANON_KEY>
  Content-Type: application/json
  Prefer: return=minimal
  ```

### Sample JSON Payload from ESP32
```json
{
  "device_id": "insole_left_01",
  "activity": "Walking",
  "confidence": 0.98,
  "steps": 3842,
  "cadence": 108.5,
  "symmetry": 96.4,
  "fall_alert": false,
  "p1": 2850, "p2": 1350, "p3": 1050,
  "p4": 2600, "p5": 3150, "p6": 2400,
  "pitch": 4.2, "roll": -1.5, "svm_a": 1.28
}
```

---

## 4. Testing the Connection

Once you paste your `VITE_SUPABASE_ANON_KEY` into `dashboard/.env`:
1. Run `npm run dev` in `dashboard/`.
2. Toggle from **Simulator** to **Hardware Wi-Fi**.
3. The dashboard will automatically subscribe via WebSockets to `public.telemetry`.
4. Any row inserted by the ESP32 or SQL Editor will immediately animate the live foot pressure heatmap and cadence meters!
