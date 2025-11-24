from django.db import models
from django.utils import timezone



from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password
# Ajouter ce modèle à votre models.py existant

import random
import string
from datetime import timedelta
from django.utils import timezone


# ===============================
# 1. User Model avec AbstractUser
# ===============================
class AppUser(AbstractUser):
    """
    Modèle utilisateur personnalisé basé sur AbstractUser
    """
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('pharmacist', 'Pharmacist'),
        ('delivery', 'Delivery Person'),
        ('admin', 'Administrator'),
    ]

    # ✅ Supprimer id_user, utiliser le id par défaut d'AbstractUser
    # id est déjà fourni par AbstractUser
    
    # ✅ first_name et last_name sont déjà dans AbstractUser
    # ✅ email est déjà dans AbstractUser
    # ✅ password est déjà dans AbstractUser
    
    # Champs supplémentaires
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    
    
    

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"





class OTPVerification(models.Model):
    """Modèle pour la vérification OTP (2FA)"""
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='otp_codes')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.user.email} - {self.otp_code}"
    
    def is_expired(self):
        """Vérifier si le code OTP est expiré"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Vérifier si le code OTP est valide"""
        return not self.is_used and not self.is_expired()
    
    @staticmethod
    def generate_otp():
        """Générer un code OTP aléatoire de 6 chiffres"""
        return ''.join(random.choices(string.digits, k=6))
    
    @classmethod
    def create_otp(cls, user):
        """Créer un nouveau code OTP pour un utilisateur"""
        # Invalider tous les anciens codes OTP non utilisés
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Créer un nouveau code OTP
        otp_code = cls.generate_otp()
        expires_at = timezone.now() + timedelta(minutes=10)  # Expire dans 10 minutes
        
        otp = cls.objects.create(
            user=user,
            otp_code=otp_code,
            expires_at=expires_at
        )
        
        return otp
    
    
# ===============================
# 2. Pharmacy Model
# ===============================
class Pharmacy(models.Model):
    name = models.CharField(max_length=150)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    is_open = models.BooleanField(default=True)
    owner = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='pharmacies')
    
    logo = models.ImageField(upload_to='pharmacy_logos/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    opening_hours = models.JSONField(default=dict, blank=True)
    is_verified = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Pharmacies"
        ordering = ['-is_verified', '-rating', 'name']

    def __str__(self):
        return self.name


# ===============================
# 3. Category Model
# ===============================
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


# ===============================
# 4. SubCategory Model
# ===============================
class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('category', 'name')
        verbose_name_plural = "SubCategories"
        ordering = ['category__name', 'name']

    def __str__(self):
        return f"{self.category.name} - {self.name}"


# ===============================
# 5. Medicine Model
# ===============================
class Medicine(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    generic_name = models.CharField(max_length=150, blank=True, null=True)
    manufacturer = models.CharField(max_length=150, blank=True, null=True)
    dosage = models.CharField(max_length=100, blank=True, null=True)
    
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_price_list = models.JSONField(default=list, blank=True)
    min_order_quantity = models.PositiveIntegerField(default=1)
    stock_quantity = models.PositiveIntegerField(default=0)
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='medicines')
    subCategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='medicines')
    
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='medicines')
    
    requires_prescription = models.BooleanField(default=False)
    bestseller = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=False)
    
    image = models.JSONField(default=list, blank=True)
    
    views_count = models.PositiveIntegerField(default=0)
    sales_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-bestseller', '-sales_count', '-created_at']
        indexes = [
            models.Index(fields=['pharmacy', 'is_active', 'is_approved']),
            models.Index(fields=['category', 'subCategory']),
            models.Index(fields=['-bestseller', '-sales_count']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} - {self.pharmacy.name} ({self.category.name if self.category else 'No Category'})"
    
    def is_in_stock(self):
        return self.stock_quantity > 0
    
    def is_visible_on_platform(self):
        return self.is_active and self.is_approved and self.is_in_stock()


# ===============================
# 7. Cart Model
# ===============================
class Cart(models.Model):
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='carts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def total_amount(self):
        return sum(item.subtotal() for item in self.items.all())
    
    def item_count(self):
        return sum(item.quantity for item in self.items.all())
    
    def get_pharmacies(self):
        return set(item.medicine.pharmacy for item in self.items.all())

    def __str__(self):
        return f"Cart of {self.user.first_name} ({self.item_count()} items)"


# ===============================
# 8. Cart Item Model
# ===============================
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    selected_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_package = models.BooleanField(default=False)
    package_details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('cart', 'medicine')
    
    def subtotal(self):
        return float(self.quantity) * float(self.selected_price)
    
    def __str__(self):
        return f"{self.quantity}x {self.medicine.name} in cart"


# ===============================
# 9. Order Model
# ===============================
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('pending_prescription', 'Pending Prescription'),
        ('under_review', 'Under Review'),
        ('validated', 'Validated'),
        ('preparing', 'Preparing'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('in_delivery', 'In Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='orders')
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    
    delivery_address = models.TextField(blank=True, null=True)
    delivery_phone = models.CharField(max_length=20, blank=True, null=True)
    
    customer_notes = models.TextField(blank=True, null=True)
    pharmacy_notes = models.TextField(blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['pharmacy', 'status']),
            models.Index(fields=['-order_date']),
        ]

    def save(self, *args, **kwargs):
        if not self.order_number:
            import uuid
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number} - {self.user.first_name} from {self.pharmacy.name}"


# ===============================
# 10. OrderItem Model
# ===============================
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.SET_NULL, null=True)
    medicine_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    is_package = models.BooleanField(default=False)
    package_details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.quantity} × {self.medicine_name} in Order {self.order.order_number}"


