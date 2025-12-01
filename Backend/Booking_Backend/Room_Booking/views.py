# Room_Booking/views.py
from datetime import datetime, timedelta

from django.shortcuts import get_object_or_404
from django.conf import settings

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from .models import Room, OccupiedDate, User
from .serializers import RoomSerializer, OccupiedDateSerializer, UserSerializer
from .permissions import IsAdminOrReadOnly


# --- API root for docs/frontend ---
@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'rooms': reverse('room-list', request=request, format=format)
    })


# --- Rooms ---
class RoomList(generics.ListCreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminOrReadOnly]


class RoomDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminOrReadOnly]


# --- OccupiedDates ---
class OccupiedDatesList(generics.ListCreateAPIView):
    queryset = OccupiedDate.objects.all()
    serializer_class = OccupiedDateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        # only filter if model has 'user' field
        try:
            OccupiedDate._meta.get_field('user')
            has_user_field = True
        except Exception:
            has_user_field = False

        if not user.is_superuser and not user.is_staff and has_user_field:
            return OccupiedDate.objects.filter(user=user)
        return super().get_queryset()


class OccupiedDatesDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = OccupiedDate.objects.all()
    serializer_class = OccupiedDateSerializer
    permission_classes = [IsAdminOrReadOnly]


# --- Users ---
class UserList(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=user.id)


class UsersDetail(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if obj == user or user.is_staff or user.is_superuser:
            return obj
        raise PermissionDenied("You do not have permission to view this user.")


# --- Register / Login ---
class Register(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        self.response_data = {
            "user": {
                "id": user.id,
                "username": user.email,
                "email": user.email,
                "full_name": getattr(user, "full_name", "")
            },
            "token": token.key
        }

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return Response(self.response_data)


class Login(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            raise AuthenticationFailed('Invalid username or password')

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "user": {
                "id": user.id,
                "username": user.email,
                "email": user.email,
                "full_name": getattr(user, "full_name", "")
            },
            "token": token.key
        })


# --- Booking endpoint: POST /rooms/<pk>/book/ ---
class RoomBook(APIView):
    """
    Accepts JSON body: { "from_date":"YYYY-MM-DD", "to_date":"YYYY-MM-DD" }
    Creates one OccupiedDate row per day in the inclusive date range.
    Requires Token authentication (Authorization: Token <token>)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, format=None):
        room = get_object_or_404(Room, pk=pk)

        from_date_str = request.data.get("from_date")
        to_date_str = request.data.get("to_date")

        if not from_date_str or not to_date_str:
            return Response({"detail": "from_date and to_date are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        # parse dates
        try:
            from_date = datetime.strptime(from_date_str, "%Y-%m-%d").date()
            to_date = datetime.strptime(to_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "Dates must be in YYYY-MM-DD format."},
                            status=status.HTTP_400_BAD_REQUEST)

        if from_date > to_date:
            return Response({"detail": "from_date must be before or equal to to_date."},
                            status=status.HTTP_400_BAD_REQUEST)

        # collect dates in range
        days = (to_date - from_date).days + 1
        date_list = [from_date + timedelta(days=i) for i in range(days)]

        # check overlaps: if any of these dates already booked for this room -> error
        overlapping = OccupiedDate.objects.filter(room=room, date__in=date_list)
        if overlapping.exists():
            # return list of conflicting dates
            conflict_dates = sorted({o.date.isoformat() for o in overlapping})
            return Response(
                {"detail": "Dates already booked", "conflicts": conflict_dates},
                status=status.HTTP_400_BAD_REQUEST
            )

        # create OccupiedDate rows
        created = []
        for d in date_list:
            occ = OccupiedDate.objects.create(room=room, user=request.user, date=d)
            created.append({
                "id": occ.id,
                "room": room.id,
                "date": occ.date.isoformat(),
                "user": getattr(request.user, "email", str(request.user))
            })

        return Response({
            "created": created,
            "message": f"Booked {len(created)} day(s) for room {room.id}."
        }, status=status.HTTP_201_CREATED)

