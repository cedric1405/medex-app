import time
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import *
from django.http import JsonResponse
from .serializers import *
from rest_framework import status
from rest_framework.authtoken.models import Token
import json
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
from io import BytesIO
from django.core.files.storage import default_storage
from django.conf import settings
import os
import time



# ===========================
# AUTHENTIFICATION
# ===========================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Inscription d'un nouvel utilisateur avec tous les champs"""
    try:
        data = request.data
        
        # Champs requis
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password')
        
        # Champs optionnels
        phone = data.get('phone', '').strip() or None
        address = data.get('address', '').strip() or None
        role = data.get('role', 'client')

        # Validation
        if not all([first_name, last_name, email, password]):
            return Response({
                'success': False,
                'message': 'First name, last name, email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si l'email existe déjà
        if AppUser.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'message': 'Email already registered.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Valider le rôle
        valid_roles = ['client', 'pharmacist', 'delivery', 'admin']
        if role not in valid_roles:
            return Response({
                'success': False,
                'message': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Valider le mot de passe
        if len(password) < 6:
            return Response({
                'success': False,
                'message': 'Password must be at least 6 characters long.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Créer l'utilisateur avec tous les champs
        user = AppUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            address=address,
            role=role,
            username=email  # Utiliser email comme username
        )

        # ✅ Créer le token
        token = Token.objects.create(user=user)

        # ✅ Préparer les données utilisateur
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'address': user.address,
            'role': user.role
        }

        # ✅ Ajouter les informations spécifiques selon le rôle
        if role == 'pharmacist':
            user_data['has_pharmacy'] = False  # Nouveau pharmacien n'a pas encore de pharmacie
        elif role == 'delivery':
            user_data['has_delivery_profile'] = False  # Nouveau livreur n'a pas encore de profil

        return Response({
            'success': True,
            'message': 'Account created successfully!',
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_pharmacy(request):
    """Enregistrement d'une nouvelle pharmacie"""
    try:
        user = request.user
        
        # Vérifier que l'utilisateur est pharmacien
        if user.role != 'pharmacist':
            return Response({
                'success': False,
                'message': 'Only pharmacists can register pharmacies.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Vérifier si l'utilisateur a déjà une pharmacie
        if Pharmacy.objects.filter(owner=user).exists():
            return Response({
                'success': False,
                'message': 'You already have a registered pharmacy.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer les données
        name = request.data.get('name')
        address = request.data.get('address')
        phone = request.data.get('phone')
        email = request.data.get('email', '')
        description = request.data.get('description', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        opening_hours = request.data.get('opening_hours', '{}')
        
        # Validation
        if not all([name, address, phone]):
            return Response({
                'success': False,
                'message': 'Name, address and phone are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parser opening_hours si c'est une chaîne JSON
        if isinstance(opening_hours, str):
            import json
            try:
                opening_hours = json.loads(opening_hours)
            except json.JSONDecodeError:
                opening_hours = {}
        
        # Créer la pharmacie
        pharmacy = Pharmacy.objects.create(
            owner=user,
            name=name,
            address=address,
            phone=phone,
            email=email or None,
            description=description or None,
            latitude=latitude if latitude else None,
            longitude=longitude if longitude else None,
            opening_hours=opening_hours,
            is_verified=False  # Nécessite validation admin
        )
        
        # Gérer le logo si présent
        if 'logo' in request.FILES:
            pharmacy.logo = request.FILES['logo']
            pharmacy.save()
        
        return Response({
            'success': True,
            'message': 'Pharmacy registered successfully! Awaiting admin verification.',
            'pharmacy': {
                'id': pharmacy.id,
                'name': pharmacy.name,
                'address': pharmacy.address,
                'phone': pharmacy.phone,
                'is_verified': pharmacy.is_verified
            }
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_user_profile_status(request):
    """Vérifier le statut du profil utilisateur"""
    try:
        user = request.user
        
        status_data = {
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }
        
        if user.role == 'pharmacist':
            has_pharmacy = Pharmacy.objects.filter(owner=user).exists()
            status_data['has_pharmacy'] = has_pharmacy
            
            if has_pharmacy:
                pharmacy = Pharmacy.objects.get(owner=user)
                status_data['pharmacy'] = {
                    'id': pharmacy.id,
                    'name': pharmacy.name,
                    'is_verified': pharmacy.is_verified
                }
        
        """elif user.role == 'delivery':
            has_delivery_profile = hasattr(user, 'delivery_profile')
            status_data['has_delivery_profile'] = has_delivery_profile
            
            if has_delivery_profile:
                profile = user.delivery_profile
                status_data['delivery_profile'] = {
                    'id': profile.id,
                    'vehicle_type': profile.vehicle_type,
                    'is_verified': profile.is_verified
                }"""
        
        return Response(status_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Connexion d'un utilisateur"""
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Récupérer l'utilisateur
        try:
            user = AppUser.objects.get(email=email)
        except AppUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # ✅ Vérifier le mot de passe (AbstractUser gère le hashing)
        if not user.check_password(password):
            return Response({
                'success': False,
                'message': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Vérifier si l'utilisateur est actif
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'Account is disabled.'
            }, status=status.HTTP_403_FORBIDDEN)

        # ✅ Récupérer ou créer le token
        token, created = Token.objects.get_or_create(user=user)

        # Mettre à jour le dernier login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # ✅ Préparer les données utilisateur
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'phone': user.phone,
            'address': user.address
        }

        # ✅ Vérifier si le pharmacien a une pharmacie
        if user.role == 'pharmacist':
            has_pharmacy = Pharmacy.objects.filter(owner=user).exists()
            user_data['has_pharmacy'] = has_pharmacy
            
            if has_pharmacy:
                pharmacy = Pharmacy.objects.get(owner=user)
                user_data['pharmacy_id'] = pharmacy.id
                user_data['pharmacy_name'] = pharmacy.name
                user_data['pharmacy_is_verified'] = pharmacy.is_verified

        # ✅ Vérifier si le livreur a un profil
        """elif user.role == 'delivery':
            has_delivery_profile = hasattr(user, 'delivery_profile')
            user_data['has_delivery_profile'] = has_delivery_profile
            
            if has_delivery_profile:
                profile = user.delivery_profile
                user_data['delivery_profile_id'] = profile.id
                user_data['delivery_is_verified'] = profile.is_verified"""

        return Response({
            'success': True,
            'message': 'Login successful!',
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Déconnexion - supprime le token"""
    try:
        # Supprimer le token de l'utilisateur
        request.user.auth_token.delete()
        
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Récupérer le profil de l'utilisateur connecté"""
    try:
        serializer = AppUserSerializer(request.user)
        return Response({
            'success': True,
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================
# PRODUITS
# ===========================

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def product_list(request):
    """Liste tous les médicaments disponibles"""
    params = request.data if request.method == 'POST' else request.query_params
    
    queryset = Medicine.objects.filter(
        is_active=True,
        is_approved=True,
        stock_quantity__gt=0
    ).select_related('pharmacy', 'category', 'subCategory')
    
    if params.get('bestseller'):
        queryset = queryset.filter(bestseller=True)
    
    if params.get('pharmacy_id'):
        queryset = queryset.filter(pharmacy_id=params.get('pharmacy_id'))
    
    if params.get('category'):
        queryset = queryset.filter(category__name=params.get('category'))
    
    if params.get('subCategory'):
        queryset = queryset.filter(subCategory__name=params.get('subCategory'))
    
    ALLOWED_SORT_FIELDS = ['created_at', 'price', 'name']
    sort_by = params.get('sortBy', 'created_at')
    
    if sort_by not in ALLOWED_SORT_FIELDS:
        sort_by = 'created_at'
    
    sort_order = params.get('sortOrder', 'desc')
    queryset = queryset.order_by(f"-{sort_by}" if sort_order == 'desc' else sort_by)
    
    total = queryset.count()
    pharmacy_count = queryset.values('pharmacy').distinct().count()
    
    page = int(params.get('page', 1))
    page_size = int(params.get('limit', 100))
    start = (page - 1) * page_size
    end = start + page_size
    
    paginated_queryset = queryset[start:end]
    
    serializer = MedicineSerializer(paginated_queryset, many=True)
    
    return Response({
        "success": True,
        "products": serializer.data,
        "pagination": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pharmacies": pharmacy_count,
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def product_detail(request, pk):
    """Détail d'un médicament spécifique"""
    try:
        medicine = Medicine.objects.select_related(
            'pharmacy', 'category', 'subCategory'
        ).get(pk=pk, is_active=True, is_approved=True)
        
        serializer = MedicineSerializer(medicine)
        
        return Response({
            "success": True,
            "product": serializer.data
        })
    except Medicine.DoesNotExist:
        return Response({
            "success": False,
            "error": "Product not found"
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def pharmacy_products(request, pharmacy_id):
    """Tous les produits d'une pharmacie spécifique"""
    products = Medicine.objects.filter(
        pharmacy_id=pharmacy_id,
        is_active=True,
        is_approved=True,
        stock_quantity__gt=0
    ).select_related('category', 'subCategory')
    
    serializer = MedicineSerializer(products, many=True)
    
    return Response({
        "success": True,
        "products": serializer.data,
        "count": products.count()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def order_settings(request):
    """Endpoint pour les paramètres de commande"""
    return Response({
        "success": True,
        "settings": {
            "min_order_amount": 1000,
            "delivery_fee": 500,
            "supported_payment_methods": ["mobile_money", "paypal", "card"],
            "max_cart_size": 20
        }
    })


# ===========================
# CART API
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    """Récupère le panier complet de l'utilisateur connecté"""
    try:
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        
        return Response({
            "success": True,
            "cart": serializer.data,
            "message": "Cart retrieved successfully"
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Ajouter un produit au panier"""
    try:
        user = request.user
        cart, created = Cart.objects.get_or_create(user=user)
        
        # ✅ Récupérer medicine_id depuis request.data (JSON)
        medicine_id = request.data.get("medicine_id")
        quantity = request.data.get("quantity", 1)
        
        # Valider les données
        if not medicine_id:
            return Response({
                "success": False,
                "error": "medicine_id is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            quantity = 1
        
        # Récupérer le médicament
        try:
            medicine = Medicine.objects.get(
                id=medicine_id,
                is_active=True,
                is_approved=True
            )
        except Medicine.DoesNotExist:
            return Response({
                "success": False,
                "error": "Medicine not found or not available"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier le stock
        if medicine.stock_quantity < quantity:
            return Response({
                "success": False,
                "error": f"Insufficient stock. Only {medicine.stock_quantity} available"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier la quantité minimale
        if quantity < medicine.min_order_quantity:
            return Response({
                "success": False,
                "error": f"Minimum order quantity is {medicine.min_order_quantity}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer selected_price et is_package
        selected_price = request.data.get("selected_price")
        if selected_price:
            try:
                selected_price = float(selected_price)
            except (ValueError, TypeError):
                selected_price = float(medicine.price)
        else:
            selected_price = float(medicine.price)
        
        is_package = request.data.get("is_package", False)
        if isinstance(is_package, str):
            is_package = is_package.lower() == 'true'
        
        package_details = request.data.get("package_details", {})
        
        # Créer ou mettre à jour l'article du panier
        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            medicine=medicine,
            defaults={
                "quantity": quantity,
                "selected_price": selected_price,
                "is_package": is_package,
                "package_details": package_details
            }
        )
        
        if not item_created:
            # L'article existe déjà, augmenter la quantité
            new_quantity = cart_item.quantity + quantity
            
            if medicine.stock_quantity < new_quantity:
                return Response({
                    "success": False,
                    "error": f"Cannot add more. Only {medicine.stock_quantity} available"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item.quantity = new_quantity
            cart_item.selected_price = selected_price
            cart_item.is_package = is_package
            cart_item.package_details = package_details
            cart_item.save()
            message = "Cart item quantity updated"
        else:
            message = "Item added to cart successfully"
        
        # Sérialiser le panier complet
        cart_serializer = CartSerializer(cart)
        
        return Response({
            "success": True,
            "message": message,
            "cart": cart_serializer.data,
            "item": CartItemSerializer(cart_item).data
        }, status=status.HTTP_201_CREATED if item_created else status.HTTP_200_OK)
    
    except Exception as e:
        # Afficher l'erreur complète dans la console Django
        import traceback
        print("=" * 50)
        print("ERROR IN ADD_TO_CART:")
        print(traceback.format_exc())
        print("=" * 50)
        
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, item_id):
    """Mettre à jour la quantité d'un article du panier"""
    try:
        user = request.user
        cart = Cart.objects.get(user=user)
        
        try:
            cart_item = cart.items.get(id=item_id)
        except CartItem.DoesNotExist:
            return Response({
                "success": False,
                "error": "Cart item not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        new_quantity = int(request.data.get("quantity", cart_item.quantity))
        
        if new_quantity <= 0:
            return Response({
                "success": False,
                "error": "Quantity must be greater than 0"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if cart_item.medicine.stock_quantity < new_quantity:
            return Response({
                "success": False,
                "error": f"Insufficient stock. Only {cart_item.medicine.stock_quantity} available"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_quantity < cart_item.medicine.min_order_quantity:
            return Response({
                "success": False,
                "error": f"Minimum order quantity is {cart_item.medicine.min_order_quantity}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_item.quantity = new_quantity
        cart_item.save()
        
        cart_serializer = CartSerializer(cart)
        
        return Response({
            "success": True,
            "message": "Cart item updated successfully",
            "cart": cart_serializer.data,
            "item": CartItemSerializer(cart_item).data
        }, status=status.HTTP_200_OK)
    
    except ValueError:
        return Response({
            "success": False,
            "error": "Invalid quantity value"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    """Supprimer un article du panier"""
    try:
        user = request.user
        cart = Cart.objects.get(user=user)
        
        try:
            cart_item = cart.items.get(id=item_id)
            cart_item.delete()
            
            cart_serializer = CartSerializer(cart)
            
            return Response({
                "success": True,
                "message": "Item removed from cart",
                "cart": cart_serializer.data
            }, status=status.HTTP_200_OK)
        
        except CartItem.DoesNotExist:
            return Response({
                "success": False,
                "error": "Cart item not found"
            }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    """Vider complètement le panier"""
    try:
        user = request.user
        cart = Cart.objects.get(user=user)
        cart.items.all().delete()
        
        cart_serializer = CartSerializer(cart)
        
        return Response({
            "success": True,
            "message": "Cart cleared successfully",
            "cart": cart_serializer.data
        }, status=status.HTTP_200_OK)
    
    except Cart.DoesNotExist:
        return Response({
            "success": True,
            "message": "Cart is already empty"
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_summary(request):
    """Obtenir un résumé du panier"""
    try:
        cart, created = Cart.objects.get_or_create(user=request.user)
        
        return Response({
            "success": True,
            "summary": {
                "item_count": cart.item_count(),
                "total_amount": float(cart.total_amount()),
                "pharmacies_count": len(cart.get_pharmacies()),
                "pharmacies": [
                    {
                        "id": pharmacy.id,
                        "name": pharmacy.name
                    } for pharmacy in cart.get_pharmacies()
                ]
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    
    

# ===========================
# PHARMACY DASHBOARD - PRODUITS
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pharmacy_products(request):
    """Récupérer tous les produits de la pharmacie du pharmacien connecté"""
    try:
        user = request.user
        
        # Vérifier que l'utilisateur est pharmacien
        if user.role != 'pharmacist':
            return Response({
                'success': False,
                'message': 'Only pharmacists can access this endpoint.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Récupérer la pharmacie du pharmacien
        try:
            pharmacy = Pharmacy.objects.get(owner=user)
        except Pharmacy.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No pharmacy found for this user.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Récupérer tous les produits de cette pharmacie
        products = Medicine.objects.filter(
            pharmacy=pharmacy
        ).select_related('category', 'subCategory').order_by('-created_at')
        
        serializer = MedicineSerializer(products, many=True)
        
        # Statistiques
        total_products = products.count()
        active_products = products.filter(is_active=True).count()
        approved_products = products.filter(is_approved=True).count()
        pending_approval = products.filter(is_approved=True).count()
        out_of_stock = products.filter(stock_quantity=0).count()
        
        return Response({
            'success': True,
            'products': serializer.data,
            'stats': {
                'total': total_products,
                'active': active_products,
                'approved': approved_products,
                'pending_approval': pending_approval,
                'out_of_stock': out_of_stock
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#ajouter un produit
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_product(request):
    """Ajouter un nouveau produit à la pharmacie"""
    try:
        user = request.user
        
        # Vérifier que l'utilisateur est pharmacien
        if user.role != 'pharmacist':
            return Response({
                'success': False,
                'message': 'Only pharmacists can add products.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Récupérer la pharmacie
        try:
            pharmacy = Pharmacy.objects.get(owner=user)
        except Pharmacy.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No pharmacy found for this user.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Récupérer les données depuis request.POST pour FormData
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        generic_name = request.POST.get('generic_name', '')
        manufacturer = request.POST.get('manufacturer', '')
        dosage = request.POST.get('dosage', '')
        price = request.POST.get('price')
        stock_quantity = request.POST.get('stock_quantity', 0)
        min_order_quantity = request.POST.get('min_order_quantity', 1)
        category_id = request.POST.get('category_id')
        subcategory_id = request.POST.get('subcategory_id')
        requires_prescription = request.POST.get('requires_prescription', 'false').lower() == 'true'
        
        # Validation
        if not all([name, price]):
            return Response({
                'success': False,
                'message': 'Name and price are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer le produit
        product = Medicine.objects.create(
            pharmacy=pharmacy,
            name=name,
            description=description,
            generic_name=generic_name,
            manufacturer=manufacturer,
            dosage=dosage,
            price=float(price),
            unit_price=float(price),
            stock_quantity=int(stock_quantity) if stock_quantity else 0,
            min_order_quantity=int(min_order_quantity) if min_order_quantity else 1,
            category_id=int(category_id) if category_id else None,
            subCategory_id=int(subcategory_id) if subcategory_id else None,
            requires_prescription=requires_prescription,
            is_active=True,
            is_approved=True
        )
        
        # ✅ Gérer les images multiples
        image_urls = []
        if request.FILES:
            images = request.FILES.getlist('images')
            
            for idx, image_file in enumerate(images[:5]):  # Limiter à 5 images
                # Créer un nom de fichier unique
                ext = image_file.name.split('.')[-1]
                filename = f"product_{product.id}_{idx}_{int(time.time())}.{ext}"
                filepath = os.path.join('products', filename)
                
                # Sauvegarder l'image
                saved_path = default_storage.save(filepath, image_file)
                
                # Créer l'URL complète
                image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
                image_urls.append(image_url)
        
        # Sauvegarder les URLs des images dans le JSONField
        if image_urls:
            product.image = image_urls
            product.save()
        
        serializer = MedicineSerializer(product)
        
        return Response({
            'success': True,
            'message': 'Product added successfully! Awaiting admin approval.',
            'product': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())  # Pour le debug
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_product(request, product_id):
    """Modifier un produit"""
    try:
        user = request.user
        
        if user.role != 'pharmacist':
            return Response({
                'success': False,
                'message': 'Only pharmacists can update products.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            pharmacy = Pharmacy.objects.get(owner=user)
        except Pharmacy.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No pharmacy found for this user.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            product = Medicine.objects.get(id=product_id, pharmacy=pharmacy)
        except Medicine.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Mettre à jour les champs
        product.name = request.POST.get('name', product.name)
        product.description = request.POST.get('description', product.description)
        product.generic_name = request.POST.get('generic_name', product.generic_name)
        product.manufacturer = request.POST.get('manufacturer', product.manufacturer)
        product.dosage = request.POST.get('dosage', product.dosage)
        product.price = float(request.POST.get('price', product.price))
        product.unit_price = float(request.POST.get('price', product.price))
        product.stock_quantity = int(request.POST.get('stock_quantity', product.stock_quantity))
        product.min_order_quantity = int(request.POST.get('min_order_quantity', product.min_order_quantity))
        
        category_id = request.POST.get('category_id')
        if category_id:
            product.category_id = int(category_id)
        
        subcategory_id = request.POST.get('subcategory_id')
        if subcategory_id:
            product.subCategory_id = int(subcategory_id)
        
        requires_prescription = request.POST.get('requires_prescription', 'false')
        product.requires_prescription = requires_prescription.lower() == 'true'
        
        # Gérer les nouvelles images
        if request.FILES:
            images = request.FILES.getlist('images')
            new_image_urls = []
            
            for idx, image_file in enumerate(images[:5]):
                ext = image_file.name.split('.')[-1]
                filename = f"product_{product.id}_{idx}_{int(time.time())}.{ext}"
                filepath = os.path.join('products', filename)
                
                saved_path = default_storage.save(filepath, image_file)
                image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
                new_image_urls.append(image_url)
            
            # Remplacer les anciennes images par les nouvelles
            if new_image_urls:
                # Supprimer les anciennes images du stockage (optionnel)
                for old_url in product.image:
                    try:
                        old_path = old_url.replace(request.build_absolute_uri(settings.MEDIA_URL), '')
                        if default_storage.exists(old_path):
                            default_storage.delete(old_path)
                    except:
                        pass
                
                product.image = new_image_urls
        
        product.save()
        
        serializer = MedicineSerializer(product)
        
        return Response({
            'success': True,
            'message': 'Product updated successfully!',
            'product': serializer.data
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request, product_id):
    """Supprimer un produit"""
    try:
        user = request.user
        
        if user.role != 'pharmacist':
            return Response({
                'success': False,
                'message': 'Only pharmacists can delete products.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        pharmacy = Pharmacy.objects.get(owner=user)
        
        try:
            product = Medicine.objects.get(id=product_id, pharmacy=pharmacy)
            product_name = product.name
            product.delete()
            
            return Response({
                'success': True,
                'message': f'Product "{product_name}" deleted successfully!'
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
def import_products_excel(request):
    """Importer des produits depuis un fichier Excel"""
    try:
        user = request.user
        
        if user.role != 'pharmacist':
            return Response({
                'success': False,
                'message': 'Only pharmacists can import products.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        pharmacy = Pharmacy.objects.get(owner=user)
        
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'message': 'No file provided.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        excel_file = request.FILES['file']
        
        # Vérifier l'extension du fichier
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            return Response({
                'success': False,
                'message': 'Invalid file format. Please upload an Excel file (.xlsx or .xls)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Lire le fichier Excel
        try:
            df = pd.read_excel(BytesIO(excel_file.read()))
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error reading Excel file: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Colonnes requises
        required_columns = ['name', 'price']
        optional_columns = ['description', 'generic_name', 'manufacturer', 'dosage', 
                          'stock_quantity', 'min_order_quantity', 'category', 
                          'subcategory', 'requires_prescription']
        
        # Vérifier les colonnes requises
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                'success': False,
                'message': f'Missing required columns: {", ".join(missing_columns)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Importer les produits
        products_created = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Récupérer la catégorie si spécifiée
                category = None
                if 'category' in df.columns and pd.notna(row['category']):
                    category = Category.objects.filter(name=row['category']).first()
                
                # Récupérer la sous-catégorie si spécifiée
                subcategory = None
                if 'subcategory' in df.columns and pd.notna(row['subcategory']):
                    subcategory = SubCategory.objects.filter(name=row['subcategory']).first()
                
                # Créer le produit
                product = Medicine.objects.create(
                    pharmacy=pharmacy,
                    name=row['name'],
                    description=row.get('description', '') if pd.notna(row.get('description')) else '',
                    generic_name=row.get('generic_name', '') if pd.notna(row.get('generic_name')) else '',
                    manufacturer=row.get('manufacturer', '') if pd.notna(row.get('manufacturer')) else '',
                    dosage=row.get('dosage', '') if pd.notna(row.get('dosage')) else '',
                    price=float(row['price']),
                    unit_price=float(row['price']),
                    stock_quantity=int(row.get('stock_quantity', 0)) if pd.notna(row.get('stock_quantity')) else 0,
                    min_order_quantity=int(row.get('min_order_quantity', 1)) if pd.notna(row.get('min_order_quantity')) else 1,
                    category=category,
                    subCategory=subcategory,
                    requires_prescription=bool(row.get('requires_prescription', False)) if pd.notna(row.get('requires_prescription')) else False,
                    is_active=True,
                    is_approved=True
                )
                
                products_created.append(product.name)
            
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return Response({
            'success': True,
            'message': f'{len(products_created)} products imported successfully!',
            'products_created': products_created,
            'errors': errors if errors else None
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_categories(request):
    """Récupérer toutes les catégories"""
    categories = Category.objects.filter(is_active=True)
    serializer = CategorySerializer(categories, many=True)
    return Response({
        'success': True,
        'categories': serializer.data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_subcategories(request, category_id):
    """Récupérer les sous-catégories d'une catégorie"""
    subcategories = SubCategory.objects.filter(category_id=category_id, is_active=True)
    serializer = SubCategorySerializer(subcategories, many=True)
    return Response({
        'success': True,
        'subcategories': serializer.data
    })


# ================================
#   2. UPDATE ORDER STATUS (Livreur)
# ================================
"""@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_delivery_status(request, order_id):
    
    #Frontend PUT:
     # /api/delivery/orders/<order_id>/status/
    #  Body: {"status": "delivered"}
    

    new_status = request.data.get("status")

    if new_status not in dict(Delivery.STATUS_CHOICES).keys():
        return Response(
            {"success": False, "message": "Invalid status"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Retrieve delivery + ensure update allowed
    delivery = get_object_or_404(Delivery, order_id=order_id)

    # Optional security check:
    # Only the assigned delivery man can update the order
    if delivery.delivery_person != request.user:
        return Response(
            {"success": False, "message": "Not authorized to update this order"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Update the status
    delivery.delivery_status = new_status
    delivery.save()

    return Response(
        {
            "success": True,
            "message": "Status updated successfully",
            "new_status": new_status,
        },
        status=200,
    )"""