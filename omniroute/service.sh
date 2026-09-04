#!/usr/bin/env bash
# Install / manage the omniroute systemd service.
#   sudo ./omniroute/service.sh install    link unit, enable, start
#   sudo ./omniroute/service.sh uninstall  stop, disable, remove
#   ./omniroute/service.sh status|logs|restart
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT=omniroute.service
LINK=/etc/systemd/system/$UNIT

case "${1:-status}" in
  install)
    ln -sf "$HERE/$UNIT" "$LINK"
    systemctl daemon-reload
    systemctl enable --now "$UNIT"
    systemctl status "$UNIT" --no-pager | head -15
    ;;
  uninstall)
    systemctl disable --now "$UNIT" || true
    rm -f "$LINK"
    systemctl daemon-reload
    ;;
  restart) systemctl restart "$UNIT"; systemctl status "$UNIT" --no-pager | head -15 ;;
  status)  systemctl status "$UNIT" --no-pager | head -20 ;;
  logs)    journalctl -u "$UNIT" -f ;;
  *) echo "usage: $0 {install|uninstall|restart|status|logs}"; exit 1 ;;
esac
