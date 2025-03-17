from rest_framework import viewsets
from .models import SentencePair, Alignment
from .serializers import SentencePairSerializer, AlignmentSerializer

class SentencePairViewSet(viewsets.ModelViewSet):
    queryset = SentencePair.objects.all()
    serializer_class = SentencePairSerializer

class AlignmentViewSet(viewsets.ModelViewSet):
    queryset = Alignment.objects.all()
    serializer_class = AlignmentSerializer
    
    def perform_create(self, serializer):
        serializer.save()