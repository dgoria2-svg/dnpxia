'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '../../components/site-header';
import { clearActiveLabId, getActiveLabId, setActiveLabId } from '../../lib/active-lab';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Membership = {
  laboratoryId: string;
  laboratoryName: string;
  role: string;
};

type StoredUser = {
  id: string;
  email: string;
  fullName: string;
  memberships?: Membership[];
};

type AccessPayload = {
  allowed: boolean;
  scopeType: 'lab';
  scopeId: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  trialEndsAt: string | null;
  maxDevices: number;
  activeDevices: number;
  reason?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [access, setAccess] = useState<AccessPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLabId, setActiveLabIdState] = useState<string | null>(null);

  const memberships = useMemo(() => user?.memberships ?? [], [user]);

  const membership = useMemo(() => {
    if (!memberships.length) return null;
    if (!activeLabId) return memberships[0] ?? null;
    return memberships.find((item) => item.laboratoryId === activeLabId) ?? null;
  }, [memberships, activeLabId]);

  useEffect(() => {
    async function loadAccess() {
      const token = localStorage.getItem('dnpxia.accessToken');
      const rawUser = localStorage.getItem('dnpxia.user');

      if (!token || !rawUser) {
        router.replace('/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(rawUser) as StoredUser;
        const parsedMemberships = parsedUser.memberships ?? [];
        setUser(parsedUser);

        let selectedLabId = getActiveLabId();

        if (parsedMemberships.length === 1) {
          selectedLabId = parsedMemberships[0].laboratoryId;
          setActiveLabId(selectedLabId);
        }

        if (parsedMemberships.length > 1) {
          const valid = selectedLabId && parsedMemberships.some((item) => item.laboratoryId === selectedLabId);
          if (!valid) {
            clearActiveLabId();
            router.replace('/select-lab');
            return;
          }
        }

        if (selectedLabId) {
          setActiveLabIdState(selectedLabId);
        }

        const query = selectedLabId ? `?labId=${encodeURIComponent(selectedLabId)}` : '';
        const response = await fetch(`${apiUrl}/me/access${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json()) as AccessPayload | { message?: string; reason?: string };

        if (!response.ok) {
          const errorMessage =
            'message' in payload && typeof payload.message === 'string'
              ? payload.message
              : 'reason' in payload && typeof payload.reason === 'string'
                ? payload.reason
                : 'No fue posible obtener el estado de acceso.';
          setMessage(errorMessage);
          setLoading(false);
          return;
        }

        if ('reason' in payload && payload.reason === 'lab_selection_required') {
          clearActiveLabId();
          router.replace('/select-lab');
          return;
        }

        setAccess(payload as AccessPayload);
      } catch {
        setMessage('No se pudo leer la sesión o conectar con la API.');
      } finally {
        setLoading(false);
      }
    }

    loadAccess();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('dnpxia.accessToken');
    localStorage.removeItem('dnpxia.user');
    clearActiveLabId();
    router.push('/login');
  }

  function handleSwitchLab() {
    router.push('/select-lab');
  }

  return (
    <main style={{ paddingBottom: '48px' }}>
      <SiteHeader />

      <section className="card" style={{ maxWidth: '960px', margin: '32px auto 0', padding: '32px' }}>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: '12px' }}>
              <span style={{ color: '#bcd6ff' }}>Dashboard conectado</span>
              <h1 style={{ margin: 0 }}>Estado real de acceso</h1>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
                Este panel ya consume la API central y muestra el estado actual de licencias, trial y
                dispositivos para el usuario logueado.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {memberships.length > 1 ? (
                <button type="button" onClick={handleSwitchLab}>
                  Cambiar laboratorio
                </button>
              ) : null}
              <button type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '20px', background: 'var(--panel-muted)' }}>
            Cargando estado de acceso…
          </div>
        ) : null}

        {!loading && message ? (
          <div className="card" style={{ padding: '20px', background: 'rgba(255, 120, 120, 0.08)', color: '#ffb3b3' }}>
            {message}
          </div>
        ) : null}

        {!loading && !message && user && access ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <article className="card" style={{ padding: '20px', background: 'var(--panel-muted)' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Usuario</strong>
                <div>{user.fullName}</div>
                <div style={{ color: 'var(--muted)', marginTop: '4px' }}>{user.email}</div>
              </article>

              <article className="card" style={{ padding: '20px', background: 'var(--panel-muted)' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Laboratorio activo</strong>
                <div>{membership?.laboratoryName ?? 'Sin laboratorio'}</div>
                <div style={{ color: 'var(--muted)', marginTop: '4px' }}>
                  {membership ? `Rol: ${membership.role}` : 'Sin membresía'}
                </div>
              </article>

              <article className="card" style={{ padding: '20px', background: 'var(--panel-muted)' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Acceso</strong>
                <div>{access.allowed ? 'Permitido' : 'Bloqueado'}</div>
                <div style={{ color: 'var(--muted)', marginTop: '4px' }}>
                  Estado: {access.subscriptionStatus}
                </div>
              </article>

              <article className="card" style={{ padding: '20px', background: 'var(--panel-muted)' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Dispositivos</strong>
                <div>
                  {access.activeDevices} / {access.maxDevices}
                </div>
                <div style={{ color: 'var(--muted)', marginTop: '4px' }}>
                  Slots disponibles: {Math.max(access.maxDevices - access.activeDevices, 0)}
                </div>
              </article>
            </div>

            <article className="card" style={{ padding: '24px' }}>
              <h2 style={{ marginTop: 0 }}>Detalle técnico</h2>
              <div style={{ display: 'grid', gap: '8px', color: 'var(--muted)' }}>
                <div>
                  <strong style={{ color: 'white' }}>scopeType:</strong> {access.scopeType}
                </div>
                <div>
                  <strong style={{ color: 'white' }}>scopeId:</strong> {access.scopeId}
                </div>
                <div>
                  <strong style={{ color: 'white' }}>trialEndsAt:</strong>{' '}
                  {access.trialEndsAt ? new Date(access.trialEndsAt).toLocaleString() : 'n/a'}
                </div>
                <div>
                  <strong style={{ color: 'white' }}>reason:</strong> {access.reason ?? 'ok'}
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </main>
  );
}
