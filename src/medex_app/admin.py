from django.contrib import admin
from medex_app.models import*

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import AppUser, Pharmacy, Medicine, Category, SubCategory, Cart, CartItem

class AppUserAdmin(UserAdmin):
    """Configuration admin pour AppUser avec AbstractUser"""
    model = AppUser
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'address')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role', 'is_active', 'is_staff')}
        ),
    )
    
    
    
@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'phone', 'is_verified', 'is_open', 'rating', 'created_at']
    list_filter = ['is_verified', 'is_open', 'created_at']
    search_fields = ['name', 'address', 'owner__email']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['verify_pharmacies', 'unverify_pharmacies']
    
    def verify_pharmacies(self, request, queryset):
        queryset.update(is_verified=True)
        self.message_user(request, f"{queryset.count()} pharmacies verified successfully.")
    verify_pharmacies.short_description = "Verify selected pharmacies"
    
    def unverify_pharmacies(self, request, queryset):
        queryset.update(is_verified=False)
        self.message_user(request, f"{queryset.count()} pharmacies unverified.")
    unverify_pharmacies.short_description = "Unverify selected pharmacies"

admin.site.register(AppUser, AppUserAdmin)
admin.site.register(Medicine)
admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(Cart)
admin.site.register(CartItem)


"""admin.site.register(AppUser)
admin.site.register(Pharmacy)
admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(Medicine)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Order)
admin.site.register(Prescription)
admin.site.register(Payment)
admin.site.register(Delivery)
admin.site.register(Notification)
admin.site.register(PharmacyReview)"""

