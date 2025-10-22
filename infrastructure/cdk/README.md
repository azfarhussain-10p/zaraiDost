# Infrastructure as Code - AWS CDK

AWS Cloud Development Kit (CDK) infrastructure for deploying Zarai Dost to AWS.

## Overview

This package contains Infrastructure as Code (IaC) using AWS CDK (TypeScript) to provision and manage all AWS resources needed for Zarai Dost, including Lambda functions, API Gateway, RDS databases, S3 buckets, CloudFront distributions, and more.

## Features

- **Serverless API**: Lambda + API Gateway for backend
- **Database**: RDS PostgreSQL with automatic backups
- **Caching**: ElastiCache Redis cluster
- **Storage**: S3 buckets for images and static assets
- **CDN**: CloudFront for global content delivery
- **Monitoring**: CloudWatch dashboards and alarms
- **CI/CD**: CodePipeline for automated deployments
- **Security**: VPC, security groups, IAM roles
- **Multi-Environment**: Separate stacks for dev, staging, production

## Prerequisites

- Node.js >= 18.0.0
- AWS CLI configured with credentials
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS Account with appropriate permissions

## Installation

```bash
# Install dependencies
pnpm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/REGION
```

## Project Structure

```
infrastructure/cdk/
├── bin/
│   └── app.ts                 # CDK app entry point
├── lib/
│   ├── stacks/                # CDK stacks
│   │   ├── vpc-stack.ts
│   │   ├── database-stack.ts
│   │   ├── cache-stack.ts
│   │   ├── api-stack.ts
│   │   ├── storage-stack.ts
│   │   ├── cdn-stack.ts
│   │   ├── monitoring-stack.ts
│   │   └── pipeline-stack.ts
│   ├── constructs/            # Reusable constructs
│   │   ├── lambda-api.ts
│   │   └── static-site.ts
│   └── config/                # Environment configs
│       ├── dev.ts
│       ├── staging.ts
│       └── prod.ts
├── test/
├── cdk.json                   # CDK configuration
├── tsconfig.json
├── package.json
└── README.md
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CloudFront CDN                          │
│                  (Global Content Delivery)                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────┐        ┌──────▼──────┐
│  S3 Bucket   │        │ API Gateway │
│ (Static Web) │        │ (REST/WS)   │
└──────────────┘        └──────┬──────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ┌───────▼────────┐    ┌──────▼──────┐
            │  Lambda Functions   │  Lambda ML   │
            │  (Node.js API)      │  (Python)    │
            └───────┬────────┘    └──────┬───────┘
                    │                    │
        ┌───────────┴────────────────────┴────────┐
        │                                          │
┌───────▼─────────┐                    ┌──────────▼────────┐
│  RDS PostgreSQL │                    │ ElastiCache Redis │
│  (Multi-AZ)     │                    │   (Cluster)       │
└─────────────────┘                    └───────────────────┘
        │
        │
┌───────▼─────────┐
│   S3 Bucket     │
│ (Images/Data)   │
└─────────────────┘
```

## Configuration

### Environment Variables

Create `.env` files for each environment:

```bash
# .env.production
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
ENVIRONMENT=production

# Database
DB_INSTANCE_CLASS=db.t3.medium
DB_ALLOCATED_STORAGE=100
DB_NAME=zaraidost
DB_USERNAME=admin

# Cache
REDIS_NODE_TYPE=cache.t3.medium
REDIS_NUM_CACHE_NODES=2

# Domain
DOMAIN_NAME=zaraidost.com
API_SUBDOMAIN=api.zaraidost.com
```

## Deployment

### Deploy All Stacks

```bash
# Deploy to development
cdk deploy --all --profile dev

# Deploy to staging
cdk deploy --all --profile staging --context env=staging

# Deploy to production (requires approval)
cdk deploy --all --profile prod --context env=production --require-approval never
```

### Deploy Individual Stacks

```bash
# Deploy only API stack
cdk deploy ZaraiDostApiStack-prod

# Deploy only database
cdk deploy ZaraiDostDatabaseStack-prod
```

