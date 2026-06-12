#!/bin/bash

# PostgreSQL Database Backup Script
# Usage: ./backup.sh
# Cron: 0 2 * * * /path/to/backup.sh (runs daily at 2 AM)

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-crm_db}"
DB_USER="${DB_USER:-crm_user}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/crm_backup_${TIMESTAMP}.sql.gz"

echo "Starting backup at $(date)"

# Create compressed backup
if command -v docker &> /dev/null && docker ps | grep -q crm-db; then
    # Docker environment
    docker exec crm-db pg_dump -U "$DB_USER" -d "$DB_NAME" --no-password | gzip > "$BACKUP_FILE"
else
    # Local environment
    PGPASSWORD="${DB_PASSWORD:-}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
fi

echo "Backup created: $BACKUP_FILE"
echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Remove old backups
echo "Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "crm_backup_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete

# Count remaining backups
REMAINING=$(find "$BACKUP_DIR" -name "crm_backup_*.sql.gz" -type f | wc -l)
echo "Total backups: $REMAINING"
echo "Backup completed at $(date)"
