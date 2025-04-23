from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SentencePairViewSet, AlignmentViewSet
from . import views

router = DefaultRouter()
router.register(r'sentence-pairs', SentencePairViewSet)
router.register(r'alignments', AlignmentViewSet)

urlpatterns = [
    path('', include(router.urls)), 
]