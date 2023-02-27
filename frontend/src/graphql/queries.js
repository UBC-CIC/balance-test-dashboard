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
    $from_time: AWSDateTime
    $to_time: AWSDateTime
    $if_completed: Boolean
    $sort: SortDirection
    $count: Int
  ) {
    getTestEvents(
      patient_id: $patient_id
      test_type: $test_type
      from_time: $from_time
      to_time: $to_time
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
export const getAverageBalanceScore = /* GraphQL */ `
  query GetAverageBalanceScore($patientId: String!, $numDays: Int!) {
    getAverageBalanceScore(patientId: $patientId, numDays: $numDays)
  }
`;
