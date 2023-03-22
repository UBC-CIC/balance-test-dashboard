/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getCareproviderById = /* GraphQL */ `
  query GetCareproviderById($care_provider_id: String!) {
    getCareproviderById(care_provider_id: $care_provider_id) {
      care_provider_id
      email
    }
  }
`;
export const getPatientById = /* GraphQL */ `
  query GetPatientById($patient_id: String!) {
    getPatientById(patient_id: $patient_id) {
      patient_id
      name
      email
    }
  }
`;
export const getTestEventById = /* GraphQL */ `
  query GetTestEventById($test_event_id: String!, $patient_id: String!) {
    getTestEventById(test_event_id: $test_event_id, patient_id: $patient_id) {
      test_event_id
      patient_id
      test_type
      balance_score
      doctor_score
      notes
      start_time
      end_time
    }
  }
`;
export const getPatientsForCareprovider = /* GraphQL */ `
  query GetPatientsForCareprovider($care_provider_id: String!) {
    getPatientsForCareprovider(care_provider_id: $care_provider_id) {
      patient_id
      name
      email
    }
  }
`;
export const getAllPatients = /* GraphQL */ `
  query GetAllPatients {
    getAllPatients {
      patient_id
      name
      email
    }
  }
`;
export const getTestEvents = /* GraphQL */ `
  query GetTestEvents(
    $patient_id: String!
    $test_type: String
    $from_time: String
    $to_time: String
    $sort: SortDirection
    $count: Int
  ) {
    getTestEvents(
      patient_id: $patient_id
      test_type: $test_type
      from_time: $from_time
      to_time: $to_time
      sort: $sort
      count: $count
    ) {
      test_event_id
      patient_id
      test_type
      balance_score
      doctor_score
      notes
      start_time
      end_time
    }
  }
`;
export const getPatientAssignedTests = /* GraphQL */ `
  query GetPatientAssignedTests($patient_id: String!) {
    getPatientAssignedTests(patient_id: $patient_id) {
      test_type
      instructions
      duration_in_seconds
    }
  }
`;
export const getAllAvailableTests = /* GraphQL */ `
  query GetAllAvailableTests {
    getAllAvailableTests {
      test_type
      instructions
      duration_in_seconds
    }
  }
`;
export const getScoreStatsOverTime = /* GraphQL */ `
  query GetScoreStatsOverTime(
    $patient_id: String!
    $from_time: String!
    $to_time: String!
    $stat: Stat!
    $movement: String
  ) {
    getScoreStatsOverTime(
      patient_id: $patient_id
      from_time: $from_time
      to_time: $to_time
      stat: $stat
      movement: $movement
    )
  }
`;
export const getMeasurementRange = /* GraphQL */ `
  query GetMeasurementRange($patient_id: String!, $measurement: Measurement!) {
    getMeasurementRange(patient_id: $patient_id, measurement: $measurement) {
      min
      max
      year
      month
      day
      movement
    }
  }
`;
export const getMeasurementData = /* GraphQL */ `
  query GetMeasurementData(
    $test_event_id: String!
    $test_type: String!
    $measurement: Measurement!
    $patient_id: String!
    $year: Int!
    $month: Int!
    $day: Int!
  ) {
    getMeasurementData(
      test_event_id: $test_event_id
      test_type: $test_type
      measurement: $measurement
      patient_id: $patient_id
      year: $year
      month: $month
      day: $day
    ) {
      ts
      val
    }
  }
`;
export const downloadTestEventDetails = /* GraphQL */ `
  query DownloadTestEventDetails(
    $test_event_id: String!
    $patient_id: String!
    $year: Int!
    $month: Int!
    $day: Int!
    $patient_name: String
    $test_type: String!
  ) {
    downloadTestEventDetails(
      test_event_id: $test_event_id
      patient_id: $patient_id
      year: $year
      month: $month
      day: $day
      patient_name: $patient_name
      test_type: $test_type
    )
  }
`;
