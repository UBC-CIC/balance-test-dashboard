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
export const getPatients = /* GraphQL */ `
  query GetPatients($care_provider_id: String!) {
    getPatients(care_provider_id: $care_provider_id) {
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
    $start_time: AWSDateTime
    $end_time: AWSDateTime
    $if_completed: Boolean
    $sort: SortDirection
    $count: Int
  ) {
    getTestEvents(
      patient_id: $patient_id
      test_type: $test_type
      start_time: $start_time
      end_time: $end_time
      if_completed: $if_completed
      sort: $sort
      count: $count
    ) {
      test_event_id
      patient_id
      test_type
      if_completed
      balance_score
      doctor_score
      notes
      start_time
      end_time
    }
  }
`;
export const getWeeklyAverageBalanceScore = /* GraphQL */ `
  query GetWeeklyAverageBalanceScore($patientId: String!) {
    getWeeklyAverageBalanceScore(patientId: $patientId)
  }
`;
