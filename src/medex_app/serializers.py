# serializers.py

from rest_framework import serializers
from .models import Medicine, Category, SubCategory, Pharmacy

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'description']

class PharmacySerializer(serializers.ModelSerializer):
    """Serializer pour les informations de pharmacie"""
    class Meta:
        model = Pharmacy
        fields = [
            'id', 
            'name', 
            'address', 
            'phone', 
            'email',
            'latitude',
            'longitude',
            'is_open',
            'rating',
            'total_reviews'
        ]

class MedicineSerializer(serializers.ModelSerializer):
    """
    Serializer principal pour les médicaments.
    Inclut les informations de la pharmacie propriétaire.
    """
    # Relations imbriquées
    category = CategorySerializer(read_only=True, allow_null=True)
    subCategory = SubCategorySerializer(read_only=True, allow_null=True)
    pharmacy = PharmacySerializer(read_only=True)
    
    # Champs calculés pour faciliter l'affichage
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    subcategory_name = serializers.CharField(source='subCategory.name', read_only=True, allow_null=True)
    
    # Infos pharmacie directement accessibles
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)
    pharmacy_address = serializers.CharField(source='pharmacy.address', read_only=True)
    pharmacy_phone = serializers.CharField(source='pharmacy.phone', read_only=True, allow_null=True)
    pharmacy_is_open = serializers.BooleanField(source='pharmacy.is_open', read_only=True)
    pharmacy_rating = serializers.DecimalField(source='pharmacy.rating', max_digits=3, decimal_places=2, read_only=True)
    
    class Meta:
        model = Medicine
        fields = [
            # ID et infos de base
            'id',
            'name',
            'description',
            'generic_name',
            'manufacturer',
            'dosage',
            
            # Prix et stock
            'price',
            'unit_price',
            'quantity_price_list',
            'min_order_quantity',
            'stock_quantity',
            
            # Catégories
            'category',
            'category_name',
            'subCategory',
            'subcategory_name',
            
            # Pharmacie (objet complet)
            'pharmacy',
            
            # Pharmacie (champs directs pour faciliter l'accès)
            'pharmacy_name',
            'pharmacy_address',
            'pharmacy_phone',
            'pharmacy_is_open',
            'pharmacy_rating',
            
            # Statut
            'requires_prescription',
            'bestseller',
            'is_active',
            'is_approved',
            
            # Images
            'image',
            
            # Statistiques
            'views_count',
            'sales_count',
            
            # Dates
            'created_at',
        ]
    
    def to_representation(self, instance):
        """Personnalisation de la sortie JSON"""
        data = super().to_representation(instance)
        
        # Forcer l'ID à être un entier
        data['id'] = int(instance.id) if instance.id else None
        
        # Gérer les cas où la pharmacie pourrait être None (par sécurité)
        if not instance.pharmacy:
            data['pharmacy_name'] = "Unknown Pharmacy"
            data['pharmacy_address'] = ""
            data['pharmacy_phone'] = ""
            data['pharmacy_is_open'] = False
            data['pharmacy_rating'] = 0.0
        
        # Debug
        print(f"📤 Serializing: {instance.name} from {instance.pharmacy.name if instance.pharmacy else 'No Pharmacy'}")
        
        return data