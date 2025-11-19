#!/bin/bash

set -e

echo "🚀 Deploying Job Dashboard to Kubernetes"

# Build and tag Docker images (you'll need to push these to your registry)
echo "📦 Building Docker images..."
docker build -t compute-jobs-dashboard-backend:latest ./backend
docker build -t compute-jobs-dashboard-frontend:latest ./frontend

echo "⚠️  Note: You need to push these images to your container registry:"
echo "   docker tag compute-jobs-dashboard-backend:latest your-registry/compute-jobs-dashboard-backend:latest"
echo "   docker push your-registry/compute-jobs-dashboard-backend:latest"
echo "   docker tag compute-jobs-dashboard-frontend:latest your-registry/compute-jobs-dashboard-frontend:latest"  
echo "   docker push your-registry/compute-jobs-dashboard-frontend:latest"
echo ""

# Apply Kubernetes manifests
echo "🔧 Applying Kubernetes manifests..."

kubectl apply -f k8s/namespace.yaml

echo "📊 Creating secrets and config maps..."
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/frontend-configmap.yaml

echo "💾 Creating persistent volumes..."
kubectl apply -f k8s/postgres-pvc.yaml

echo "🗄️ Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-deployment.yaml

echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n job-dashboard

echo "🔧 Deploying backend..."
kubectl apply -f k8s/backend-deployment.yaml

echo "⏳ Waiting for backend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n job-dashboard

echo "🎨 Deploying frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

echo "⏳ Waiting for frontend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n job-dashboard

echo "🌐 Creating ingress..."
kubectl apply -f k8s/ingress.yaml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "   kubectl get pods -n job-dashboard                    # Check pod status"
echo "   kubectl get services -n job-dashboard                # Check services"
echo "   kubectl logs -f deployment/backend -n job-dashboard  # Backend logs"
echo "   kubectl logs -f deployment/frontend -n job-dashboard # Frontend logs"
echo "   kubectl port-forward svc/frontend-service 5173:5173 -n job-dashboard  # Local access"
echo ""
echo "🌍 If using ingress, add this to your /etc/hosts:"
echo "   <YOUR_INGRESS_IP> job-dashboard.local"
echo ""
echo "🔧 To seed the database with test data:"
echo "   kubectl exec -it deployment/backend -n job-dashboard -- python manage.py seed_test_data --clear --count 50"