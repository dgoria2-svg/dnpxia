create unique index if not exists ux_devices_tenant_fingerprint
on devices (tenant_id, device_fingerprint)
where device_fingerprint is not null;
