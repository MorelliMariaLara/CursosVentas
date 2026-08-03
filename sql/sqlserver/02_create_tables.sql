/*
  Academia / CursosVentas
  SQL Server — crear tablas

  Servidor: LARA-NB\SQLEXPRESS02
  Base:     Cusosventas

  Ejecutar DESPUÉS de 01_create_database.sql
  en SSMS contra la base Cusosventas.
*/

USE [Cusosventas];
GO

/* ========== USER ========== */
IF OBJECT_ID(N'dbo.[User]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[User] (
    [id]           NVARCHAR(191)  NOT NULL,
    [email]        NVARCHAR(191)  NOT NULL,
    [passwordHash] NVARCHAR(191)  NOT NULL,
    [name]         NVARCHAR(191)  NOT NULL,
    [role]         NVARCHAR(191)  NOT NULL CONSTRAINT DF_User_role DEFAULT N'STUDENT',
    [createdAt]    DATETIME2      NOT NULL CONSTRAINT DF_User_createdAt DEFAULT SYSUTCDATETIME(),
    [updatedAt]    DATETIME2      NOT NULL CONSTRAINT DF_User_updatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_User PRIMARY KEY ([id]),
    CONSTRAINT UQ_User_email UNIQUE ([email])
  );
END
GO

/* ========== COURSE ========== */
IF OBJECT_ID(N'dbo.[Course]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[Course] (
    [id]               NVARCHAR(191)  NOT NULL,
    [slug]             NVARCHAR(191)  NOT NULL,
    [title]            NVARCHAR(191)  NOT NULL,
    [shortDescription] NVARCHAR(1000) NOT NULL,
    [description]      NVARCHAR(MAX)  NOT NULL,
    [price]            FLOAT          NOT NULL,
    [currency]         NVARCHAR(191)  NOT NULL CONSTRAINT DF_Course_currency DEFAULT N'ARS',
    [thumbnailPath]    NVARCHAR(1000) NULL,
    [published]        BIT            NOT NULL CONSTRAINT DF_Course_published DEFAULT 0,
    [passingScore]     INT            NOT NULL CONSTRAINT DF_Course_passingScore DEFAULT 70,
    [createdAt]        DATETIME2      NOT NULL CONSTRAINT DF_Course_createdAt DEFAULT SYSUTCDATETIME(),
    [updatedAt]        DATETIME2      NOT NULL CONSTRAINT DF_Course_updatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Course PRIMARY KEY ([id]),
    CONSTRAINT UQ_Course_slug UNIQUE ([slug])
  );
END
GO

/* ========== MODULE ========== */
IF OBJECT_ID(N'dbo.[Module]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[Module] (
    [id]        NVARCHAR(191) NOT NULL,
    [courseId]  NVARCHAR(191) NOT NULL,
    [title]     NVARCHAR(191) NOT NULL,
    [sortOrder] INT           NOT NULL CONSTRAINT DF_Module_sortOrder DEFAULT 0,
    CONSTRAINT PK_Module PRIMARY KEY ([id]),
    CONSTRAINT FK_Module_Course FOREIGN KEY ([courseId])
      REFERENCES dbo.[Course]([id]) ON DELETE CASCADE
  );
  CREATE INDEX IX_Module_courseId ON dbo.[Module]([courseId]);
END
GO

/* ========== LESSON ========== */
IF OBJECT_ID(N'dbo.[Lesson]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[Lesson] (
    [id]          NVARCHAR(191)  NOT NULL,
    [moduleId]    NVARCHAR(191)  NOT NULL,
    [title]       NVARCHAR(191)  NOT NULL,
    [description] NVARCHAR(MAX)  NULL,
    [sortOrder]   INT            NOT NULL CONSTRAINT DF_Lesson_sortOrder DEFAULT 0,
    [durationSec] INT            NOT NULL CONSTRAINT DF_Lesson_durationSec DEFAULT 0,
    [videoPath]   NVARCHAR(1000) NULL,
    [videoMime]   NVARCHAR(191)  NULL,
    CONSTRAINT PK_Lesson PRIMARY KEY ([id]),
    CONSTRAINT FK_Lesson_Module FOREIGN KEY ([moduleId])
      REFERENCES dbo.[Module]([id]) ON DELETE CASCADE
  );
  CREATE INDEX IX_Lesson_moduleId ON dbo.[Lesson]([moduleId]);
END
GO

