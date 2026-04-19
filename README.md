# HomePiNAS 🍓

HomePiNAS es una solución de almacenamiento personal "todo en uno" diseñada específicamente para Raspberry Pi. Transforma tu Pi en un servidor NAS profesional con una interfaz web moderna, segura y fácil de usar.

## Características Principales

- **Dashboard Inteligente**: Monitorización en tiempo real de CPU, RAM, temperatura y almacenamiento.
- **Gestión de Archivos**: Explorador web integrado con soporte para Drag & Drop y previsualización de multimedia.
- **Almacenamiento Avanzado**: Soporte para MergerFS (unificación de discos) y SnapRAID (paridad de datos).
- **Control de Docker**: Despliega y gestiona contenedores con un solo clic desde la "Tienda de Apps".
- **Seguridad**: Cortafuegos (UFW) y VPN (WireGuard) preconfigurados.
- **Notificaciones**: Alertas críticas en tiempo real vía Telegram, Discord y notificaciones nativas de escritorio.

---

## 🚀 Instalación Rápida (Un solo comando)

Para instalar HomePiNAS en una Raspberry Pi fresca con **Raspberry Pi OS (64-bit)** o cualquier sistema basado en Debian/Ubuntu, ejecuta el siguiente comando:

```bash
curl -sSL https://raw.githubusercontent.com/tu-usuario/homepinas/main/install.sh | sudo bash
```

*El script se encargará de instalar Docker, Node.js, Samba y todas las dependencias necesarias. Al finalizar, te proporcionará la IP local para acceder al panel.*

---

## Acceso Inicial

Una vez completada la instalación:
1. Abre tu navegador y ve a `http://IP-DE-TU-PI`.
2. Completa el asistente de configuración inicial.
3. **Importante**: El primer usuario que crees tendrá el rol de `OWNER`, lo que le otorga permisos totales para editar archivos de sistema y gestionar cuotas.

## Comandos Útiles

- **Ver logs del sistema**: `sudo journalctl -u homepinas -f`
- **Reiniciar servicio**: `sudo systemctl restart homepinas`
- **Detener servicio**: `sudo systemctl stop homepinas`

## Requisitos de Hardware

- **Sugerido**: Raspberry Pi 4 o Pi 5 con 4GB+ de RAM.
- **Almacenamiento**: MicroSD para el sistema operativo y discos USB para tus datos.
- **OS**: Raspberry Pi OS (64 bits) Lite o Desktop.

---

Desarrollado con ❤️ por el equipo de **Advanced Agentic Coding**.
