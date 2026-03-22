### Phase 1: Local AWS CLI Setup

* [x] Created an IAM User (`saad-devops-admin`) in the AWS Console with `AdministratorAccess`.
* [x] Generated CLI Access Keys for that user.
* [x] Installed `aws-cli`, `kubectl`, and `eksctl` on the Arch Linux machine.
* [x] Ran `aws configure` locally and added Access Keys and default region (`ap-south-1`).

### Phase 2: VPC & Networking (AWS Console)

* [x] Created a new VPC (`recruitai-vpc`) using the "VPC and more" option.
* [x] Configured it with 2 Availability Zones, 2 Public Subnets, and 2 Private Subnets.
* [x] Enabled a **Regional NAT Gateway** (so private nodes could reach the internet).
* [x] Enabled an **S3 VPC Endpoint** (so workers could download CVs for free).

### Phase 3: EKS Cluster & Nodes (AWS Console)

* [x] Created an EKS Cluster (`recruitai-cluster`) using **EKS Auto Mode** to automatically generate the required IAM Cluster Role.
* [x] Attached the cluster to the `recruitai-vpc` and its subnets.
* [x] After the cluster became "Active", created a Managed Node Group (`standard-workers`).
* [x] Configured the Node Group to use **2x `t3.medium`** instances placed strictly in the **Private** subnets.

### Phase 4: Kubernetes Authentication (Terminal)

* [x] Linked the local terminal to the cluster using:
  `aws eks update-kubeconfig --region ap-south-1 --name recruitai-cluster`
* [x] Fixed the RBAC authorization block by associating the IAM user with the ClusterAdmin policy:

  ```bash
  aws eks associate-access-policy \
    --region ap-south-1 \
    --cluster-name recruitai-cluster \
    --principal-arn arn:aws:iam::858714464726:user/saad-devops-admin \
    --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
    --access-scope type=cluster
  ```
* [x] Verified full access by running `kubectl get nodes`.

### Phase 5: Judge0 Execution Engine (Standalone EC2)

* [x] Launched a new Ubuntu EC2 instance (`judge0-execution-server`).
* [x] Set the EBS Volume storage to **30 GB** to avoid storage issues.
* [x] Configured the Security Group to allow inbound traffic on ports **22** (SSH), **80** (HTTP), and **2358** (Judge0 API).
* [x] Connected via SSH and installed Docker and Docker Compose.
* [x] Downloaded the Judge0 v1.13.1 release.
* [x] Generated secure database passwords inside `judge0.conf`.
* [x] Ran `docker-compose up -d` and waited for all executor images to initialize.
* [x] Use image: mrkushalsm/judge0:latest instead of original one because of security issues.


### Phase 6: Next.js API Bridge (Local Codebase)

* [x] Created the test endpoint at `services/nextjs-web/src/pages/api/v1/webhooks/judge0-test.ts`.
* [x] Implemented fetch logic to send a hardcoded `console.log("Hello World")` script to the EC2 instance on port `2358`.
* [x] Ran the Next.js app locally and triggered the endpoint to successfully compile remote code in the AWS sandbox.
