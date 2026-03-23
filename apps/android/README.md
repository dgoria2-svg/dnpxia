# `apps/android`

Placeholder para la futura app Android cliente de DNPXIA.

## Responsabilidad esperada

- Autenticar usuarios contra `apps/api`.
- Registrar y validar dispositivos.
- Consumir licencias/permisos habilitados por backend.
- Soportar escenarios multi-dispositivo con límite configurable.

## Contratos base a consumir

- `POST /auth/login`
- `GET /health`
- futuros endpoints `/devices`, `/licenses` y `/laboratories/:id`

## Próximos pasos sugeridos

1. Definir stack Android (Kotlin + Jetpack Compose sugerido).
2. Implementar cliente HTTP y almacenamiento seguro de tokens.
3. Agregar flujo de registro del dispositivo.
4. Conectar permisos/licencias efectivos desde backend.