/* ========== ENROLLMENT ========== */
IF OBJECT_ID(N'dbo.[Enrollment]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[Enrollment] (
    [id]          NVARCHAR(191) NOT NULL,
    [userId]      NVARCHAR(191) NOT NULL,
    [courseId]    NVARCHAR(191) NOT NULL,
    [status]      NVARCHAR(191) NOT NULL CONSTRAINT DF_Enrollment_status DEFAULT N'PENDING',
    [purchasedAt] DATETIME2     NULL,
    [createdAt]   DATETIME2     NOT NULL CONSTRAINT DF_Enrollment_createdAt DEFAULT SYSUTCDATETIME(),
    [updatedAt]   DATETIME2     NOT NULL CONSTRAINT DF_Enrollment_updatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Enrollment PRIMARY KEY ([id]),
    CONSTRAINT UQ_Enrollment_user_course UNIQUE ([userId], [courseId]),
    CONSTRAINT FK_Enrollment_User FOREIGN KEY ([userId])
      REFERENCES dbo.[User]([id]) ON DELETE CASCADE,
    CONSTRAINT FK_Enrollment_Course FOREIGN KEY ([courseId])
      REFERENCES dbo.[Course]([id]) ON DELETE CASCADE
  );
  CREATE INDEX IX_Enrollment_courseId ON dbo.[Enrollment]([courseId]);
END
GO

/* ========== PAYMENT ========== */
IF OBJECT_ID(N'dbo.[Payment]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[Payment] (
    [id]                  NVARCHAR(191)  NOT NULL,
    [userId]              NVARCHAR(191)  NOT NULL,
    [courseId]            NVARCHAR(191)  NOT NULL,
    [enrollmentId]        NVARCHAR(191)  NULL,
    [amount]              FLOAT          NOT NULL,
    [currency]            NVARCHAR(191)  NOT NULL CONSTRAINT DF_Payment_currency DEFAULT N'ARS',
    [status]              NVARCHAR(191)  NOT NULL CONSTRAINT DF_Payment_status DEFAULT N'PENDING',
    [mpPreferenceId]      NVARCHAR(191)  NULL,
    [mpPaymentId]         NVARCHAR(191)  NULL,
    [mpExternalReference] NVARCHAR(191)  NULL,
    [rawPayload]          NVARCHAR(MAX)  NULL,
    [createdAt]           DATETIME2      NOT NULL CONSTRAINT DF_Payment_createdAt DEFAULT SYSUTCDATETIME(),
    [updatedAt]           DATETIME2      NOT NULL CONSTRAINT DF_Payment_updatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Payment PRIMARY KEY ([id]),
    CONSTRAINT UQ_Payment_mpExternalReference UNIQUE ([mpExternalReference]),
    CONSTRAINT FK_Payment_User FOREIGN KEY ([userId])
      REFERENCES dbo.[User]([id]) ON DELETE CASCADE,
    CONSTRAINT FK_Payment_Course FOREIGN KEY ([courseId])
      REFERENCES dbo.[Course]([id]) ON DELETE NO ACTION,
    CONSTRAINT FK_Payment_Enrollment FOREIGN KEY ([enrollmentId])
      REFERENCES dbo.[Enrollment]([id]) ON DELETE NO ACTION
  );
  CREATE INDEX IX_Payment_userId ON dbo.[Payment]([userId]);
  CREATE INDEX IX_Payment_courseId ON dbo.[Payment]([courseId]);
END
GO

/* ========== LESSON PROGRESS ========== */
IF OBJECT_ID(N'dbo.[LessonProgress]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[LessonProgress] (
    [id]          NVARCHAR(191) NOT NULL,
    [userId]      NVARCHAR(191) NOT NULL,
    [lessonId]    NVARCHAR(191) NOT NULL,
    [watchedSec]  INT           NOT NULL CONSTRAINT DF_LessonProgress_watchedSec DEFAULT 0,
    [completed]   BIT           NOT NULL CONSTRAINT DF_LessonProgress_completed DEFAULT 0,
    [completedAt] DATETIME2     NULL,
    [updatedAt]   DATETIME2     NOT NULL CONSTRAINT DF_LessonProgress_updatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_LessonProgress PRIMARY KEY ([id]),
    CONSTRAINT UQ_LessonProgress_user_lesson UNIQUE ([userId], [lessonId]),
    CONSTRAINT FK_LessonProgress_User FOREIGN KEY ([userId])
      REFERENCES dbo.[User]([id]) ON DELETE CASCADE,
    CONSTRAINT FK_LessonProgress_Lesson FOREIGN KEY ([lessonId])
      REFERENCES dbo.[Lesson]([id]) ON DELETE CASCADE
  );
