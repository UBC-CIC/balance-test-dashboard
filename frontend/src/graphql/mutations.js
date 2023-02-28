/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPatient = /* GraphQL */ `
  mutation CreatePatient($patient_id: String!, $email: String, $name: String) {
    createPatient(patient_id: $patient_id, email: $email, name: $name) {
      patient_id
      name
      email
    }
  }
`;
export const createCareProvider = /* GraphQL */ `
  mutation CreateCareProvider($care_provider_id: String!, $email: String!) {
    createCareProvider(care_provider_id: $care_provider_id, email: $email) {
      care_provider_id
      email
    }
  }
`;
export const addPatientToCareProvider = /* GraphQL */ `
  mutation AddPatientToCareProvider(
    $care_provider_id: String!
    $patient_id: String!
  ) {
    addPatientToCareProvider(
      care_provider_id: $care_provider_id
      patient_id: $patient_id
    ) {
      patient_id
      care_provider_id
    }
  }
`;
export const createAndAssignTest = /* GraphQL */ `
  mutation CreateAndAssignTest(
    $test_event_id: String!
    $patient_id: String!
    $test_type: String!
    $notes: String
  ) {
    createAndAssignTest(
      test_event_id: $test_event_id
      patient_id: $patient_id
      test_type: $test_type
      notes: $notes
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
export const putTestResult = /* GraphQL */ `
  mutation PutTestResult(
    $test_event_id: String!
    $balance_score: Int
    $doctor_score: Int
    $start_time: String
    $end_time: String
    $if_completed: Boolean
  ) {
    putTestResult(
      test_event_id: $test_event_id
      balance_score: $balance_score
      doctor_score: $doctor_score
      start_time: $start_time
      end_time: $end_time
      if_completed: $if_completed
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
export const test = /* GraphQL */ `
  mutation Test {
    test
  }
`;
