import { AmplifyAuthCognitoStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyAuthCognitoStackTemplate) {
  const userTypeAttribute = {
    attributeDataType: 'String',
    developerOnlyAttribute: false,
    mutable: true,
    name: 'user_type',
    // todo: make this required?
    required: false,
  }
  const identityIdAttribute = {
    attributeDataType: 'String',
    developerOnlyAttribute: false,
    mutable: true,
    name: 'identity_id',
    // todo: make this required?
    required: false,
  }

  resources.userPool.schema = [
    ...(resources.userPool.schema as any[]), // Carry over existing attributes (example: email)
    userTypeAttribute,
    identityIdAttribute
  ]

  resources.userPoolClient.readAttributes = [ //set readable attributes
    "email",
    'family_name',
    'given_name',
    "custom:identity_id",
    "custom:user_type",
  ];

  resources.userPoolClient.writeAttributes = [ //set readable attributes
    "email",
    'family_name',
    'given_name',
    "custom:identity_id",
    "custom:user_type",
  ];
}
