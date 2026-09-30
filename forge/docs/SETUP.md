# AWS Widgets setup and testing guide

AWS Widgets shows a read-only card for one AWS resource on a Confluence page.
It supports EC2 instances, S3 buckets, Lambda functions, ECS clusters, and
DynamoDB tables.

Setup has two parts. A Confluence administrator stores one AWS credential for
the site, then a page author adds the macro and names the resource to display.

## 1. Prepare a read-only AWS identity

Create a dedicated IAM user for AWS Widgets. Do not reuse a personal or
administrator access key.

1. In the AWS console, open **IAM → Policies → Create policy → JSON** and paste
   [`aws-read-only-policy.json`](aws-read-only-policy.json). Name it, for
   example, `aws-widgets-read-only`.
2. Open **IAM → Users → Create user**. Do not grant console access. Attach the
   policy from step 1 directly to the user.
3. Open the user, then **Security credentials → Create access key**. Choose
   **Application running outside AWS**. Copy the access key ID and the secret
   access key; AWS shows the secret once.

The policy grants metadata reads only. The app does not create, update,
delete, or invoke anything, and it does not read S3 objects or DynamoDB items.

| Resource type | AWS actions used |
|---|---|
| Credential check on save | `sts:GetCallerIdentity` |
| EC2 | `ec2:DescribeInstances` |
| S3 | `s3:GetBucketPolicyStatus`, `s3:GetEncryptionConfiguration`, `s3:GetLifecycleConfiguration`, `s3:GetBucketTagging` |
| Lambda | `lambda:GetFunction`, `lambda:ListTags` |
| ECS | `ecs:DescribeClusters` |
| DynamoDB | `dynamodb:DescribeTable` |

## 2. Store the credential (Confluence administrator)

1. In Confluence, open **Confluence administration** from the gear icon.
2. In the sidebar, open **AWS Widgets settings**. The **Jump to setting…**
   search finds it by name.
3. Enter the **Access key ID** and **Secret access key** from part 1.
4. Select **Save credential**. The app validates the key with AWS before it
   stores it. The status line changes to **Credential saved**.

One credential is held per Confluence site. Saving again replaces it, and
**Delete credential** removes it. The stored secret stays in Forge secret
storage and is never loaded back into the page.

## 3. Add the macro to a page (page author)

1. Edit a Confluence page, type `/AWS Widgets Resource`, and select the macro.
2. In the **AWS resource** dialog, set:
   - **Region** — the AWS region that holds the resource.
   - **Service** — EC2, S3, Lambda, ECS, or DynamoDB.
   - **Resource ID or name** — the exact identifier, in one of the formats
     below. The app does not list or search resources.
3. Select **Save resource**, then publish the page.

| Service | Accepted identifier | Example |
|---|---|---|
| EC2 | Instance ID | `i-0123456789abcdef0` |
| S3 | Bucket name or bucket ARN | `example-bucket` or `arn:aws:s3:::example-bucket` |
| Lambda | Function name or function ARN | `example-function` |
| ECS | Cluster name or cluster ARN | `example-cluster` |
| DynamoDB | Table name or table ARN | `example-table` |

An ARN must belong to the selected region.

## 4. What the macro shows

The published page shows a card with the resource name, its region, and the
time the data was read. **Refresh** reads the resource again.

| Service | Fields |
|---|---|
| EC2 | Instance ID, state, instance type, root device type, availability zone, key name, IAM instance profile, security groups, private IP, public DNS, tags |
| S3 | Bucket name, public policy, default encryption, lifecycle rules, tags |
| Lambda | Function name, runtime, execution role, last update status, tags |
| ECS | Cluster name, status |
| DynamoDB | Table name, table status, item count |

A field is omitted when AWS returns no value for it.

## Messages and what they mean

| Message | Cause | Fix |
|---|---|---|
| The AWS credential is not configured. | No credential is stored for the site. | Complete part 2. |
| The AWS credential is invalid or expired. | AWS rejected the access key. | Save a current key in AWS Widgets settings. |
| AWS denied access to this resource. | The IAM user lacks a read action for that service. | Attach the policy from part 1. |
| The AWS resource was not found in this region. | The identifier or the region is wrong. | Edit the macro and correct both. |
| The resource configuration is invalid. | The identifier does not match an accepted format. | Edit the macro and use a format from part 3. |
| AWS is limiting requests. | AWS throttled the request. | Select **Try again**. |

## Moving from the Connect version

Credentials and macro settings from the Connect version are not carried over.
See the [migration guide](FORGE-MIGRATION-GUIDE.md).
