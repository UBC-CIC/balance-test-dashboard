import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { NatProvider } from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

//TODO: double check configuration
export class VPCStack extends Stack {

    public readonly vpc: ec2.Vpc;
    public readonly cidrStr: string;
    private readonly destinationCidrStr: string;

    constructor(scope: App, id: string, props?: StackProps) {
      super(scope, id, props);
      
      const vpcName = "balanceTest-VPC";
      this.cidrStr = '11.0.0.0/16';
      this.destinationCidrStr = '13.0.0.0/16';

      const natGatewayProvider = ec2.NatProvider.gateway();
      
      // Make VPC with NAT Gateway and S3 Endpoint
      this.vpc = new ec2.Vpc(this, vpcName, {
        vpcName: vpcName,
        ipAddresses: ec2.IpAddresses.cidr(this.cidrStr),
        maxAzs: 2,
        natGatewayProvider: natGatewayProvider,
        natGateways: 1,
        subnetConfiguration: [
          {
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC
          },
          {
            name: 'private',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
        gatewayEndpoints: {
          S3: {
            service: ec2.GatewayVpcEndpointAwsService.S3, //add endpoint within S3 as well
            subnets: [{
              subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            }]
          }
        },
      });

      // make security group
      const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, this.vpc.vpcDefaultSecurityGroup);

      // RDS endpoint for VPC
      this.vpc.addInterfaceEndpoint("RDS-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.RDS,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      // CloudWatch Logs Endpoint for VPC
      this.vpc.addInterfaceEndpoint("Cloudwatch-Logs-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      // Sagemaker Endpoints for VPC
      this.vpc.addInterfaceEndpoint("Sagemaker-API-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_API,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      this.vpc.addInterfaceEndpoint("Sagemaker-Runtime-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_RUNTIME,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      // Making endpoints to access Systems Manager for VPC; mainly for accessing Parameter Store
      this.vpc.addInterfaceEndpoint("Systems-Manager-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.SSM,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      this.vpc.addInterfaceEndpoint("EC2-Messages-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      this.vpc.addInterfaceEndpoint("EC2-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.EC2,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      // Secrets Manager endpoint for VPC
      this.vpc.addInterfaceEndpoint("Secrets-Manager-Endpoint", {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      this.vpc.isolatedSubnets.forEach(({routeTable: { routeTableId }}, index) => {
        new ec2.CfnRoute(this, "Route-Private-" + index, {
          destinationCidrBlock: this.destinationCidrStr,
          routeTableId,
          natGatewayId: natGatewayProvider.configuredGateways[0].gatewayId
        })
      });
    }

}