### Diff Before Deploy

```bash
# See what will change
cdk diff --all --context env=production
```

## Stack Details

### VPC Stack

```typescript
// lib/stacks/vpc-stack.ts
export class VpcStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'ZaraiDostVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
  }
}
```

### Database Stack

```typescript
// lib/stacks/database-stack.ts
export class DatabaseStack extends Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.database = new rds.DatabaseInstance(this, 'PostgreSQL', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_7,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      allocatedStorage: 100,
      storageEncrypted: true,
      multiAz: true,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(7),
      deletionProtection: true,
    });
  }
}
```

### API Stack (Lambda + API Gateway)

```typescript
// lib/stacks/api-stack.ts
export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda function
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../../apps/api/dist'),
      environment: {
        DATABASE_URL: props.database.secret?.secretValueFromJson('connectionString').toString()!,
        REDIS_URL: props.cache.attrRedisEndpointAddress,
      },
      vpc: props.vpc,
      timeout: Duration.seconds(30),
      memorySize: 1024,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ZaraiDostApi', {
      restApiName: 'Zarai Dost API',
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
      },
    });

    api.root.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(apiHandler),
    });
  }
}
```

### Storage Stack (S3)

```typescript
// lib/stacks/storage-stack.ts
export class StorageStack extends Stack {
  public readonly imagesBucket: s3.Bucket;
  public readonly staticBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Images bucket
    this.imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `zaraidost-images-${props.env?.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(30),
            },
          ],
        },
      ],
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Static website bucket
    this.staticBucket = new s3.Bucket(this, 'StaticBucket', {
      bucketName: `zaraidost-web-${props.env?.account}`,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });
  }
}
```

### CDN Stack (CloudFront)

```typescript
// lib/stacks/cdn-stack.ts
export class CdnStack extends Stack {
  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props);

    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(props.staticBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [props.domainName],
      certificate: props.certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });
  }
}
```

### Monitoring Stack

```typescript
// lib/stacks/monitoring-stack.ts
export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'ZaraiDost-Metrics',
    });

    // API metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [props.apiFunction.metricInvocations()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [props.apiFunction.metricErrors()],
      })
    );

    // Alarms
    new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      metric: props.apiFunction.metricErrors(),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when API errors exceed threshold',
    });
  }
}
```

## Cost Estimation

### Development Environment

- Lambda: ~$10/month
- RDS (t3.micro): ~$15/month
- ElastiCache (t3.micro): ~$12/month
- S3: ~$5/month
- Data Transfer: ~$10/month
- **Total: ~$52/month**

### Production Environment

- Lambda: ~$100/month
- RDS (t3.medium, Multi-AZ): ~$150/month
- ElastiCache (t3.medium, cluster): ~$100/month
- S3: ~$50/month
- CloudFront: ~$100/month
- Data Transfer: ~$200/month
- **Total: ~$700/month**

## Destroy Infrastructure

```bash
# Destroy all stacks
cdk destroy --all --context env=dev

# Destroy specific stack
cdk destroy ZaraiDostApiStack-dev
```

**⚠️ Warning**: This will delete all resources and data!

## Best Practices

- Use separate AWS accounts for dev/staging/prod
- Enable CloudTrail for audit logging
- Implement least-privilege IAM policies
- Use AWS Secrets Manager for sensitive data
- Enable VPC Flow Logs
- Regular backup testing
- Cost monitoring with AWS Budgets

## Troubleshooting

**CDK bootstrap fails**
```bash
# Ensure AWS credentials are configured
aws sts get-caller-identity

# Bootstrap with specific account/region
cdk bootstrap aws://123456789012/us-east-1
```

**Stack deployment fails**
- Check CloudFormation console for detailed errors
- Verify IAM permissions
- Check resource limits in your AWS account

**Database connection issues**
- Ensure Lambda is in same VPC
- Check security group rules
- Verify database credentials in Secrets Manager

## Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## License

MIT - See [LICENSE](../../LICENSE)
