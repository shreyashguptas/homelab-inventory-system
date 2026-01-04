#!/bin/bash

# Homelab Inventory System - Backup Script
# Creates a backup of the database and images

set -e

INSTALL_DIR="${INSTALL_DIR:-/opt/homelab-inventory}"
BACKUP_DIR="${BACKUP_DIR:-/home/pi/backups/inventory}"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="inventory-backup-$DATE"

echo "Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create temp directory for this backup
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/$BACKUP_NAME"

# Backup database (using SQLite backup command for consistency)
echo "Backing up database..."
sqlite3 "$INSTALL_DIR/data/inventory.db" ".backup '$TEMP_DIR/$BACKUP_NAME/inventory.db'"

# Backup images
echo "Backing up images..."
if [ -d "$INSTALL_DIR/data/images" ]; then
    cp -r "$INSTALL_DIR/data/images" "$TEMP_DIR/$BACKUP_NAME/"
fi

# Create compressed archive
echo "Creating archive..."
cd "$TEMP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "$BACKUP_NAME"

# Cleanup
rm -rf "$TEMP_DIR"

# Keep only last 7 backups
echo "Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t inventory-backup-*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm

echo "Backup complete: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Print backup size
ls -lh "$BACKUP_DIR/$BACKUP_NAME.tar.gz"
