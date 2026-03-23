const express = require("express");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 4000);

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "dnpxia",
  password: process.env.DB_PASSWORD || "dnpxia",
  database: process.env.DB_NAME || "dnpxia"
});

app.use(express.json());

async function authContextFromToken(token) {
  if (!token) return null;

  const q = await pool.query(`
    select
      u.id as user_id,
      u.email,
      t.id as tenant_id,
      t.slug as tenant_slug,
      t.name as tenant_name,
      s.id as subscription_id,
      s.status as subscription_status,
      p.id as plan_id,
      p.code as plan_code,
      p.name as plan_name,
      p.max_devices
    from auth_tokens at
    join users_account u on u.id = at.user_id
    join tenant_memberships tm on tm.user_id = u.id
    join tenants t on t.id = tm.tenant_id
    join subscriptions s on s.tenant_id = t.id
    join plans p on p.id = s.plan_id
    where at.token = $1
      and (at.expires_at is null or at.expires_at > now())
    order by s.created_at desc
    limit 1
  `, [token]);

  if (q.rowCount === 0) return null;
  return q.rows[0];
}

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "DNPXIA API online" });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "api",
    name: "dnpxia",
    timestamp: new Date().toISOString()
  });
});

app.get("/health/db", async (_req, res, next) => {
  try {
    const q = await pool.query("select now() as now");
    res.json({ ok: true, db: "up", now: q.rows[0].now });
  } catch (err) {
    next(err);
  }
});

