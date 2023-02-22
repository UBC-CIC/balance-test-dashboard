CREATE TABLE "TestEvent" (
  "test_event_id" varchar PRIMARY KEY,
  "patient_id" varchar NOT NULL,
  "test_type" varchar NOT NULL,
  "if_completed" boolean NOT NULL,
  "balance_score" integer,
  "doctor_score" integer,
  "notes" text,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL
);

CREATE TABLE "Patient" (
  "patient_id" varchar PRIMARY KEY,
  "name" varchar NOT NULL,
  "email" varchar UNIQUE NOT NULL
);

CREATE TABLE "CareProvider" (
  "care_provider_id" varchar PRIMARY KEY,
  "email" varchar UNIQUE NOT NULL
);

CREATE TABLE "PatientCareProvider" (
  "care_provider_id" varchar NOT NULL,
  "patient_id" varchar NOT NULL,
  PRIMARY KEY ("care_provider_id", "patient_id")
);

CREATE TABLE "Test" (
  "test_type" varchar PRIMARY KEY,
  "instructions" text,
  "duration_in_seconds" integer
);

ALTER TABLE "PatientCareProvider" ADD FOREIGN KEY ("patient_id") REFERENCES "Patient" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientCareProvider" ADD FOREIGN KEY ("care_provider_id") REFERENCES "CareProvider" ("care_provider_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestEvent" ADD FOREIGN KEY ("patient_id") REFERENCES "Patient" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestEvent" ADD FOREIGN KEY ("test_type") REFERENCES "Test" ("test_type") ON DELETE NO ACTION ON UPDATE CASCADE;