# ===============================
# 11. Prescription Model
# ===============================
class Prescription(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='prescription')
    file_path = models.FileField(upload_to='prescriptions/')
    upload_date = models.DateTimeField(auto_now_add=True)
    is_validated = models.BooleanField(default=False)
    validated_by = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_prescriptions')
    validation_date = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Prescription for Order {self.order.order_number}"


# ===============================
# 12. Payment Model
# ===============================
class Payment(models.Model):
    METHOD_CHOICES = [
        ('mobile_money', 'Mobile Money'),
        ('paypal', 'PayPal'),
        ('credit_card', 'Credit Card'),
        ('cash_on_delivery', 'Cash on Delivery'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_date = models.DateTimeField(auto_now_add=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.payment_method} - {self.payment_status} ({self.order.order_number})"


# ===============================
# 13. Delivery Model
# ===============================
class Delivery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Assignment'),
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('in_progress', 'In Progress'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('returned', 'Returned'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    delivery_person = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    assigned_date = models.DateTimeField(blank=True, null=True)
    pickup_date = models.DateTimeField(blank=True, null=True)
    delivery_date = models.DateTimeField(blank=True, null=True)
    delivery_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    tracking_number = models.CharField(max_length=50, blank=True, null=True)
    estimated_delivery_time = models.DateTimeField(blank=True, null=True)
    actual_delivery_time = models.DateTimeField(blank=True, null=True)
    
    delivery_notes = models.TextField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    current_latitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    current_longitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery for Order {self.order.order_number} - {self.delivery_status}"


# ===============================
# 14. Notification Model
# ===============================
class Notification(models.Model):
    TYPE_CHOICES = [
        ('order', 'Order Update'),
        ('payment', 'Payment Update'),
        ('delivery', 'Delivery Update'),
        ('promotion', 'Promotion'),
        ('system', 'System Message'),
        ('prescription', 'Prescription Update'),
    ]
    STATUS_CHOICES = [
        ('read', 'Read'),
        ('unread', 'Unread'),
    ]
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=100, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=200, blank=True, null=True)
    content = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    send_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unread')
    read_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-send_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['-send_date']),
        ]

    def __str__(self):
        return f"Notification for {self.user.first_name} - {self.type} ({self.status})"


# ===============================
# 15. PharmacyReview Model
# ===============================
class PharmacyReview(models.Model):
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='pharmacy_reviews')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='pharmacy_review')
    
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, null=True)
    
    service_rating = models.PositiveSmallIntegerField(default=0)
    delivery_rating = models.PositiveSmallIntegerField(default=0)
    price_rating = models.PositiveSmallIntegerField(default=0)
    
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('pharmacy', 'user', 'order')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.first_name} - {self.pharmacy.name} ({self.rating}★)"

