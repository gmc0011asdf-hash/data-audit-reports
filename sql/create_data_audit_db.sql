-- ============================================================
-- DATA_AUDIT_DB — Create Database and Tables
-- Server: localhost\SALES_DEV
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'DATA_AUDIT_DB')
BEGIN
    CREATE DATABASE DATA_AUDIT_DB
        COLLATE Arabic_CI_AS;
    PRINT 'Database DATA_AUDIT_DB created.';
END
ELSE
    PRINT 'Database DATA_AUDIT_DB already exists.';
GO

USE DATA_AUDIT_DB;
GO

-- ── datasets ─────────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[datasets]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[datasets] (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        original_filename   NVARCHAR(255)   NOT NULL,
        detected_encoding   NVARCHAR(50),
        detected_separator  NVARCHAR(20),
        row_count           INT             DEFAULT 0,
        created_at          DATETIME        DEFAULT GETDATE()
    );
    PRINT 'Table datasets created.';
END
GO

-- ── records ──────────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[records]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[records] (
        id                      INT IDENTITY(1,1) PRIMARY KEY,
        dataset_id              INT             NOT NULL,
        form_number             NVARCHAR(100),
        head_name               NVARCHAR(255),
        wife_name               NVARCHAR(255),
        mother_name             NVARCHAR(255),
        district                NVARCHAR(100),
        alley                   NVARCHAR(100),
        house_number            NVARCHAR(100),
        raw_address             NVARCHAR(255),
        normalized_area         NVARCHAR(255),
        address_classification  NVARCHAR(50),
        record_status           NVARCHAR(50),
        classification_reason   NVARCHAR(255),
        created_at              DATETIME        DEFAULT GETDATE(),
        CONSTRAINT FK_records_datasets FOREIGN KEY (dataset_id)
            REFERENCES [dbo].[datasets](id)
    );
    PRINT 'Table records created.';
END
GO

-- ── Indexes ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_records_dataset_id' AND object_id = OBJECT_ID('records'))
    CREATE INDEX IX_records_dataset_id   ON [dbo].[records] (dataset_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_records_form_number' AND object_id = OBJECT_ID('records'))
    CREATE INDEX IX_records_form_number  ON [dbo].[records] (form_number);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_records_head_name' AND object_id = OBJECT_ID('records'))
    CREATE INDEX IX_records_head_name    ON [dbo].[records] (head_name);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_records_norm_area' AND object_id = OBJECT_ID('records'))
    CREATE INDEX IX_records_norm_area    ON [dbo].[records] (normalized_area);
GO

PRINT 'Setup complete.';
GO
