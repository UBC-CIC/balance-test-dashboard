import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { NatProvider } from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

//TODO: add/change security groups, route tables, subnets, etc
export class VPCStack extends Stack {

    public readonly vpc: ec2.Vpc;
    public readonly cidrStr: string;
    // public readonly vpcPermissions: 

    constructor(scope: App, id: string, props?: StackProps) {
      super(scope, id, props);
      
      const vpcName = "balanceTest-VPC";
      const rdsEndpointName = "RDS-Endpoint";
      const cloudwatchEndpointName = "CloudWatch-Logs-Endpoint";
      this.cidrStr = '10.1.0.0/16';

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
            name: 'public-subnet',
            subnetType: ec2.SubnetType.PUBLIC
          },
          {
            name: 'private-subnet',
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
      // this.vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);

      // make security group
      const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, this.vpc.vpcDefaultSecurityGroup);

      // RDS endpoint for VPC
      this.vpc.addInterfaceEndpoint(rdsEndpointName, {
        service: ec2.InterfaceVpcEndpointAwsService.RDS,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      // CloudWatch Logs Endpoint for VPC
      this.vpc.addInterfaceEndpoint(cloudwatchEndpointName, {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      });

      // Add routes; deploy to see if I need this
      this.vpc.isolatedSubnets.forEach(({routeTable: { routeTableId }}, index) => {
        new ec2.CfnRoute(this, "Private-Subnet-Route" + index, {
          destinationCidrBlock: '10.0.0.0/16',
          routeTableId,
          natGatewayId: natGatewayProvider.configuredGateways[0].gatewayId
        })
      });
    }

    
  }