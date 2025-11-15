import time
from collections import defaultdict, deque
from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache
import hashlib
import ipaddress


class RateLimitMiddleware:
    """
    Simple rate limiting middleware using Django cache
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Rate limiting configuration
        self.rate_limits = {
            'read': {'requests': 100, 'window': 60},  # 100 requests per minute for GET
            'write': {'requests': 20, 'window': 60},  # 20 requests per minute for POST/PUT/DELETE
            'stats': {'requests': 30, 'window': 60},  # 30 requests per minute for stats endpoint
        }
        
        # Exempt IPs (can be configured via settings)
        self.exempt_ips = getattr(settings, 'RATE_LIMIT_EXEMPT_IPS', ['127.0.0.1', '::1'])

    def __call__(self, request):
        # Skip rate limiting for exempt IPs
        client_ip = self.get_client_ip(request)
        if self.is_exempt_ip(client_ip):
            response = self.get_response(request)
            return response
            
        # Skip rate limiting for non-API endpoints
        if not request.path.startswith('/api/'):
            response = self.get_response(request)
            return response
            
        # Determine rate limit category
        rate_limit_key = self.get_rate_limit_key(request)
        limit_config = self.rate_limits.get(rate_limit_key, self.rate_limits['read'])
        
        # Check rate limit
        if not self.is_allowed(client_ip, rate_limit_key, limit_config):
            return self.rate_limit_response(limit_config)
        
        response = self.get_response(request)
        
        # Add rate limit headers to response
        self.add_rate_limit_headers(response, client_ip, rate_limit_key, limit_config)
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    def is_exempt_ip(self, ip):
        """Check if IP is in exempt list"""
        try:
            client_ip = ipaddress.ip_address(ip)
            for exempt_ip in self.exempt_ips:
                if ipaddress.ip_address(exempt_ip) == client_ip:
                    return True
        except ValueError:
            pass
        return False
    
    def get_rate_limit_key(self, request):
        """Determine which rate limit category to apply"""
        if request.path.endswith('/stats/'):
            return 'stats'
        elif request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return 'write'
        else:
            return 'read'
    
    def get_cache_key(self, client_ip, category):
        """Generate cache key for rate limiting"""
        key_data = f"rate_limit:{client_ip}:{category}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def is_allowed(self, client_ip, category, limit_config):
        """Check if request is allowed based on rate limit"""
        cache_key = self.get_cache_key(client_ip, category)
        current_time = int(time.time())
        window_start = current_time - limit_config['window']
        
        # Get current request timestamps from cache
        request_times = cache.get(cache_key, [])
        
        # Remove old requests outside the window
        request_times = [t for t in request_times if t > window_start]
        
        # Check if we're under the limit
        if len(request_times) >= limit_config['requests']:
            return False
        
        # Add current request time
        request_times.append(current_time)
        
        # Update cache with new timestamps
        cache.set(cache_key, request_times, limit_config['window'] + 10)  # Small buffer
        
        return True
    
    def add_rate_limit_headers(self, response, client_ip, category, limit_config):
        """Add rate limit information to response headers"""
        cache_key = self.get_cache_key(client_ip, category)
        current_time = int(time.time())
        window_start = current_time - limit_config['window']
        
        request_times = cache.get(cache_key, [])
        request_times = [t for t in request_times if t > window_start]
        
        remaining = max(0, limit_config['requests'] - len(request_times))
        reset_time = window_start + limit_config['window']
        
        response['X-RateLimit-Limit'] = str(limit_config['requests'])
        response['X-RateLimit-Remaining'] = str(remaining)
        response['X-RateLimit-Reset'] = str(reset_time)
        response['X-RateLimit-Window'] = str(limit_config['window'])
        
        return response
    
    def rate_limit_response(self, limit_config):
        """Return rate limit exceeded response"""
        return JsonResponse({
            'error': 'Rate limit exceeded',
            'message': f'Too many requests. Limit: {limit_config["requests"]} per {limit_config["window"]} seconds',
            'retry_after': limit_config['window']
        }, status=429)


class RequestLoggingMiddleware:
    """
    Middleware to log API requests with performance metrics
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip logging for non-API endpoints
        if not request.path.startswith('/api/'):
            return self.get_response(request)
            
        start_time = time.time()
        
        # Process request
        response = self.get_response(request)
        
        # Calculate request duration
        duration = time.time() - start_time
        
        # Log request details
        self.log_request(request, response, duration)
        
        # Add performance headers
        response['X-Response-Time'] = f"{duration:.3f}s"
        
        return response
    
    def log_request(self, request, response, duration):
        """Log request details"""
        import logging
        
        logger = logging.getLogger('jobs.api')
        
        client_ip = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        
        log_data = {
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'client_ip': client_ip,
            'user_agent': user_agent[:100],  # Truncate user agent
            'query_params': dict(request.GET),
        }
        
        # Log as structured data
        if response.status_code >= 400:
            logger.warning(f"API Request: {log_data}")
        else:
            logger.info(f"API Request: {log_data}")
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip