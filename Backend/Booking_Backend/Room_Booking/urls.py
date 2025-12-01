# Room_Booking/urls.py
from django.urls import path
from . import views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('', views.api_root, name="api-root"),
    path("rooms/", views.RoomList.as_view(), name="room-list"),
    path("rooms/<int:pk>/", views.RoomDetail.as_view(), name="room-detail"),
    path("rooms/<int:pk>/book/", views.RoomBook.as_view(), name="room-book"),   # <-- booking path
    path("occupied-dates/", views.OccupiedDatesList.as_view(), name="occupieddate-list"),
    path("occupied-dates/<int:pk>/", views.OccupiedDatesDetail.as_view(), name="occupieddate-detail"),
    path("users/", views.UserList.as_view(), name="user-list"),
    path("users/<int:pk>/", views.UsersDetail.as_view(), name="user-detail"),
    path("login/", views.Login.as_view(), name="login"),
    path("register/", views.Register.as_view(), name="register"),
]

urlpatterns = format_suffix_patterns(urlpatterns)
