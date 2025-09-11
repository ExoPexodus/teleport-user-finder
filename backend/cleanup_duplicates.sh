#!/bin/bash

# Cleanup script for duplicate users in the database
# This script removes duplicate users keeping the most recent one based on created_date

echo "Starting duplicate user cleanup..."

# Connect to PostgreSQL and run cleanup query
python3 << 'EOF'
import psycopg2
import logging
from config import DB_CONFIG

try:
    # Connect to database
    conn = psycopg2.connect(
        host=DB_CONFIG['host'],
        database=DB_CONFIG['database'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password']
    )
    cursor = conn.cursor()
    
    # Find and display duplicates before cleanup
    print("Finding duplicate users...")
    cursor.execute("""
        SELECT name, portal, COUNT(*) as duplicate_count
        FROM users
        GROUP BY name, portal
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC;
    """)
    
    duplicates = cursor.fetchall()
    if duplicates:
        print(f"Found {len(duplicates)} sets of duplicate users:")
        for name, portal, count in duplicates:
            print(f"  - {name} in {portal}: {count} duplicates")
    else:
        print("No duplicate users found.")
        conn.close()
        exit(0)
    
    # Remove duplicates, keeping the most recent one
    print("\nRemoving duplicates...")
    cursor.execute("""
        DELETE FROM users 
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY name, portal 
                           ORDER BY created_date DESC, id DESC
                       ) as rn
                FROM users
            ) ranked
            WHERE rn > 1
        );
    """)
    
    deleted_count = cursor.rowcount
    conn.commit()
    
    print(f"Successfully removed {deleted_count} duplicate user records.")
    
    # Verify cleanup
    cursor.execute("""
        SELECT name, portal, COUNT(*) as count
        FROM users
        GROUP BY name, portal
        HAVING COUNT(*) > 1;
    """)
    
    remaining_duplicates = cursor.fetchall()
    if remaining_duplicates:
        print(f"Warning: {len(remaining_duplicates)} duplicate sets still remain:")
        for name, portal, count in remaining_duplicates:
            print(f"  - {name} in {portal}: {count} records")
    else:
        print("✓ All duplicates successfully removed.")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error during cleanup: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()
    exit(1)

EOF

echo "Duplicate cleanup completed."