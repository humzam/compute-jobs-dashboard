# Kubernetes Deployment for Job Dashboard

This directory contains Kubernetes manifests to deploy the Job Dashboard application.

## Prerequisites

- Kubernetes cluster (local or cloud)
- kubectl configured to connect to your cluster
- Docker for building images
- Container registry (Docker Hub, GCR, ECR, etc.) for hosting images

## Quick Start

1. **Build and push images to your registry:**
```bash
# Build images
docker build -t your-registry/compute-jobs-dashboard-backend:latest ./backend
docker build -t your-registry/compute-jobs-dashboard-frontend:latest ./frontend

# Push to registry
docker push your-registry/compute-jobs-dashboard-backend:latest
docker push your-registry/compute-jobs-dashboard-frontend:latest
```

2. **Update image references in deployment files:**
   - Edit `k8s/backend-deployment.yaml` line 47: `image: your-registry/compute-jobs-dashboard-backend:latest`
   - Edit `k8s/frontend-deployment.yaml` line 22: `image: your-registry/compute-jobs-dashboard-frontend:latest`

3. **Deploy to Kubernetes:**
```bash
./k8s/deploy.sh
```

## Manual Deployment

If you prefer to deploy manually:

```bash
# Create namespace and secrets
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/backend-secret.yaml

# Create config maps
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/frontend-configmap.yaml

# Create storage
kubectl apply -f k8s/postgres-pvc.yaml

# Deploy services
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Create ingress
kubectl apply -f k8s/ingress.yaml
```

## Configuration

### Secrets
- **postgres-secret**: Database credentials
- **backend-secret**: Django secret key and database password

### ConfigMaps
- **backend-config**: Backend environment variables
- **frontend-config**: Frontend environment variables

### Ingress
The ingress is configured for `job-dashboard.local`. To use:
1. Get your ingress controller IP: `kubectl get ingress -n job-dashboard`
2. Add to `/etc/hosts`: `<INGRESS_IP> job-dashboard.local`
3. Access at: `http://job-dashboard.local`

## Scaling

Scale deployments as needed:
```bash
kubectl scale deployment backend --replicas=3 -n job-dashboard
kubectl scale deployment frontend --replicas=3 -n job-dashboard
```

## Monitoring

Check deployment status:
```bash
kubectl get pods -n job-dashboard
kubectl get services -n job-dashboard
kubectl get ingress -n job-dashboard
```

View logs:
```bash
kubectl logs -f deployment/backend -n job-dashboard
kubectl logs -f deployment/frontend -n job-dashboard
kubectl logs -f deployment/postgres -n job-dashboard
```

## Database Management

Seed database with test data:
```bash
kubectl exec -it deployment/backend -n job-dashboard -- python manage.py seed_test_data --clear --count 50
```

Access database directly:
```bash
kubectl exec -it deployment/postgres -n job-dashboard -- psql -U postgres -d job_dashboard
```

## Cleanup

To remove the entire deployment:
```bash
kubectl delete namespace job-dashboard
```