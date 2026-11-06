#!/usr/bin/env bash
set -e

ACTION="${1:-status}"

case "$ACTION" in
  start)
    echo "Starting Zenkar local development services..."
    systemctl --user start zenkar-backend zenkar-frontend
    echo "Started. Ports:"
    ss -tulpn | grep -E "3000|5173" || true
    ;;
  stop)
    echo "Stopping Zenkar local development services..."
    systemctl --user stop zenkar-backend zenkar-frontend
    echo "Stopped."
    ;;
  restart)
    echo "Restarting Zenkar local development services..."
    systemctl --user restart zenkar-backend zenkar-frontend
    echo "Restarted."
    ;;
  status)
    echo "=== Service Status ==="
    systemctl --user status zenkar-backend zenkar-frontend --no-pager || true
    echo ""
    echo "=== Listening Ports ==="
    ss -tulpn | grep -E "3000|5173|5432" || true
    echo ""
    echo "=== Postgres Container ==="
    /snap/bin/docker ps --filter "name=zenkar-db-local" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
    ;;
  logs)
    TARGET="${2:-all}"
    if [ "$TARGET" = "backend" ]; then
      journalctl --user -u zenkar-backend -f
    elif [ "$TARGET" = "frontend" ]; then
      journalctl --user -u zenkar-frontend -f
    else
      journalctl --user -u zenkar-backend -u zenkar-frontend -f
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs [backend|frontend]}"
    exit 1
    ;;
esac

