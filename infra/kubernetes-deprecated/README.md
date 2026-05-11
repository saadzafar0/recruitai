# Kubernetes / EKS manifests (deprecated)

These YAML files were written for **AWS EKS**, **ALB Ingress**, and **ClusterIP** services. They are **not** the recommended deployment path anymore.

**Current plan:** two EC2 instances, Docker Compose, and optional Redis on the workers host — see [docs/deployment-ec2-docker.md](../../docs/deployment-ec2-docker.md).

You may still apply these manifests for legacy clusters; replace image namespaces, secrets, and external endpoints (`REDIS_URL`, Judge0, Supabase) before use.
