import pyodbc

SERVER   = r"localhost\SALES_DEV"
DATABASE = "DATA_AUDIT_DB"
DRIVER   = "{SQL Server}"

CONN_STR = (
    f"DRIVER={DRIVER};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
)

MASTER_CONN_STR = (
    f"DRIVER={DRIVER};"
    f"SERVER={SERVER};"
    "DATABASE=master;"
    "Trusted_Connection=yes;"
)


def get_connection(autocommit: bool = False):
    """Return a pyodbc connection to DATA_AUDIT_DB."""
    return pyodbc.connect(CONN_STR, autocommit=autocommit)


def db_available() -> bool:
    """Quick check that the database is reachable."""
    try:
        conn = get_connection()
        conn.close()
        return True
    except Exception:
        return False