app.get("/plans", async (_req, res, next) => {
  try {
    const q = await pool.query(`
      select id, code, name, price_monthly_cents, price_yearly_cents, max_devices, trial_days, is_active
      from plans
      where is_active = true
      order by price_monthly_cents asc
    `);
    res.json(q.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/tenants", async (_req, res, next) => {
  try {
    const q = await pool.query(`
      select id, slug, name, type, created_at
      from tenants
      order by created_at desc
    `);
    res.json(q.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/users", async (_req, res, next) => {
  try {
    const q = await pool.query(`
      select id, email, full_name, is_active, created_at
      from users_account
      order by created_at desc
    `);
    res.json(q.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/memberships", async (_req, res, next) => {
  try {
    const q = await pool.query(`
      select
        tm.id,
        tm.role,
        tm.created_at,
        t.slug as tenant_slug,
        t.name as tenant_name,
        u.email,
        u.full_name
      from tenant_memberships tm
      join tenants t on t.id = tm.tenant_id
      join users_account u on u.id = tm.user_id
      order by tm.created_at desc
    `);
    res.json(q.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/subscriptions", async (_req, res, next) => {
  try {
    const q = await pool.query(`
      select
        s.id,
        s.status,
        s.trial_ends_at,
        s.current_period_end,
        s.created_at,
        t.slug as tenant_slug,
        t.name as tenant_name,
        p.code as plan_code,
        p.name as plan_name
      from subscriptions s
      join tenants t on t.id = s.tenant_id
      join plans p on p.id = s.plan_id
      order by s.created_at desc
    `);
    res.json(q.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/tenants", async (req, res, next) => {
  try {
    const { slug, name, type = "lab" } = req.body || {};

    if (!slug || !name) {
      return res.status(400).json({
        ok: false,
        error: "slug y name son obligatorios"
      });
    }

    const q = await pool.query(
      `insert into tenants (slug, name, type)
       values ($1, $2, $3)
       returning id, slug, name, type, created_at`,
      [slug, name, type]
    );

    res.status(201).json({ ok: true, tenant: q.rows[0] });
  } catch (err) {
    next(err);
  }
});

app.post("/bootstrap/lab-register", async (req, res, next) => {
  const client = await pool.connect();

  try {
    const {
      email,
      fullName,
      tenantSlug,
      tenantName
    } = req.body || {};

    if (!email || !tenantSlug || !tenantName) {
      return res.status(400).json({
        ok: false,
        error: "email, tenantSlug y tenantName son obligatorios"
      });
    }

    await client.query("BEGIN");

    const planQ = await client.query(`
      select id, code, trial_days
      from plans
      where code = 'trial'
      limit 1
    `);

    if (planQ.rowCount === 0) {
      throw new Error("plan trial no encontrado");
    }

    const trialPlan = planQ.rows[0];

    const userQ = await client.query(
      `insert into users_account (email, full_name)
       values ($1, $2)
       returning id, email, full_name, is_active, created_at`,
      [email, fullName || null]
    );

    const user = userQ.rows[0];

    const tenantQ = await client.query(
      `insert into tenants (slug, name, type)
       values ($1, $2, 'lab')
       returning id, slug, name, type, created_at`,
      [tenantSlug, tenantName]
    );

    const tenant = tenantQ.rows[0];

    const membershipQ = await client.query(
      `insert into tenant_memberships (tenant_id, user_id, role)
       values ($1, $2, 'owner')
       returning id, role, created_at`,
      [tenant.id, user.id]
    );

    const subscriptionQ = await client.query(
      `insert into subscriptions (tenant_id, plan_id, status, trial_ends_at)
       values ($1, $2, 'trialing', now() + make_interval(days => $3::int))
       returning id, status, trial_ends_at, current_period_end, created_at`,
      [tenant.id, trialPlan.id, trialPlan.trial_days]
    );

    await client.query("COMMIT");

    res.status(201).json({
      ok: true,
      user,
      tenant,
      membership: membershipQ.rows[0],
      subscription: subscriptionQ.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ ok: false, error: "email requerido" });
    }

    const userQ = await pool.query(
      `select id, email from users_account where email = $1`,
      [email]
    );

    if (userQ.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "user no encontrado" });
    }

    const user = userQ.rows[0];
    const token = crypto.randomBytes(24).toString("hex");

    const tokenQ = await pool.query(
      `insert into auth_tokens (user_id, token, expires_at)
       values ($1, $2, now() + interval '30 days')
       returning token, expires_at`,
      [user.id, token]
    );

    res.json({
      ok: true,
      token: tokenQ.rows[0].token,
      expires_at: tokenQ.rows[0].expires_at
    });
  } catch (err) {
    next(err);
  }
});

app.get("/auth/me", async (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    const auth = await authContextFromToken(token);

    if (!auth) {
      return res.status(401).json({ ok: false, error: "invalid token" });
    }

    res.json({
      ok: true,
      user: {
        id: auth.user_id,
        email: auth.email,
        tenant_id: auth.tenant_id,
        tenant_slug: auth.tenant_slug,
        tenant_name: auth.tenant_name,
        subscription_status: auth.subscription_status,
        plan_code: auth.plan_code,
        max_devices: auth.max_devices
      }
    });
  } catch (err) {
    next(err);
  }
});

app.get("/devices", async (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    const auth = await authContextFromToken(token);

    if (!auth) {
      return res.status(401).json({ ok: false, error: "invalid token" });
    }

    const q = await pool.query(`
      select
        id,
        device_label,
        platform,
        device_fingerprint,
        status,
        created_at
      from devices
      where tenant_id = $1
      order by created_at desc
    `, [auth.tenant_id]);

    res.json({
      ok: true,
      tenant_slug: auth.tenant_slug,
      plan_code: auth.plan_code,
      max_devices: auth.max_devices,
      devices: q.rows
    });
  } catch (err) {
    next(err);
  }
});

app.post("/devices/register", async (req, res, next) => {
  const client = await pool.connect();

  try {
    const token = req.headers["authorization"];
    const auth = await authContextFromToken(token);

    if (!auth) {
      return res.status(401).json({ ok: false, error: "invalid token" });
    }

    const {
      deviceLabel,
      platform = "android",
      deviceFingerprint
    } = req.body || {};

    if (!deviceFingerprint) {
      return res.status(400).json({
        ok: false,
        error: "deviceFingerprint requerido"
      });
    }

    await client.query("BEGIN");

    const existingQ = await client.query(`
      select id, device_label, platform, device_fingerprint, status, created_at
      from devices
      where tenant_id = $1
        and device_fingerprint = $2
      limit 1
    `, [auth.tenant_id, deviceFingerprint]);

    if (existingQ.rowCount > 0) {
      await client.query("COMMIT");
      return res.json({
        ok: true,
        reused: true,
        device: existingQ.rows[0],
        limits: {
          plan_code: auth.plan_code,
          max_devices: auth.max_devices
        }
      });
    }

    const activeCountQ = await client.query(`
      select count(*)::int as n
      from devices
      where tenant_id = $1
        and status = 'active'
    `, [auth.tenant_id]);

    const activeCount = activeCountQ.rows[0].n;

    if (activeCount >= auth.max_devices) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        ok: false,
        error: "device_limit_reached",
        active_devices: activeCount,
        max_devices: auth.max_devices,
        plan_code: auth.plan_code
      });
    }

    const insertQ = await client.query(`
      insert into devices (
        tenant_id,
        user_id,
        device_label,
        platform,
        device_fingerprint,
        status
      )
      values ($1, $2, $3, $4, $5, 'active')
      returning id, device_label, platform, device_fingerprint, status, created_at
    `, [
      auth.tenant_id,
      auth.user_id,
      deviceLabel || null,
      platform,
      deviceFingerprint
    ]);

    await client.query("COMMIT");

    res.status(201).json({
      ok: true,
      reused: false,
      device: insertQ.rows[0],
      limits: {
        plan_code: auth.plan_code,
        max_devices: auth.max_devices,
        active_devices_after_insert: activeCount + 1
      }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

app.use((err, _req, res, _next) => {
  console.error("API_ERROR", err);
  res.status(500).json({
    ok: false,
    error: err.message || "internal_error"
  });
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED_REJECTION", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT_EXCEPTION", err);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DNPXIA API running on port ${PORT}`);
});
