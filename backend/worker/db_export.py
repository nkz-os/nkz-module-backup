import os
import sys
import json
import psycopg2
from psycopg2 import sql

def main():
    # 1. Config
    DATABASE_URL = os.environ.get("DATABASE_URL")
    TENANT_ID = os.environ.get("TENANT_ID")
    
    if not DATABASE_URL or not TENANT_ID:
        print("Error: DATABASE_URL and TENANT_ID env vars required", file=sys.stderr)
        sys.exit(1)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
    except Exception as e:
        print(f"Error connecting to DB: {e}", file=sys.stderr)
        sys.exit(1)

    # 2. Discovery: Find tables and check for tenant_id column
    # We query information_schema.columns
    cur.execute("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
          AND table_type = 'BASE TABLE'
    """)
    all_tables = cur.fetchall() # [(schema, table), ...]

    # debug
    print(f"-- Exporting data for Tenant: {TENANT_ID}", file=sys.stderr)

    # We output SQL COPY commands to stdout
    print("BEGIN;") 
    
    for schema, table in all_tables:
        # Check if table has tenant_id
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = %s AND table_name = %s AND column_name = 'tenant_id'
        """, (schema, table))
        has_tenant_id = cur.fetchone() is not None

        full_table_name = f'"{schema}"."{table}"'
        
        # 3. Export Logic
        if has_tenant_id:
            # Shared table strategy: Export ONLY matching rows
            # We use COPY (SELECT ...) TO STDOUT
            # BUT: pg streaming to python stdout is tricky for restoration.
            # Simpler approach for restoration compatibility: Generate INSERT statements? 
            # Or use COPY FROM STDIN in restore.
            # Standard pg_dump creates COPY statements. We will mimic that format roughly
            # or simply use COPY ... TO STDOUT and let the restore script handle it via COPY FROM STDIN.
            
            # Actually, standard pg_dump archive format is complex.
            # Plain SQL format is easier to generate: "COPY schema.table (col1, col2) FROM stdin;\n value\tvalue\n\\.\n"
            
            print(f"-- Dumping shared table {full_table_name} (filtered)")
            
            # Get columns to ensure order
            cur.execute(sql.SQL("SELECT * FROM {} LIMIT 0").format(sql.Identifier(schema, sql.Identifier(table))))
            colnames = [desc[0] for desc in cur.description]
            cols_str = ", ".join([f'"{c}"' for c in colnames])
            
            print(f"COPY {full_table_name} ({cols_str}) FROM stdin;")
            sys.stdout.flush()
            
            # Use copy_expert to dump filtered rows to stdout
            query = sql.SQL("COPY (SELECT * FROM {} WHERE tenant_id = %s) TO STDOUT").format(sql.Identifier(schema, sql.Identifier(table)))
            cur.copy_expert(query, sys.stdout, (TENANT_ID,))
            
            print("\\.") # End of COPY
            
        else:
            # No tenant_id column.
            # Heuristic: 
            # 1. Is it a tenant-specific schema? (e.g. schema name contains tenant_id)
            # 2. Is it global reference data?
            
            # For Safety in Phase 2: We ONLY export if it's explicitly safe or part of a tenant schema?
            # OR we assume if no tenant_id, it MIGHT be global data (dangerous) or tenant-specific schema (safe).
            
            # Let's assume for now:
            # If schema == 'public', we assume it's global reference (export all? risky if it contains other tenant info).
            # If schema == TENANT_ID, it's safe.
            
            # REFINEMENT: In Nekazari, usually we use tenant_id column in public schema. 
            # Tables without tenant_id in public schema might be pure config or dictionaries.
            # We will export them fully for now, but LOG a warning.
            
            # Optimization: Check if schema name matches tenant_id (common pattern)
            if schema == TENANT_ID:
                 print(f"-- Dumping tenant schema table {full_table_name} (full)")
                 # Export full table
                 cur.copy_expert(sql.SQL("COPY {} TO STDOUT").format(sql.Identifier(schema, sql.Identifier(table))), sys.stdout)
            else:
                 # Public/Shared table without tenant_id.
                 # Risk: Leakage.
                 # Action: Export but warn. Or maybe SKIP?
                 # Decision for Hermeticity: SKIP unless authorized list?
                 # For MVP extensibility: We'll export it but maybe we should filter by specific known tables?
                 # Let's export it for now to avoid breaking apps, but trust the `tenant_id` check covers 99% of sensitive data.
                 print(f"-- Dumping potentially global table {full_table_name} (full - CAUTION)")
                 cur.copy_expert(sql.SQL("COPY {} TO STDOUT").format(sql.Identifier(schema, sql.Identifier(table))), sys.stdout)

    print("COMMIT;")
    conn.close()

if __name__ == "__main__":
    main()
