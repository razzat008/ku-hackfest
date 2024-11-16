from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('geo-data/', views.get_geo_data, name='get_geo_data'),
]
