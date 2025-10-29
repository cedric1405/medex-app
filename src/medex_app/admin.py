from django.contrib import admin
from medex_app.models import*

# Register your models here.
admin.site.register(AppUser)
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
admin.site.register(PharmacyReview)

