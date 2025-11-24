from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.utils import timezone
from .models import AppUser, OTPVerification, Pharmacy, Medicine, Order, Payment
from .serializers import AppUserSerializer
from django.db.models import Sum, Count, Q
from datetime import timedelta


# ===========================
# ADMIN AUTHENTICATION WITH 2FA
# ===========================

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login_request_otp(request):
    """
    Étape 1: L'admin demande un OTP
    Vérifie les credentials et envoie un code OTP par email
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'utilisateur existe
        try:
            user = AppUser.objects.get(email=email)
        except AppUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Vérifier le mot de passe
        if not user.check_password(password):
            return Response({
                'success': False,
                'message': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Vérifier que l'utilisateur est admin
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Créer un code OTP
        otp = OTPVerification.create_otp(user)
        
        # Envoyer l'email avec le code OTP
        try:
            send_mail(
                subject='MedEx Admin - Verification Code',
                message=f'''
Hello {user.first_name},

Your verification code is: {otp.otp_code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
MedEx Team
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'success': True,
                'message': 'Verification code sent to your email.',
                'email': user.email,
                'expires_in': '10 minutes'
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            print(f"Email sending error: {email_error}")
            return Response({
                'success': False,
                'message': 'Failed to send verification code. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        print(f"Admin login OTP request error: {e}")
        return Response({
            'success': False,
            'message': 'An error occurred. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_verify_otp(request):
    """
    Étape 2: Vérifier le code OTP et connecter l'admin
    """
    try:
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        
        if not email or not otp_code:
            return Response({
                'success': False,
                'message': 'Email and OTP code are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer l'utilisateur
        try:
            user = AppUser.objects.get(email=email, role='admin')
        except AppUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid verification.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Récupérer le dernier code OTP valide
        try:
            otp = OTPVerification.objects.filter(
                user=user,
                otp_code=otp_code,
                is_used=False
            ).latest('created_at')
        except OTPVerification.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid or expired verification code.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Vérifier si le code est expiré
        if otp.is_expired():
            return Response({
                'success': False,
                'message': 'Verification code has expired. Please request a new one.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Marquer le code comme utilisé
        otp.is_used = True
        otp.is_verified = True
        otp.save()
        
        # Créer ou récupérer le token
        token, created = Token.objects.get_or_create(user=user)
        
        # Mettre à jour le dernier login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Préparer les données utilisateur
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
        }
        
        return Response({
            'success': True,
            'message': 'Login successful!',
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        print(f"Admin OTP verification error: {e}")
        return Response({
            'success': False,
            'message': 'An error occurred. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================
# ADMIN DASHBOARD STATISTICS
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Statistiques complètes du dashboard admin"""
    try:
        user = request.user
        
        # Vérifier que l'utilisateur est admin
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Statistiques des utilisateurs
        total_users = AppUser.objects.count()
        total_clients = AppUser.objects.filter(role='client').count()
        total_pharmacists = AppUser.objects.filter(role='pharmacist').count()
        total_delivery = AppUser.objects.filter(role='delivery').count()
        total_admins = AppUser.objects.filter(role='admin').count()
        
        # Nouveaux utilisateurs (derniers 30 jours)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_users_last_month = AppUser.objects.filter(
            date_joined__gte=thirty_days_ago
        ).count()
        
        # Statistiques des pharmacies
        total_pharmacies = Pharmacy.objects.count()
        verified_pharmacies = Pharmacy.objects.filter(is_verified=True).count()
        pending_pharmacies = Pharmacy.objects.filter(is_verified=False).count()
        
        # Statistiques des produits
        total_products = Medicine.objects.count()
        approved_products = Medicine.objects.filter(is_approved=True).count()
        pending_products = Medicine.objects.filter(is_approved=False).count()
        active_products = Medicine.objects.filter(is_active=True, is_approved=True).count()
        
        # Statistiques des commandes
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        delivered_orders = Order.objects.filter(status='delivered').count()
        
        # Revenus (delivery fees)
        total_delivery_fees = Payment.objects.filter(
            payment_status='success'
        ).aggregate(
            total=Sum('order__delivery_fee')
        )['total'] or 0
        
        # Revenus totaux
        total_revenue = Payment.objects.filter(
            payment_status='success'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Statistiques par mois (3 derniers mois)
        three_months_ago = timezone.now() - timedelta(days=90)
        monthly_orders = Order.objects.filter(
            order_date__gte=three_months_ago
        ).extra(
            select={'month': 'EXTRACT(month FROM order_date)'}
        ).values('month').annotate(
            count=Count('id'),
            revenue=Sum('final_amount')
        ).order_by('month')
        
        # Top pharmacies (par nombre de commandes)
        top_pharmacies = Pharmacy.objects.annotate(
            order_count=Count('orders')
        ).order_by('-order_count')[:5]
        
        top_pharmacies_data = [{
            'id': p.id,
            'name': p.name,
            'order_count': p.order_count,
            'is_verified': p.is_verified,
            'rating': float(p.rating)
        } for p in top_pharmacies]
        
        return Response({
            'success': True,
            'stats': {
                'users': {
                    'total': total_users,
                    'clients': total_clients,
                    'pharmacists': total_pharmacists,
                    'delivery_persons': total_delivery,
                    'admins': total_admins,
                    'new_last_month': new_users_last_month
                },
                'pharmacies': {
                    'total': total_pharmacies,
                    'verified': verified_pharmacies,
                    'pending': pending_pharmacies
                },
                'products': {
                    'total': total_products,
                    'approved': approved_products,
                    'pending': pending_products,
                    'active': active_products
                },
                'orders': {
                    'total': total_orders,
                    'pending': pending_orders,
                    'delivered': delivered_orders
                },
                'revenue': {
                    'total': float(total_revenue),
                    'delivery_fees': float(total_delivery_fees)
                },
                'top_pharmacies': top_pharmacies_data,
                'monthly_stats': list(monthly_orders)
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        print(f"Admin dashboard stats error: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================
# PHARMACY MANAGEMENT
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_get_pharmacies(request):
    """Liste toutes les pharmacies avec filtres"""
    try:
        user = request.user
        
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Filtres
        status_filter = request.query_params.get('status', 'all')  # all, verified, pending
        
        pharmacies = Pharmacy.objects.select_related('owner').all()
        
        if status_filter == 'verified':
            pharmacies = pharmacies.filter(is_verified=True)
        elif status_filter == 'pending':
            pharmacies = pharmacies.filter(is_verified=False)
        
        pharmacy_data = [{
            'id': p.id,
            'name': p.name,
            'address': p.address,
            'phone': p.phone,
            'email': p.email,
            'owner_name': f"{p.owner.first_name} {p.owner.last_name}",
            'owner_email': p.owner.email,
            'is_verified': p.is_verified,
            'rating': float(p.rating),
            'total_reviews': p.total_reviews,
            'created_at': p.created_at,
            'product_count': p.medicines.count()
        } for p in pharmacies]
        
        return Response({
            'success': True,
            'pharmacies': pharmacy_data,
            'count': len(pharmacy_data)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_verify_pharmacy(request, pharmacy_id):
    """Vérifier/Approuver une pharmacie"""
    try:
        user = request.user
        
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        pharmacy = Pharmacy.objects.get(id=pharmacy_id)
        pharmacy.is_verified = True
        pharmacy.save()
        
        return Response({
            'success': True,
            'message': f'Pharmacy "{pharmacy.name}" verified successfully!'
        }, status=status.HTTP_200_OK)
    
    except Pharmacy.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Pharmacy not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reject_pharmacy(request, pharmacy_id):
    """Rejeter une pharmacie"""
    try:
        user = request.user
        
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        pharmacy = Pharmacy.objects.get(id=pharmacy_id)
        reason = request.data.get('reason', 'No reason provided')
        
        pharmacy.is_verified = False
        pharmacy.save()
        
        # TODO: Envoyer un email au propriétaire avec la raison
        
        return Response({
            'success': True,
            'message': f'Pharmacy "{pharmacy.name}" rejected.'
        }, status=status.HTTP_200_OK)
    
    except Pharmacy.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Pharmacy not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================
# PRODUCT MANAGEMENT
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_get_products(request):
    """Liste tous les produits avec filtres"""
    try:
        user = request.user
        
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Filtres
        status_filter = request.query_params.get('status', 'all')  # all, approved, pending
        
        products = Medicine.objects.select_related('pharmacy', 'category').all()
        
        if status_filter == 'approved':
            products = products.filter(is_approved=True)
        elif status_filter == 'pending':
            products = products.filter(is_approved=False)
        
        from .serializers import MedicineSerializer
        serializer = MedicineSerializer(products, many=True)
        
        return Response({
            'success': True,
            'products': serializer.data,
            'count': products.count()
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_product(request, product_id):
    """Approuver un produit"""
    try:
        user = request.user
        
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        product = Medicine.objects.get(id=product_id)
        product.is_approved = True
        product.save()
        
        return Response({
            'success': True,
            'message': f'Product "{product.name}" approved successfully!'
        }, status=status.HTTP_200_OK)
    
    except Medicine.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Product not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reject_product(request, product_id):
    """Rejeter un produit"""
    try:
        user = request.user
        
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Access denied.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        product = Medicine.objects.get(id=product_id)
        reason = request.data.get('reason', 'No reason provided')
        
        product.is_approved = False
        product.save()
        
        return Response({
            'success': True,
            'message': f'Product "{product.name}" rejected.'
        }, status=status.HTTP_200_OK)
    
    except Medicine.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Product not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)