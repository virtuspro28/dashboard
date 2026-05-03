# Guia de Progreso - HomeVault Dashboard

Documento local de traspaso. Resume el estado al cierre del 26/04/2026.

---

## Estado general

- Plataforma target: Linux Debian 13 / Raspberry Pi
- Estado: estabilizacion de modulos con backend y frontend compilando
- Entorno de desarrollo actual: Windows con mocks controlados para Docker, WireGuard y storage

---

## Cerrado en esta sesion

### VPN / WireGuard

- [x] Endpoint `GET /api/vpn/status` para conocer instalacion, interfaz, endpoint y clave publica
- [x] Creacion de clientes VPN desde base de datos + reserva de IP
- [x] Descarga de perfiles `.conf`
- [x] Generacion de QR para importacion movil
- [x] Revocacion de clientes eliminando el peer del fichero WireGuard en Linux real
- [x] Pantalla `RemoteAccess.tsx` rehecha para separar clientes VPN de dominios proxy

### Docker Manager

- [x] Endpoint de detalles por contenedor
- [x] Endpoint de metricas con `docker stats --no-stream`
- [x] Endpoint de logs recientes
- [x] Accion de reinicio (`restart`)
- [x] UI ampliada con panel lateral de inspeccion, metricas y logs

### Compartidos Samba / NFS

- [x] Endpoint `GET /api/samba/protocol/status`
- [x] La UI ya no usa switches fijos: lee `active/enabled` del sistema
- [x] Operaciones del frontend ya envian credenciales de sesion

### Storage / MergerFS / SnapRAID

- [x] Deteccion de pools leyendo `fstab` y `snapraid.conf`
- [x] Endpoint para crear o actualizar configuracion base de pool
- [x] Estado de sync SnapRAID visible en la UI
- [x] Formulario de storage para persistir rutas de datos, paridad y mountpoint

### Documentacion

- [x] `docs/API.md` creado con los endpoints actuales
- [x] `docs/INDEX.md` actualizado con el estado operativo real
- [x] Esta guia local actualizada con el nuevo estado

---

## Pendiente real despues de esta sesion

### WireGuard

- [ ] Preparar automatizacion completa del servidor (`wg0.conf`, claves y servicio systemd) para una Raspberry limpia
- [ ] Validar en VM Linux real la carga en caliente de peers y los permisos sudo
- [ ] Añadir gestion de DNS, allowed IPs avanzadas y expiracion de perfiles si se quiere un flujo mas administrado

### Docker

- [ ] Verificar `start/stop/restart` contra un daemon Docker real en Linux
- [ ] Añadir acciones de despliegue/edicion si se quiere competir con CasaOS/Portainer

### Storage

- [ ] Validar con discos reales los paths de MergerFS y ownership resultante
- [ ] Añadir scrubbing y mas telemetria SnapRAID
- [ ] Resolver casos con multiples pools y rutas complejas

### Compartidos y remoto

- [ ] Probar toggles Samba/NFS con servicios reales instalados
- [ ] Afinar alta/baja de dominios proxy con certificados Let's Encrypt en una maquina accesible desde Internet

### Arquitectura futura

- [ ] Modulo de agentes remotos HomeVault para gestion centralizada

---

## Notas tecnicas de relevo

### 1. Modo mock vs Linux real

- Los modulos de Docker, WireGuard y storage devuelven mocks cuando corren en Windows.
- El objetivo es no bloquear el desarrollo visual ni la compilacion mientras se prepara la VM Linux.

### 2. Variables de entorno nuevas o recomendadas

- `WG_INTERFACE`
- `WG_CONFIG_PATH`
- `WG_SERVER_PUBLIC_KEY_PATH`
- `WG_SERVER_PRIVATE_KEY_PATH`
- `WG_ENDPOINT`
- `WG_PORT`
- `WG_SUBNET_BASE`
- `WG_DEFAULT_DNS`
- `FSTAB_PATH`
- `SNAPRAID_CONF_PATH`
- `MERGERFS_MOUNTPOINT`

### 3. Riesgos a tener en cuenta

- Las operaciones reales de WireGuard, SMART, SnapRAID y systemd requieren sudo funcional.
- El endpoint del cliente VPN sera mas fiable si `WG_ENDPOINT` se define explicitamente.
- `createPool` escribe configuracion base; antes de produccion conviene revisar permisos, mounts y backups de `fstab`.

### 4. Verificacion hecha

- Backend: `npm run build` OK
- Frontend: `npm run build` OK

---

## Siguiente paso recomendado

Levantar una VM Debian o la Raspberry real y validar de punta a punta:

1. Alta de cliente WireGuard
2. Descarga y QR del perfil
3. `docker restart` de un contenedor real
4. Toggle SMB/NFS
5. Creacion de pool con rutas reales

---

## Actualizacion local posterior

### Publicado en `main`

- [x] `install.sh` ya genera `homevault.service` con `EnvironmentFile=/opt/homevault/.env`
- [x] Corregido el bloqueo de autenticacion eliminando el montaje raiz de `dockerRouter`
- [x] Flujo de borrado de contenedores con checkbox para eliminar tambien datos persistentes
- [x] Borrado de datos acotado a `/opt/homevault/data/apps/...` desde mounts reales del contenedor
- [x] Dashboard sincronizado por Socket.io en `/monitor` para CPU/RAM y resumen del sistema
- [x] Catalogo de 25 apps con iconos enlazados a `frontend/public/assets/icons`
- [x] Boton `Abrir Interfaz Web` en las tarjetas de contenedores del Dashboard y Docker Manager
- [x] Resolucion de Web UI por inventario de apps con fallback al primer puerto publico TCP
- [x] Caso especial de Pi-hole resuelto con ruta `/admin`

### Pendiente real despues de esta publicacion

- [ ] Validar en Debian real que el instalador oficial por `curl ... install.sh | bash` deja `homevault` en `active` tras reinstalacion
- [ ] Comprobar en navegador real que el boton `Abrir Interfaz Web` aparece en las 25 apps visibles y abre la URL correcta
- [ ] Revisar algunas definiciones de inventario que aun pueden afinarse en puertos/rutas secundarios si cambian las imagenes Docker
- [ ] Confirmar en Linux real que `docker ps` expone consistentemente los puertos esperados para todos los stacks

### Referencia de commits recientes

- `4a29ed5` Fix installer env loading and stabilize app management
- `3664f62` Add direct web UI links to container cards
- `5fa6907` Place web UI action inside container controls
