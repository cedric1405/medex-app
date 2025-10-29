from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('product/user/list', views.product_list, name='product_list'),
    path('product/<int:pk>/', views.product_detail, name='product_detail'),  #  Ajout du slash final
    path('order/settings', views.order_settings, name='order_settings'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)