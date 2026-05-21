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


def build_where_clause(
    dataset_id=None, search: str = "", form_number: str = "",
    head_name: str = "", area: str = "", classification: str = "", status: str = ""
) -> tuple:
    """Build a shared parameterised WHERE clause for records queries."""
    conditions: list = []
    params: list = []

    if dataset_id is not None:
        conditions.append("dataset_id = ?")
        params.append(dataset_id)

    if search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            "(form_number LIKE ? OR head_name LIKE ? OR wife_name LIKE ? "
            "OR mother_name LIKE ? OR raw_address LIKE ? OR district LIKE ?)"
        )
        params.extend([term] * 6)

    if form_number.strip():
        conditions.append("form_number LIKE ?")
        params.append(f"%{form_number.strip()}%")

    if head_name.strip():
        conditions.append("head_name LIKE ?")
        params.append(f"%{head_name.strip()}%")

    if area.strip():
        conditions.append("normalized_area LIKE ?")
        params.append(f"%{area.strip()}%")

    if classification.strip():
        conditions.append("address_classification = ?")
        params.append(classification.strip())

    if status.strip():
        conditions.append("record_status = ?")
        params.append(status.strip())

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    return where, params


def db_available() -> bool:
    """Quick check that the database is reachable."""
    try:
        conn = get_connection()
        conn.close()
        return True
    except Exception:
        return False
