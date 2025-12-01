# Booking_Backend/urls.py (project urls)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('Room_Booking.urls')),            # app endpoints at root
    path('api-auth/', include('rest_framework.urls')), # optional browsable login
]
