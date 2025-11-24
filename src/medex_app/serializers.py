from rest_framework import serializers
from .models import (
    Medicine, Category, SubCategory, Pharmacy, 
    Cart, CartItem, AppUser, Delivery
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon']


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'description']


class PharmacySerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    
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
            'total_reviews',
            'logo',
            'description',
            'opening_hours',
            'is_verified',
            'owner',
            'owner_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'rating', 'total_reviews', 'is_verified', 'created_at', 'updated_at']
    
    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}"


class MedicineSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    subCategory = SubCategorySerializer(read_only=True)
    pharmacy = PharmacySerializer(read_only=True)
    
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    subcategory_name = serializers.CharField(source='subCategory.name', read_only=True, allow_null=True)
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)
    pharmacy_address = serializers.CharField(source='pharmacy.address', read_only=True)
    pharmacy_phone = serializers.CharField(source='pharmacy.phone', read_only=True, allow_null=True)
    pharmacy_is_open = serializers.BooleanField(source='pharmacy.is_open', read_only=True)
    pharmacy_rating = serializers.DecimalField(source='pharmacy.rating', max_digits=3, decimal_places=2, read_only=True)
    
    is_in_stock = serializers.SerializerMethodField()
    is_visible = serializers.SerializerMethodField()
    
    class Meta:
        model = Medicine
        fields = [
            'id',
            'name',
            'description',
            'generic_name',
            'manufacturer',
            'dosage',
            'price',
            'unit_price',
            'quantity_price_list',
            'min_order_quantity',
            'stock_quantity',
            'category',
            'category_name',
            'subCategory',
            'subcategory_name',
            'pharmacy',
            'pharmacy_name',
            'pharmacy_address',
            'pharmacy_phone',
            'pharmacy_is_open',
            'pharmacy_rating',
            'requires_prescription',
            'bestseller',
            'is_active',
            'is_approved',
            'is_in_stock',
            'is_visible',
            'image',
            'views_count',
            'sales_count',
            'created_at',
        ]
    
    def get_is_in_stock(self, obj):
        return obj.is_in_stock()
    
    def get_is_visible(self, obj):
        return obj.is_visible_on_platform()


class CartItemSerializer(serializers.ModelSerializer):
    medicine_id = serializers.IntegerField(source='medicine.id', read_only=True)
    product_name = serializers.CharField(source='medicine.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    pharmacy_name = serializers.CharField(source='medicine.pharmacy.name', read_only=True)
    stock_available = serializers.IntegerField(source='medicine.stock_quantity', read_only=True)
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = [
            'id',
            'medicine_id',
            'product_name',
            'product_image',
            'pharmacy_name',
            'quantity',
            'selected_price',
            'subtotal',
            'is_package',
            'package_details',
            'stock_available',
            'created_at'
        ]
    
    def get_subtotal(self, obj):
        return obj.subtotal()
    
    def get_product_image(self, obj):
        if obj.medicine and obj.medicine.image:
            if isinstance(obj.medicine.image, list) and len(obj.medicine.image) > 0:
                return obj.medicine.image[0]
        return None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    pharmacies = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = [
            'id',
            'user',
            'items',
            'total_amount',
            'item_count',
            'pharmacies',
            'created_at',
            'updated_at'
        ]
    
    def get_total_amount(self, obj):
        return float(obj.total_amount())
    
    def get_item_count(self, obj):
        return obj.item_count()
    
    def get_pharmacies(self, obj):
        pharmacies = obj.get_pharmacies()
        return [
            {
                'id': pharmacy.id,
                'name': pharmacy.name,
                'address': pharmacy.address,
                'phone': pharmacy.phone,
                'is_open': pharmacy.is_open
            }
            for pharmacy in pharmacies
        ]


class AppUserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs avec tous les champs"""
    
    class Meta:
        model = AppUser
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'address',
            'role',
            'is_active',
            'date_joined',
            'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate_role(self, value):
        """Valider le rôle"""
        valid_roles = ['client', 'pharmacist', 'delivery', 'admin']
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        return value
    
    def validate_phone(self, value):
        """Valider le numéro de téléphone (optionnel)"""
        if value and len(value) < 9:
            raise serializers.ValidationError(
                "Phone number must be at least 9 characters"
            )
        return value


# Delivery Person
class DeliveryDashboardOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    address = serializers.CharField(source="order.delivery_address")
    total_price = serializers.DecimalField(
        source="order.final_amount", max_digits=10, decimal_places=2
    )
    status = serializers.CharField(source="delivery_status")

    class Meta:
        model = Delivery
        fields = [
            "id",
            "order",
            "customer_name",
            "address",
            "total_price",
            "status",
            "tracking_number",
            "delivery_status",
            "current_latitude",
            "current_longitude",
        ]

    def get_customer_name(self, obj):
        user = obj.order.user
        return f"{user.first_name} {user.last_name}"

class GPSUpdateSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=10, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=6)