END
GO

/* ========== EXAM ========== */
IF OBJECT_ID(N'dbo.[Exam]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[Exam] (
    [id]          NVARCHAR(191) NOT NULL,
    [courseId]    NVARCHAR(191) NOT NULL,
    [title]       NVARCHAR(191) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    CONSTRAINT PK_Exam PRIMARY KEY ([id]),
    CONSTRAINT UQ_Exam_courseId UNIQUE ([courseId]),
    CONSTRAINT FK_Exam_Course FOREIGN KEY ([courseId])
      REFERENCES dbo.[Course]([id]) ON DELETE CASCADE
  );
END
GO

/* ========== EXAM QUESTION ========== */
IF OBJECT_ID(N'dbo.[ExamQuestion]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[ExamQuestion] (
    [id]            NVARCHAR(191) NOT NULL,
    [examId]        NVARCHAR(191) NOT NULL,
    [prompt]        NVARCHAR(MAX) NOT NULL,
    [sortOrder]     INT           NOT NULL CONSTRAINT DF_ExamQuestion_sortOrder DEFAULT 0,
    [optionsJson]   NVARCHAR(MAX) NOT NULL,
    [correctOption] INT           NOT NULL,
    CONSTRAINT PK_ExamQuestion PRIMARY KEY ([id]),
    CONSTRAINT FK_ExamQuestion_Exam FOREIGN KEY ([examId])
      REFERENCES dbo.[Exam]([id]) ON DELETE CASCADE
  );
  CREATE INDEX IX_ExamQuestion_examId ON dbo.[ExamQuestion]([examId]);
END
GO

/* ========== EXAM ATTEMPT ========== */
IF OBJECT_ID(N'dbo.[ExamAttempt]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[ExamAttempt] (
    [id]          NVARCHAR(191) NOT NULL,
    [userId]      NVARCHAR(191) NOT NULL,
    [examId]      NVARCHAR(191) NOT NULL,
    [score]       INT           NOT NULL,
    [passed]      BIT           NOT NULL,
    [answersJson] NVARCHAR(MAX) NOT NULL,
    [createdAt]   DATETIME2     NOT NULL CONSTRAINT DF_ExamAttempt_createdAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ExamAttempt PRIMARY KEY ([id]),
    CONSTRAINT FK_ExamAttempt_User FOREIGN KEY ([userId])
      REFERENCES dbo.[User]([id]) ON DELETE CASCADE,
    CONSTRAINT FK_ExamAttempt_Exam FOREIGN KEY ([examId])
      REFERENCES dbo.[Exam]([id]) ON DELETE CASCADE
  );
  CREATE INDEX IX_ExamAttempt_user_exam ON dbo.[ExamAttempt]([userId], [examId]);
END
GO

/* ========== CERTIFICATE ========== */
IF OBJECT_ID(N'dbo.[Certificate]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[Certificate] (
    [id]          NVARCHAR(191)  NOT NULL,
    [code]        NVARCHAR(191)  NOT NULL,
    [userId]      NVARCHAR(191)  NOT NULL,
    [courseId]    NVARCHAR(191)  NOT NULL,
    [issuedAt]    DATETIME2      NOT NULL CONSTRAINT DF_Certificate_issuedAt DEFAULT SYSUTCDATETIME(),
    [pdfPath]     NVARCHAR(1000) NULL,
    [studentName] NVARCHAR(191)  NOT NULL,
    [courseTitle] NVARCHAR(191)  NOT NULL,
    [score]       INT            NOT NULL,
    CONSTRAINT PK_Certificate PRIMARY KEY ([id]),
    CONSTRAINT UQ_Certificate_code UNIQUE ([code]),
    CONSTRAINT UQ_Certificate_user_course UNIQUE ([userId], [courseId]),
    CONSTRAINT FK_Certificate_User FOREIGN KEY ([userId])
      REFERENCES dbo.[User]([id]) ON DELETE CASCADE,
    CONSTRAINT FK_Certificate_Course FOREIGN KEY ([courseId])
      REFERENCES dbo.[Course]([id]) ON DELETE CASCADE
  );
END
GO

PRINT 'Tablas creadas / verificadas en Cusosventas.';
GO
