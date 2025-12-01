from rest_framework import serializers
from .models import Room, RoomImage, OccupiedDate, User
from django.contrib.auth.hashers import make_password

class RoomImageSerializer(serializers.ModelSerializer):
    room = serializers.HyperlinkedRelatedField(
        view_name='room-detail',
        queryset=Room.objects.all()
    )

    class Meta:
        model = RoomImage
        fields = ['id', 'image', 'caption', 'room']


class OccupiedDateSerializer(serializers.HyperlinkedModelSerializer):
    room = serializers.HyperlinkedRelatedField(
        view_name='room-detail',
        queryset=Room.objects.all()
    )
    user = serializers.HyperlinkedRelatedField(
        view_name='user-detail',
        queryset=User.objects.all()
    )

    class Meta:
        model = OccupiedDate
        fields = ['url', 'id', 'room', 'user', 'date']
        extra_kwargs = {
            'url': {'view_name': 'occupieddate-detail', 'lookup_field': 'pk'}
        }


class RoomSerializer(serializers.HyperlinkedModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    occupiedDates = OccupiedDateSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            'url', 'id', 'name', 'type', 'pricePerNight', 'currency',
            'maxOccupancy', 'description', 'images', 'occupiedDates'
        ]
        extra_kwargs = {
            'url': {'view_name': 'room-detail', 'lookup_field': 'pk'}
        }


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'id', 'username', 'password', 'email', 'full_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'url': {'view_name': 'user-detail', 'lookup_field': 'pk'}
        }

    def validate_password(self, value):
        return make_password(value)

