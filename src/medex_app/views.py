from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Medicine
from .serializers import MedicineSerializer

# ===========================
# Liste des produits
# ===========================
@csrf_exempt
@api_view(['GET', 'POST'])
def product_list(request):
    """
    Liste tous les médicaments disponibles sur la plateforme.
    Chaque médicament appartient à une pharmacie.
    """
    params = request.data if request.method == 'POST' else request.query_params
    
    # ✅ Seulement les produits actifs, approuvés et en stock
    queryset = Medicine.objects.filter(
        is_active=True,
        is_approved=True,
        stock_quantity__gt=0
    ).select_related('pharmacy', 'category', 'subCategory')
    
    # Filtrage des bestsellers
    if params.get('bestseller'):
        queryset = queryset.filter(bestseller=True)
    
    # Filtrage par pharmacie (optionnel)
    if params.get('pharmacy_id'):
        queryset = queryset.filter(pharmacy_id=params.get('pharmacy_id'))
    
    # Filtrage par catégorie
    if params.get('category'):
        queryset = queryset.filter(category__name=params.get('category'))
    
    # Filtrage par sous-catégorie
    if params.get('subCategory'):
        queryset = queryset.filter(subCategory__name=params.get('subCategory'))
    
    # Tri sécurisé
    ALLOWED_SORT_FIELDS = ['created_at', 'price', 'name']
    sort_by = params.get('sortBy', 'created_at')
    
    if sort_by not in ALLOWED_SORT_FIELDS:
        sort_by = 'created_at'
    
    sort_order = params.get('sortOrder', 'desc')
    queryset = queryset.order_by(f"-{sort_by}" if sort_order == 'desc' else sort_by)
    
    # ✅ Compter AVANT la pagination
    total = queryset.count()
    
    # ✅ Compter les pharmacies AVANT la pagination
    pharmacy_count = queryset.values('pharmacy').distinct().count()
    
    # Pagination
    page = int(params.get('page', 1))
    page_size = int(params.get('limit', 100))
    start = (page - 1) * page_size
    end = start + page_size
    
    # ✅ Slice APRÈS avoir compté
    paginated_queryset = queryset[start:end]
    
    # Serialization
    serializer = MedicineSerializer(paginated_queryset, many=True)
    
    # Debug
    print(f"✅ Displaying {len(serializer.data)} products from {pharmacy_count} pharmacies")
    print(f"📦 Total products available: {total}")
    
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


# ===========================
# Détail d'un produit
# ===========================
@api_view(['GET'])
def product_detail(request, pk):
    """
    Détail d'un médicament spécifique avec toutes les infos de la pharmacie
    """
    try:
        medicine = Medicine.objects.select_related(
            'pharmacy', 'category', 'subCategory'
        ).get(pk=pk, is_active=True, is_approved=True)
        
        serializer = MedicineSerializer(medicine)
        
        print(f"✅ Product detail: {medicine.name} from {medicine.pharmacy.name}")
        
        return Response({
            "success": True,
            "product": serializer.data
        })
    except Medicine.DoesNotExist:
        print(f"❌ Product not found: ID {pk}")
        return Response({
            "success": False,
            "error": "Product not found"
        }, status=404)


# ===========================
# Produits d'une pharmacie spécifique
# ===========================
@api_view(['GET'])
def pharmacy_products(request, pharmacy_id):
    """
    Tous les produits d'une pharmacie spécifique
    """
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


# ===========================
# Paramètres de commande
# ===========================
@api_view(['GET'])
def order_settings(request):
    """
    Endpoint pour les paramètres de commande
    """
    return Response({
        "success": True,
        "settings": {
            "min_order_amount": 1000,
            "delivery_fee": 500,
            "supported_payment_methods": ["mobile_money", "paypal", "card"],
            "max_cart_size": 20
        }
    })