"""
# ===============================
# 1. User Model
# ===============================
class AppUser(models.Model):
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('pharmacist', 'Pharmacist'),
        ('delivery', 'Delivery Person'),
        ('admin', 'Administrator'),
    ]

    id_user = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')

    def __str__(self):
        #return f"{self.first_name} {self.last_name} ({self.role})"


# ===============================
# 2. Pharmacy Model
# ===============================
class Pharmacy(models.Model):
    name = models.CharField(max_length=150)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    is_open = models.BooleanField(default=True)
    owner = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='pharmacies')
    
    #  Informations supplémentaires pour la vitrine
    logo = models.ImageField(upload_to='pharmacy_logos/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    opening_hours = models.JSONField(default=dict, blank=True)  # Ex: {"monday": "8:00-20:00"}
    is_verified = models.BooleanField(default=False)  # Vérification par admin MedEx
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Pharmacies"
        ordering = ['-is_verified', '-rating', 'name']

    def __str__(self):
        #return self.name


# ===============================
# 3. Category Model
# ===============================
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        #return self.name


# ===============================
# 4. SubCategory Model
# ===============================
class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('category', 'name')
        verbose_name_plural = "SubCategories"
        ordering = ['category__name', 'name']

    def __str__(self):
        #return f"{self.category.name} - {self.name}"


# ===============================
# 5. Medicine Model - PRODUIT PRINCIPAL
# ===============================
class Medicine(models.Model):
    
     #MODÈLE PRINCIPAL : Les pharmacies créent directement leurs produits ici.
    #Chaque médicament appartient à UNE pharmacie et est affiché sur la vitrine MedEx.
    
    # Informations du médicament
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    generic_name = models.CharField(max_length=150, blank=True, null=True)
    manufacturer = models.CharField(max_length=150, blank=True, null=True)
    dosage = models.CharField(max_length=100, blank=True, null=True)  # Ex: "500mg"
    
    # Prix et stock
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_price_list = models.JSONField(default=list, blank=True)  # Packs de prix
    min_order_quantity = models.PositiveIntegerField(default=1)
    stock_quantity = models.PositiveIntegerField(default=0)  # Stock disponible
    
    # Catégorisation
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='medicines')
    subCategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='medicines')
    
    #  Lien vers la pharmacie propriétaire
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='medicines')
    
    # Statut et promotion
    requires_prescription = models.BooleanField(default=False)
    bestseller = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)  # La pharmacie peut désactiver temporairement
    is_approved = models.BooleanField(default=False)  #  Validation par admin MedEx avant affichage
    
    # Images
    image = models.JSONField(default=list, blank=True)
    
    # Statistiques
    views_count = models.PositiveIntegerField(default=0)
    sales_count = models.PositiveIntegerField(default=0)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-bestseller', '-sales_count', '-created_at']
        indexes = [
            models.Index(fields=['pharmacy', 'is_active', 'is_approved']),
            models.Index(fields=['category', 'subCategory']),
            models.Index(fields=['-bestseller', '-sales_count']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        #return f"{self.name} - {self.pharmacy.name} ({self.category.name if self.category else 'No Category'})"
    
    def is_in_stock(self):
        Vérifie si le produit est en stock
        #return self.stock_quantity > 0
    
    def is_visible_on_platform(self):
        Vérifie si le produit peut être affiché sur MedEx
        #return self.is_active and self.is_approved and self.is_in_stock()




# ===============================
# 7. Cart Model
# ===============================
class Cart(models.Model):
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='carts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def total_amount(self):
        #return sum(item.subtotal() for item in self.items.all())
    
    def item_count(self):
        #return sum(item.quantity for item in self.items.all())
    
    def get_pharmacies(self):
        Retourne les pharmacies présentes dans le panier
        #return set(item.medicine.pharmacy for item in self.items.all())

    def __str__(self):
        return f"Cart of {self.user.first_name} ({self.item_count()} items)"


# ===============================
# 8. Cart Item Model
# ===============================
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    selected_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_package = models.BooleanField(default=False)
    package_details = models.JSONField(default=dict, blank=True)

    def subtotal(self):
        return self.selected_price * self.quantity

    def __str__(self):
        #return f"{self.quantity} × {self.medicine.name} from {self.medicine.pharmacy.name}"


# ===============================
# 9. Order Model
# ===============================
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('pending_prescription', 'Pending Prescription'),
        ('under_review', 'Under Review'),
        ('validated', 'Validated'),
        ('preparing', 'Preparing'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('in_delivery', 'In Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='orders')
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    
    # Adresse de livraison
    delivery_address = models.TextField(blank=True, null=True)
    delivery_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Notes
    customer_notes = models.TextField(blank=True, null=True)
    pharmacy_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['pharmacy', 'status']),
            models.Index(fields=['-order_date']),
        ]

    def save(self, *args, **kwargs):
        if not self.order_number:
            import uuid
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        #return f"Order {self.order_number} - {self.user.first_name} from {self.pharmacy.name}"


# ===============================
# 10. OrderItem Model
# ===============================
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.SET_NULL, null=True)
    medicine_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    is_package = models.BooleanField(default=False)
    package_details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        #return f"{self.quantity} × {self.medicine_name} in Order {self.order.order_number}"


# ===============================
# 11. Prescription Model
# ===============================
class Prescription(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='prescription')
    file_path = models.FileField(upload_to='prescriptions/')
    upload_date = models.DateTimeField(auto_now_add=True)
    is_validated = models.BooleanField(default=False)
    validated_by = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_prescriptions')
    validation_date = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        #return f"Prescription for Order {self.order.order_number}"


# ===============================
# 12. Payment Model
# ===============================
class Payment(models.Model):
    METHOD_CHOICES = [
        ('mobile_money', 'Mobile Money'),
        ('paypal', 'PayPal'),
        ('credit_card', 'Credit Card'),
        ('cash_on_delivery', 'Cash on Delivery'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_date = models.DateTimeField(auto_now_add=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        #return f"Payment {self.payment_method} - {self.payment_status} ({self.order.order_number})"


# ===============================
# 13. Delivery Model
# ===============================
class Delivery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Assignment'),
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('in_progress', 'In Progress'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('returned', 'Returned'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    delivery_person = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    assigned_date = models.DateTimeField(blank=True, null=True)
    pickup_date = models.DateTimeField(blank=True, null=True)
    delivery_date = models.DateTimeField(blank=True, null=True)
    delivery_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    tracking_number = models.CharField(max_length=50, blank=True, null=True)
    estimated_delivery_time = models.DateTimeField(blank=True, null=True)
    actual_delivery_time = models.DateTimeField(blank=True, null=True)
    
    delivery_notes = models.TextField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    current_latitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    current_longitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        #return f"Delivery for Order {self.order.order_number} - {self.delivery_status}"


# ===============================
# 14. Notification Model
# ===============================
class Notification(models.Model):
    TYPE_CHOICES = [
        ('order', 'Order Update'),
        ('payment', 'Payment Update'),
        ('delivery', 'Delivery Update'),
        ('promotion', 'Promotion'),
        ('system', 'System Message'),
        ('prescription', 'Prescription Update'),
    ]
    STATUS_CHOICES = [
        ('read', 'Read'),
        ('unread', 'Unread'),
    ]
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=100, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=200, blank=True, null=True)
    content = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    send_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unread')
    read_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-send_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['-send_date']),
        ]

    def __str__(self):
        #return f"Notification for {self.user.first_name} - {self.type} ({self.status})"


# ===============================
# 15. PharmacyReview Model
# ===============================
class PharmacyReview(models.Model):
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='pharmacy_reviews')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='pharmacy_review')
    
    rating = models.PositiveSmallIntegerField()  # 1-5 étoiles
    comment = models.TextField(blank=True, null=True)
    
    service_rating = models.PositiveSmallIntegerField(default=0)
    delivery_rating = models.PositiveSmallIntegerField(default=0)
    price_rating = models.PositiveSmallIntegerField(default=0)
    
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('pharmacy', 'user', 'order')
        ordering = ['-created_at']

    def __str__(self):
        #return f"{self.user.first_name} - {self.pharmacy.name} ({self.rating}★)"
"""