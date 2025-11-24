from django.urls import path
from . import views
from . import admin_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Auth endpoints
    path('api/register', views.register_user, name='register_user'),
    path('api/login', views.login_user, name='login_user'),
    path('api/logout', views.logout_user, name='logout_user'),
    path('api/profile', views.get_user_profile, name='get_user_profile'),
    path('api/profile/status', views.check_user_profile_status, name='check_user_profile_status'),
    
    # Pharmacy registration
    path('api/pharmacy/register', views.register_pharmacy, name='register_pharmacy'),
    
    # Pharmacy Dashboard - Products Management
    path('api/pharmacy/products', views.get_pharmacy_products, name='get_pharmacy_products'),
    path('api/pharmacy/products/add', views.add_product, name='add_product'),
    path('api/pharmacy/products/<int:product_id>/update', views.update_product, name='update_product'),
    path('api/pharmacy/products/<int:product_id>/delete', views.delete_product, name='delete_product'),
    path('api/pharmacy/products/import', views.import_products_excel, name='import_products_excel'),
    
    # Categories
    path('api/categories', views.get_categories, name='get_categories'),
    path('api/categories/<int:category_id>/subcategories', views.get_subcategories, name='get_subcategories'),
    
    # Product endpoints (public)
    path('api/product/user/list', views.product_list, name='product_list'),
    path('api/product/<int:pk>/', views.product_detail, name='product_detail'),
    path('api/pharmacy/<int:pharmacy_id>/products/', views.pharmacy_products, name='pharmacy_products'),
    path('api/order/settings', views.order_settings, name='order_settings'),
    
    # Cart Management
    path('api/cart', views.get_cart, name='get_cart'),
    path('api/cart/add', views.add_to_cart, name='add_to_cart'),
    path('api/cart/item/<int:item_id>', views.update_cart_item, name='update_cart_item'),
    path('api/cart/item/<int:item_id>', views.remove_from_cart, name='remove_from_cart'),
    path('api/cart/clear', views.clear_cart, name='clear_cart'),
    path('api/cart/summary', views.cart_summary, name='cart_summary'),
    
    # ===========================
    # ADMIN AUTHENTICATION (2FA)
    # ===========================
    path('api/admin/login/request-otp', admin_views.admin_login_request_otp, name='admin-request-otp'),
    path('api/admin/login/verify-otp', admin_views.admin_verify_otp, name='admin-verify-otp'),
    
    # ===========================
    # ADMIN DASHBOARD
    # ===========================
    path('api/admin/dashboard/stats', admin_views.admin_dashboard_stats, name='admin-dashboard-stats'),
    
    # ===========================
    # PHARMACY MANAGEMENT
    # ===========================
    path('api/admin/pharmacies', admin_views.admin_get_pharmacies, name='admin-get-pharmacies'),
    path('api/admin/pharmacies/<int:pharmacy_id>/verify', admin_views.admin_verify_pharmacy, name='admin-verify-pharmacy'),
    path('api/admin/pharmacies/<int:pharmacy_id>/reject', admin_views.admin_reject_pharmacy, name='admin-reject-pharmacy'),
    
    # ===========================
    # PRODUCT MANAGEMENT
    # ===========================
    path('api/admin/products', admin_views.admin_get_products, name='admin-get-products'),
    path('api/admin/products/<int:product_id>/approve', admin_views.admin_approve_product, name='admin-approve-product'),
    path('api/admin/products/<int:product_id>/reject', admin_views.admin_reject_product, name='admin-reject-product'),
    
    # ===========================
    # Delivery Management
    # ===========================
    #path("api/orders/", views.delivery_orders, name="delivery-orders"),
    #path("api/orders/<int:order_id>/status/", views.update_delivery_status, name="delivery-update-status"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)