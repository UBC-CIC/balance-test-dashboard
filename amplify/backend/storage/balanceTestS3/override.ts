import { AmplifyS3ResourceTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyS3ResourceTemplate) {
    // todo: make an iam role to retain deletion
    // resources.s3Bucket.deletionPolicy= "Retain"
    resources.s3Bucket.publicAccessBlockConfiguration={
        // todo: double check
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
    }
    resources.s3Bucket.versioningConfiguration={
        status:'Enabled'
    }
    resources.s3Bucket.bucketEncryption={
        "serverSideEncryptionConfiguration": [
            {
                "serverSideEncryptionByDefault": {
                    "sseAlgorithm": "AES256",
                    // "KMSMasterKeyID": "KMS-KEY-ARN"
                }
            }
        ]
}
    resources.s3Bucket.ownershipControls={
        "rules": [
            {
                "objectOwnership": "BucketOwnerEnforced"
            }
        ]
    }


}
